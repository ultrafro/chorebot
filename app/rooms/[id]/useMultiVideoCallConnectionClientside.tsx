import { UsePeerResult } from "@/app/hooks/usePeer";
import { StereoLayout } from "@/app/teletable.model";
import { MediaConnection } from "peerjs";
import { useCallback, useEffect, useRef, useState } from "react";

export interface RemoteCameraStream {
  cameraId: string;
  label: string;
  stream: MediaStream;
  stereoLayout: StereoLayout;
}

interface IncomingCallInfo {
  call: MediaConnection;
  cameraId: string;
  label: string;
  stream: MediaStream | null;
  stereoLayout: StereoLayout;
}

const RECONNECT_DELAY = 2000; // ms to wait before reconnecting
const MAX_RECONNECT_ATTEMPTS = 10;

export function useMultiVideoCallConnectionClientside(
  hostPeerId: string,
  peer: UsePeerResult
): RemoteCameraStream[] {
  const [remoteCameraStreams, setRemoteCameraStreams] = useState<
    RemoteCameraStream[]
  >([]);

  // Track all incoming calls from host
  const incomingCallsRef = useRef<Map<string, IncomingCallInfo>>(new Map());

  // Track the initial outgoing call to host
  const outgoingCallRef = useRef<MediaConnection | null>(null);
  const initialCameraKeyRef = useRef<string | null>(null);

  // Track if we've initiated the connection
  const hasInitiatedRef = useRef(false);
  // Track latest host peer ID without forcing listener rebinds
  const hostPeerIdRef = useRef(hostPeerId);
  // Track previous host peer ID to detect changes
  const prevHostPeerIdRef = useRef<string | null>(null);
  // Reconnect attempts counter
  const reconnectAttemptsRef = useRef(0);
  // Reconnect timeout ref
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update host peer ID ref
  useEffect(() => {
    hostPeerIdRef.current = hostPeerId;
  }, [hostPeerId]);

  // Create fake video stream for initial call
  const createFakeVideoStream = useCallback((): MediaStream => {
    const fakeVideoStream = new MediaStream();
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.fillText("Multi-Camera Client", 10, 30);
    }
    const videoTrack = canvas.captureStream(10).getVideoTracks()[0];
    if (videoTrack) {
      fakeVideoStream.addTrack(videoTrack);
    }
    return fakeVideoStream;
  }, []);

  // Update state from the ref map
  const updateStreamsState = useCallback(() => {
    const streams: RemoteCameraStream[] = [];
    incomingCallsRef.current.forEach((callInfo) => {
      if (callInfo.stream) {
        streams.push({
          cameraId: callInfo.cameraId,
          label: callInfo.label,
          stream: callInfo.stream,
          stereoLayout: callInfo.stereoLayout,
        });
      }
    });
    setRemoteCameraStreams(streams);
  }, []);

  // Clean up existing connections
  const cleanupConnections = useCallback(() => {
    console.log("[MultiCam Client] Cleaning up existing connections");

    // Close outgoing call
    if (outgoingCallRef.current) {
      try {
        outgoingCallRef.current.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      outgoingCallRef.current = null;
    }

    // Close all incoming calls
    incomingCallsRef.current.forEach((callInfo) => {
      try {
        callInfo.call.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    incomingCallsRef.current.clear();
    initialCameraKeyRef.current = null;
    hasInitiatedRef.current = false;
    setRemoteCameraStreams([]);
  }, []);

  // Initiate connection to host
  const initiateConnection = useCallback(() => {
    if (!peer.peer || !peer.isConnected || !hostPeerIdRef.current) {
      console.log("[MultiCam Client] Cannot initiate connection - peer not ready or no host ID");
      return false;
    }

    if (hasInitiatedRef.current) {
      console.log("[MultiCam Client] Already initiated connection");
      return true;
    }

    const currentHostPeerId = hostPeerIdRef.current;
    console.log("[MultiCam Client] Initiating connection to host:", currentHostPeerId);

    hasInitiatedRef.current = true;
    reconnectAttemptsRef.current = 0;

    // Make initial call to host to signal we want to receive streams
    const fakeStream = createFakeVideoStream();
    const call = peer.peer.call(currentHostPeerId, fakeStream, {
      metadata: { type: "multi-camera-client" },
    });

    if (!call) {
      console.error("[MultiCam Client] Failed to establish initial call to host");
      hasInitiatedRef.current = false;
      return false;
    }

    outgoingCallRef.current = call;

    // The host responds with a fake stream on the initial call (just for handshake)
    // Real camera streams come via separate calls with metadata
    call.on("stream", (stream: MediaStream) => {
      const videoTracks = stream.getVideoTracks();
      const trackStates = videoTracks.map((t) => ({
        id: t.id,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState,
      }));
      console.log("[MultiCam Client] Received stream on initial call", trackStates);

      // Ignore fake/empty streams - real cameras come via incoming calls with metadata
      if (videoTracks.length === 0) {
        console.log("[MultiCam Client] Ignoring empty stream from initial call");
        return;
      }

      // Fallback: if host sends a real stream here (legacy behavior), store it
      const defaultCameraId = call.connectionId || "__initial_call__";
      initialCameraKeyRef.current = defaultCameraId;
      const callInfo: IncomingCallInfo = {
        call,
        cameraId: defaultCameraId,
        label: "Default Camera",
        stream,
        stereoLayout: "mono",
      };
      incomingCallsRef.current.set(defaultCameraId, callInfo);
      updateStreamsState();
    });

    call.on("close", () => {
      console.log("[MultiCam Client] Initial call closed - will attempt reconnect");
      const initialKey = initialCameraKeyRef.current;
      if (initialKey) {
        incomingCallsRef.current.delete(initialKey);
        initialCameraKeyRef.current = null;
      }
      updateStreamsState();

      // Schedule reconnection if we still have a valid host
      scheduleReconnect();
    });

    call.on("error", (err) => {
      console.error("[MultiCam Client] Initial call error:", err);
      // Schedule reconnection on error
      scheduleReconnect();
    });

    return true;
  }, [peer.peer, peer.isConnected, createFakeVideoStream, updateStreamsState]);

  // Schedule a reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log("[MultiCam Client] Max reconnect attempts reached");
      return;
    }

    if (!hostPeerIdRef.current || !peer.isConnected) {
      console.log("[MultiCam Client] Cannot reconnect - no host or peer not connected");
      return;
    }

    reconnectAttemptsRef.current++;
    const delay = RECONNECT_DELAY * Math.min(reconnectAttemptsRef.current, 5);

    console.log(`[MultiCam Client] Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("[MultiCam Client] Attempting reconnect...");
      hasInitiatedRef.current = false;
      initiateConnection();
    }, delay);
  }, [peer.isConnected, initiateConnection]);

  // Handle an incoming call from the host
  const handleIncomingCall = useCallback(
    (call: MediaConnection) => {
      const metadata = call.metadata as { cameraId?: string; label?: string; stereoLayout?: StereoLayout };
      const cameraId = metadata?.cameraId || call.connectionId;
      const label = metadata?.label || "Unknown Camera";
      const stereoLayout = metadata?.stereoLayout || "mono";

      console.log(
        `[MultiCam Client] Incoming call for camera: ${cameraId} (${label}) stereo: ${stereoLayout}`
      );

      // Reset reconnect counter on successful incoming call
      reconnectAttemptsRef.current = 0;

      // Store call info
      const callInfo: IncomingCallInfo = {
        call,
        cameraId,
        label,
        stream: null,
        stereoLayout,
      };
      incomingCallsRef.current.set(cameraId, callInfo);

      // Answer with fake stream
      const fakeStream = createFakeVideoStream();
      call.answer(fakeStream);

      // Listen for the stream
      call.on("stream", (stream: MediaStream) => {
        const trackStates = stream
          .getVideoTracks()
          .map((t) => ({
            id: t.id,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          }));
        console.log(
          `[MultiCam Client] Received stream for camera: ${cameraId}`,
          trackStates
        );
        const existingInfo = incomingCallsRef.current.get(cameraId);
        if (existingInfo) {
          existingInfo.stream = stream;
          incomingCallsRef.current.set(cameraId, existingInfo);
          updateStreamsState();
        }
      });

      // Handle call close - this is normal when camera is turned off
      call.on("close", () => {
        console.log(`[MultiCam Client] Call closed for camera: ${cameraId}`);
        incomingCallsRef.current.delete(cameraId);
        updateStreamsState();
        // Don't schedule reconnect for individual camera close - this is expected behavior
      });

      // Handle call error
      call.on("error", (err) => {
        console.error(
          `[MultiCam Client] Call error for camera ${cameraId}:`,
          err
        );
        incomingCallsRef.current.delete(cameraId);
        updateStreamsState();
      });
    },
    [createFakeVideoStream, updateStreamsState]
  );

  // Listen for incoming calls from host (additional camera streams)
  useEffect(() => {
    if (!peer.peer || !peer.isConnected) {
      return;
    }

    console.log("[MultiCam Client] Setting up incoming call listener");

    const callHandler = (call: MediaConnection) => {
      // Only handle calls from the current host
      const expectedHostPeerId = hostPeerIdRef.current;
      if (!expectedHostPeerId || call.peer === expectedHostPeerId) {
        handleIncomingCall(call);
      }
    };

    peer.peer.on("call", callHandler);

    return () => {
      peer.peer?.off("call", callHandler);
    };
  }, [peer.peer, peer.isConnected, handleIncomingCall]);

  // Detect host peer ID change and reconnect
  useEffect(() => {
    if (!hostPeerId) {
      return;
    }

    // If host peer ID changed, we need to reconnect
    if (prevHostPeerIdRef.current && prevHostPeerIdRef.current !== hostPeerId) {
      console.log(`[MultiCam Client] Host peer ID changed from ${prevHostPeerIdRef.current} to ${hostPeerId}, reconnecting...`);
      cleanupConnections();
      reconnectAttemptsRef.current = 0;
      // Small delay to allow cleanup
      setTimeout(() => {
        initiateConnection();
      }, 500);
    }

    prevHostPeerIdRef.current = hostPeerId;
  }, [hostPeerId, cleanupConnections, initiateConnection]);

  // Initial connection
  useEffect(() => {
    if (!peer.peer || !peer.isConnected || !hostPeerId) {
      return;
    }

    if (!hasInitiatedRef.current) {
      initiateConnection();
    }
  }, [peer.peer, peer.isConnected, hostPeerId, initiateConnection]);

  // Handle peer connection drop
  useEffect(() => {
    if (!peer.isConnected) {
      console.log("[MultiCam Client] Peer connection dropped, clearing streams");
      hasInitiatedRef.current = false;
      initialCameraKeyRef.current = null;
      incomingCallsRef.current.clear();
      setRemoteCameraStreams([]);

      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [peer.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[MultiCam Client] Unmounting, cleaning up all calls");

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Close outgoing call
      if (outgoingCallRef.current) {
        outgoingCallRef.current.close();
        outgoingCallRef.current = null;
      }

      // Close all incoming calls
      incomingCallsRef.current.forEach((callInfo) => {
        callInfo.call.close();
      });
      incomingCallsRef.current.clear();
      initialCameraKeyRef.current = null;
      hasInitiatedRef.current = false;
    };
  }, []);

  return remoteCameraStreams;
}
