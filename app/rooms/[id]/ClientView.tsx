import router from "next/router";
import {
  ClientRoomInfo,
  ClientRoomInfoResponse,
  RoomData,
} from "./roomUI.model";
import { useCallback, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UsePeerJSResult } from "@/app/hooks/usePeerJS";
import { getAuthHeaders } from "@/app/lib/authHeaders";
import { MediaConnection } from "peerjs";

export default function ClientView({
  roomData,
  peerJS,
  user,
}: {
  roomData: RoomData;
  peerJS: UsePeerJSResult;
  user: User | null;
}) {
  const [isRequestingControl, setIsRequestingControl] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleRequestControl = useCallback(async () => {
    if (!user?.id || !roomData.roomId) {
      console.error("Missing user ID or room ID");
      return;
    }

    setIsRequestingControl(true);
    setRequestStatus(null);

    try {
      const response = await fetch("/api/requestControl", {
        method: "POST",
        headers: getAuthHeaders(user),
        body: JSON.stringify({
          clientId: user.id,
          roomId: roomData.roomId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRequestStatus("Request sent successfully!");
      } else {
        setRequestStatus(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error requesting control:", error);
      setRequestStatus("Network error occurred");
    } finally {
      setIsRequestingControl(false);
    }
  }, [user, roomData.roomId]);

  const isInControl = user?.id === roomData.currentControllingClientId;

  const initiateVideoCall = useCallback(async () => {
    if (!roomData.hostPeerId || !peerJS.peer) {
      console.error("No host peer ID or PeerJS not initialized");
      return;
    }

    console.log("Initiating video call to host:", roomData.hostPeerId);

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const attemptCall = async (): Promise<void> => {
      try {
        const call = await peerJS.call(roomData.hostPeerId!);
        if (call) {
          setActiveCall(call);

          call.on("stream", (stream: MediaStream) => {
            console.log("Received video stream from host");
            setRemoteStream(stream);
          });

          call.on("close", () => {
            console.log("Video call closed");
            setActiveCall(null);
            setRemoteStream(null);
          });

          call.on("error", (err: any) => {
            console.error("Video call error:", err);
            setActiveCall(null);
            setRemoteStream(null);

            // If the call fails and we haven't exceeded retries, try again
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(
                `Retrying call (attempt ${retryCount}/${maxRetries}) in ${retryDelay}ms`
              );
              setTimeout(() => attemptCall(), retryDelay);
            }
          });
        }
      } catch (error) {
        console.error("Failed to initiate video call:", error);

        // If the call fails and we haven't exceeded retries, try again
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retrying call (attempt ${retryCount}/${maxRetries}) in ${retryDelay}ms`
          );
          setTimeout(() => attemptCall(), retryDelay);
        }
      }
    };

    // Add a small delay before first attempt to ensure host is ready
    setTimeout(() => attemptCall(), 1000);
  }, [roomData.hostPeerId, peerJS]);

  const handleRefreshConnection = useCallback(async () => {
    if (!isInControl) {
      return;
    }

    setIsRefreshingConnection(true);

    try {
      // Close existing call if any
      if (activeCall) {
        console.log("Closing existing call before refresh");
        activeCall.close();
        setActiveCall(null);
        setRemoteStream(null);
      }

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Initiate new call
      await initiateVideoCall();
    } catch (error) {
      console.error("Error refreshing connection:", error);
    } finally {
      setIsRefreshingConnection(false);
    }
  }, [isInControl, activeCall, initiateVideoCall]);

  // Initialize PeerJS when component mounts
  useEffect(() => {
    if (!peerJS.peer && !peerJS.isConnected) {
      peerJS.initializePeer().catch(console.error);
    }
  }, [peerJS]);

  // Handle video stream display
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle video calling when client gains control
  useEffect(() => {
    if (isInControl && roomData.hostPeerId && peerJS.peer && !activeCall) {
      console.log("Client gained control, initiating video call...");
      initiateVideoCall();
    }
  }, [
    isInControl,
    roomData.hostPeerId,
    peerJS.peer,
    activeCall,
    initiateVideoCall,
  ]);

  // Clean up video call when client loses control
  useEffect(() => {
    if (!isInControl && activeCall) {
      console.log("Client lost control, closing video call");
      activeCall.close();
      setActiveCall(null);
      setRemoteStream(null);
    }
  }, [isInControl, activeCall]);

  return (
    <div className="max-w-4xl mx-auto h-full">
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Client View</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-foreground/70">Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="bg-background rounded-lg border border-foreground/10 p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Host Stream
              {isInControl && (
                <span className="ml-2 text-sm text-green-600 font-normal">
                  (You have control)
                </span>
              )}
            </h3>
            <div className="aspect-video bg-foreground/5 rounded-lg overflow-hidden">
              {remoteStream && isInControl ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-foreground/50">
                    {isInControl
                      ? "Connecting to host stream..."
                      : "Waiting for host stream..."}
                  </p>
                </div>
              )}
            </div>
            {isInControl && (
              <div className="mt-2 space-y-2">
                <div className="text-sm text-foreground/70">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeCall ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                    <span>
                      {activeCall
                        ? "Video call active"
                        : "Establishing connection..."}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefreshConnection}
                  disabled={isRefreshingConnection}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                >
                  {isRefreshingConnection
                    ? "Refreshing..."
                    : "Refresh Connection"}
                </button>
              </div>
            )}
          </div>

          {!isInControl && (
            <div className="bg-background rounded-lg border border-foreground/10 p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Controls
              </h3>
              <div className="space-y-4">
                <button
                  onClick={handleRequestControl}
                  disabled={isRequestingControl || !user?.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {isRequestingControl ? "Requesting..." : "Request Control"}
                </button>
                {requestStatus && (
                  <p
                    className={`text-sm ${
                      requestStatus.includes("successfully")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {requestStatus}
                  </p>
                )}
                <p className="text-foreground/70 text-sm">
                  Click to request control from the host
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
