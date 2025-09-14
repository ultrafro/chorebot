import { useCallback, useState } from "react";
import { MediaConnection } from "peerjs";
import { UsePeerJSResult } from "@/app/hooks/usePeerJS";

export function useVideoCall(
  hostPeerId: string | null,
  peerJS: UsePeerJSResult
) {
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const initiateVideoCall = useCallback(async () => {
    if (!hostPeerId || !peerJS.peer) {
      console.error("No host peer ID or PeerJS not initialized");
      return;
    }

    console.log("Initiating video call to host:", hostPeerId);

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const attemptCall = async (): Promise<void> => {
      try {
        const call = await peerJS.call(hostPeerId);
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
  }, [hostPeerId, peerJS]);

  return {
    initiateVideoCall,
    activeCall,
    remoteStream,
    setActiveCall,
    setRemoteStream,
  };
}
