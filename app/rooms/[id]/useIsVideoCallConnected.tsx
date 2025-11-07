import { UsePeerResult } from "@/app/hooks/usePeer";
import { useEffect, useState } from "react";

export function useIsVideoCallConnected(peer: UsePeerResult) {
  const [isVideoCallConnected, setIsVideoCallConnected] = useState(false);

  //do a poll every 1 second to check if the video call is connected
  useEffect(() => {
    const interval = setInterval(() => {
      //loop through connections, set to true if there are any media connections
      for (const connectionKey in Object.values(peer.peer?.connections || {})) {
        const connection = (peer.peer?.connections as any | undefined)[
          connectionKey as any
        ];
        if (connection?.type === "media") {
          setIsVideoCallConnected(true);
          break;
        } else {
          setIsVideoCallConnected(false);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [peer.isConnected, peer.peer?.connections]);

  return isVideoCallConnected;
}
