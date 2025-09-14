import { useCallback, useState } from "react";
import { MediaConnection } from "peerjs";

export function useConnectionRefresh(
  isInControl: boolean,
  activeCall: MediaConnection | null,
  setActiveCall: (call: MediaConnection | null) => void,
  setRemoteStream: (stream: MediaStream | null) => void,
  initiateVideoCall: () => Promise<void>
) {
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);

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
  }, [
    isInControl,
    activeCall,
    setActiveCall,
    setRemoteStream,
    initiateVideoCall,
  ]);

  return {
    handleRefreshConnection,
    isRefreshingConnection,
  };
}
