import { useState, useRef, useEffect } from "react";
import { useCamera } from "@/app/hooks/useCamera";
import { RoomData } from "./roomUI.model";
import { UsePeerJSResult } from "@/app/hooks/usePeerJS";
import { useAuth } from "@/app/lib/auth";

export default function HostView({
  roomData,
  peerJS,
}: {
  roomData: RoomData;
  peerJS: UsePeerJSResult;
}) {
  const { user } = useAuth();
  const camera = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitializingStream, setIsInitializingStream] = useState(false);
  const [isEndingStream, setIsEndingStream] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);

  // Display camera stream in video element when available
  useEffect(() => {
    if (videoRef.current && camera.stream) {
      videoRef.current.srcObject = camera.stream;
    }
  }, [camera.stream]);

  const handleMakeRoomReady = async () => {
    if (!user || !roomData) return;

    setIsInitializingStream(true);
    try {
      // First, initialize camera access to get devices and get the selected device ID
      const selectedDeviceId = await camera.initializeCamera();

      if (!selectedDeviceId) {
        throw new Error(
          "No camera devices found or failed to initialize camera"
        );
      }

      // Start the camera stream with the selected device ID
      await camera.startCamera(selectedDeviceId);

      // Initialize PeerJS and get the peer ID
      console.log("Starting PeerJS initialization...");
      const peerId = await peerJS.initializePeer();
      console.log("PeerJS initialization completed, peer ID:", peerId);

      if (!peerId) {
        throw new Error(
          "Failed to get peer ID - PeerJS did not return a valid ID"
        );
      }

      // Call the API to make the room ready
      const response = await fetch("/api/hostIsReadyForControl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          hostId: user.id,
          roomId: roomData.roomId,
          peerId: peerId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Room is now ready with peer ID:", peerId);
      } else {
        throw new Error(result.error || "Failed to make room ready");
      }
    } catch (err) {
      console.error("Error making room ready:", err);
      alert("Failed to make room ready: " + (err as Error).message);
      // Clean up on error
      camera.stopCamera();
      peerJS.destroyPeer();
    } finally {
      setIsInitializingStream(false);
    }
  };

  const handleEndStream = async () => {
    if (!user || !roomData) return;

    setIsEndingStream(true);
    try {
      // Call the API to end the stream
      const response = await fetch("/api/endStream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          hostId: user.id,
          roomId: roomData.roomId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Stop camera and destroy peer connection
        camera.stopCamera();
        peerJS.destroyPeer();
        console.log("Stream ended successfully");
      } else {
        throw new Error(result.error || "Failed to end stream");
      }
    } catch (err) {
      console.error("Error ending stream:", err);
      alert("Failed to end stream: " + (err as Error).message);
    } finally {
      setIsEndingStream(false);
    }
  };

  const handleApproveRequest = async (clientId: string) => {
    if (!user || !roomData) return;

    setIsProcessingRequest(true);
    try {
      const response = await fetch("/api/approveClientRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          hostId: user.id,
          roomId: roomData.roomId,
          clientId: clientId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Client request approved:", clientId);
        // The room data will be updated via the polling mechanism
      } else {
        throw new Error(result.error || "Failed to approve client request");
      }
    } catch (err) {
      console.error("Error approving client request:", err);
      alert("Failed to approve client request: " + (err as Error).message);
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleDenyRequest = async (clientId: string) => {
    if (!user || !roomData) return;

    setIsProcessingRequest(true);
    try {
      const response = await fetch("/api/denyClientRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          hostId: user.id,
          roomId: roomData.roomId,
          clientId: clientId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Client request denied:", clientId);
        // The room data will be updated via the polling mechanism
      } else {
        throw new Error(result.error || "Failed to deny client request");
      }
    } catch (err) {
      console.error("Error denying client request:", err);
      alert("Failed to deny client request: " + (err as Error).message);
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleRevokeControl = async (clientId: string) => {
    if (!user || !roomData) return;

    setIsProcessingRequest(true);
    try {
      const response = await fetch("/api/revokeClientControl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          hostId: user.id,
          roomId: roomData.roomId,
          clientId: clientId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Client control revoked:", clientId);
        // The room data will be updated via the polling mechanism
      } else {
        throw new Error(result.error || "Failed to revoke client control");
      }
    } catch (err) {
      console.error("Error revoking client control:", err);
      alert("Failed to revoke client control: " + (err as Error).message);
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const isRoomReady = roomData.hostPeerId !== null;

  return (
    <div className="max-w-4xl mx-auto h-full">
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Host Control Panel
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRoomReady ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              <span className="text-sm text-foreground/70">
                {isRoomReady ? "Ready for Control" : "Not Ready"}
              </span>
            </div>

            {!isRoomReady ? (
              <button
                onClick={handleMakeRoomReady}
                disabled={isInitializingStream}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitializingStream ? "Initializing..." : "Make Room Ready"}
              </button>
            ) : (
              <button
                onClick={handleEndStream}
                disabled={isEndingStream}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEndingStream ? "Ending..." : "End Stream"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="bg-background rounded-lg border border-foreground/10 p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Camera Feed
            </h3>
            <div className="aspect-video bg-foreground/5 rounded-lg flex items-center justify-center overflow-hidden">
              {camera.stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <p className="text-foreground/50">
                  {isRoomReady
                    ? "Camera preview will appear here"
                    : 'Click "Make Room Ready" to start camera'}
                </p>
              )}
            </div>
            {camera.error && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                Camera Error: {camera.error}
              </div>
            )}
          </div>

          <div className="bg-background rounded-lg border border-foreground/10 p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Client Connections
            </h3>
            <div className="space-y-2">
              {roomData.currentControllingClientId ? (
                <div className="p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      Client {roomData.currentControllingClientId} is
                      controlling
                    </span>
                    <button
                      onClick={() =>
                        handleRevokeControl(
                          roomData.currentControllingClientId!
                        )
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                      disabled={isProcessingRequest}
                    >
                      Revoke Control
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground/70 text-sm">
                  No clients connected
                </p>
              )}

              {roomData.info?.requestingClientIds &&
                Object.keys(roomData.info.requestingClientIds).length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Pending Requests:
                    </p>
                    {Object.keys(roomData.info.requestingClientIds).map(
                      (clientId) => (
                        <div
                          key={clientId}
                          className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <span>Client {clientId} requesting control</span>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleApproveRequest(clientId)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isProcessingRequest}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDenyRequest(clientId)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isProcessingRequest}
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
