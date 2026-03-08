import { UsePeerResult } from "@/app/hooks/usePeer";
import { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";

const DATA_RECONNECT_DELAY = 1000;
const MAX_DATA_RECONNECT_DELAY = 10000;

export function useDataConnectionClientside(
  hostPeerId: string,
  peer: UsePeerResult
) {
  const [dataConnection, setDataConnection] = useState<DataConnection | null>(
    null
  );
  const activeConnectionRef = useRef<DataConnection | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const hostPeerIdRef = useRef(hostPeerId);

  useEffect(() => {
    hostPeerIdRef.current = hostPeerId;
  }, [hostPeerId]);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const closeActiveConnection = () => {
      if (activeConnectionRef.current) {
        try {
          activeConnectionRef.current.close();
        } catch {
          // Ignore close errors during cleanup.
        }
        activeConnectionRef.current = null;
      }
      setDataConnection(null);
    };

    const scheduleReconnect = () => {
      if (!shouldReconnectRef.current) {
        return;
      }
      if (!peer.peer || !peer.isConnected || !hostPeerIdRef.current) {
        return;
      }

      clearReconnectTimeout();

      reconnectAttemptsRef.current += 1;
      const delay = Math.min(
        DATA_RECONNECT_DELAY * reconnectAttemptsRef.current,
        MAX_DATA_RECONNECT_DELAY
      );
      console.log(
        `[DataClient] Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        establishDataConnection();
      }, delay);
    };

    const establishDataConnection = () => {
      console.log("establishing data connection to host:", hostPeerId);
      if (!peer.peer || !peer.isConnected || !hostPeerId) {
        console.log(
          "not establishing data connection to host because of missing requirements:",
          {
            peer: !!peer.peer,
            isConnected: peer.isConnected,
            hostPeerId: !!hostPeerId,
          }
        );
        return;
      }

      if (
        activeConnectionRef.current?.open &&
        activeConnectionRef.current.peer === hostPeerId
      ) {
        return;
      }

      closeActiveConnection();
      console.log("Establishing data connection to host:", hostPeerId);

      const nextConnection = peer.peer.connect(hostPeerId);
      activeConnectionRef.current = nextConnection;
      setDataConnection(nextConnection);

      nextConnection.on("open", () => {
        reconnectAttemptsRef.current = 0;
        console.log(
          "Data connection established to host:",
          nextConnection.peer
        );
      });

      nextConnection.on("close", () => {
        console.log("Data connection closed");
        if (activeConnectionRef.current === nextConnection) {
          activeConnectionRef.current = null;
          setDataConnection(null);
        }
        scheduleReconnect();
      });

      nextConnection.on("error", (err) => {
        console.error("Data connection error:", err);
        if (activeConnectionRef.current === nextConnection) {
          activeConnectionRef.current = null;
          setDataConnection(null);
        }
        scheduleReconnect();
      });
    };

    establishDataConnection();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      closeActiveConnection();
    };
  }, [hostPeerId, peer.peer, peer.isConnected]);

  return dataConnection;
}
