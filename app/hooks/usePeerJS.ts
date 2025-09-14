import { useState, useEffect, useCallback, useRef } from "react";
import Peer, { DataConnection } from "peerjs";

export interface UsePeerJSResult {
  peer: Peer | null;
  peerId: string | null;
  isConnected: boolean;
  error: string | null;
  connections: DataConnection[];
  initializePeer: () => Promise<string>;
  destroyPeer: () => void;
  connect: (remotePeerId: string) => Promise<DataConnection | null>;
}

export function usePeerJS(): UsePeerJSResult {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const initializingRef = useRef(false);

  const initializePeer = useCallback(async (): Promise<string> => {
    if (initializingRef.current || peer) {
      return peerId || "";
    }

    initializingRef.current = true;
    setError(null);

    try {
      console.log("Initializing PeerJS...");

      // Try with minimal configuration first for better compatibility
      const newPeer = new Peer({
        debug: 1,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      return new Promise<string>((resolve, reject) => {
        newPeer.on("open", (id: string) => {
          console.log("PeerJS connection opened with ID:", id);
          setPeer(newPeer);
          setPeerId(id);
          setIsConnected(true);
          initializingRef.current = false;
          resolve(id);
        });

        newPeer.on("error", (err: any) => {
          console.error("PeerJS error:", err);
          let errorMessage = "Unknown PeerJS error";

          if (err.type === "network") {
            errorMessage =
              "Network error - please check your internet connection";
          } else if (err.type === "peer-unavailable") {
            errorMessage = "Peer unavailable";
          } else if (err.type === "server-error") {
            errorMessage = "PeerJS server error - please try again";
          } else if (err.message) {
            errorMessage = err.message;
          }

          setError(`PeerJS error: ${errorMessage}`);
          initializingRef.current = false;
          reject(err);
        });

        newPeer.on("connection", (conn: DataConnection) => {
          console.log("Incoming connection:", conn.peer);
          setConnections((prev) => [...prev, conn]);

          conn.on("open", () => {
            console.log("Connection opened with:", conn.peer);
          });

          conn.on("close", () => {
            console.log("Connection closed with:", conn.peer);
            setConnections((prev) => prev.filter((c) => c.peer !== conn.peer));
          });

          conn.on("error", (err: any) => {
            console.error("Connection error:", err);
          });
        });

        newPeer.on("disconnected", () => {
          console.log("PeerJS disconnected");
          setIsConnected(false);
        });

        newPeer.on("close", () => {
          console.log("PeerJS connection closed");
          setIsConnected(false);
          setPeer(null);
          setPeerId(null);
          setConnections([]);
        });

        // Set a timeout for connection
        setTimeout(() => {
          if (initializingRef.current) {
            initializingRef.current = false;
            newPeer.destroy();
            reject(
              new Error(
                "PeerJS connection timeout - please check your internet connection"
              )
            );
          }
        }, 15000);
      });
    } catch (err) {
      initializingRef.current = false;
      setError(`Failed to initialize PeerJS: ${(err as Error).message}`);
      throw err;
    }
  }, [peer]);

  const destroyPeer = useCallback(() => {
    if (peer) {
      peer.destroy();
      setPeer(null);
      setPeerId(null);
      setIsConnected(false);
      setConnections([]);
      setError(null);
    }
    initializingRef.current = false;
  }, [peer]);

  const connect = useCallback(
    async (remotePeerId: string): Promise<DataConnection | null> => {
      if (!peer || !isConnected) {
        setError("Peer not initialized or not connected");
        return null;
      }

      try {
        const conn = peer.connect(remotePeerId);

        return new Promise<DataConnection>((resolve, reject) => {
          conn.on("open", () => {
            console.log("Connected to:", remotePeerId);
            setConnections((prev) => [...prev, conn]);
            resolve(conn);
          });

          conn.on("error", (err: any) => {
            console.error("Connection error:", err);
            reject(err);
          });

          conn.on("close", () => {
            console.log("Connection closed with:", remotePeerId);
            setConnections((prev) =>
              prev.filter((c) => c.peer !== remotePeerId)
            );
          });

          // Set a timeout for connection
          setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 10000);
        });
      } catch (err) {
        setError(
          `Failed to connect to ${remotePeerId}: ${(err as Error).message}`
        );
        return null;
      }
    },
    [peer, isConnected]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, [peer]);

  return {
    peer,
    peerId,
    isConnected,
    error,
    connections,
    initializePeer,
    destroyPeer,
    connect,
  };
}
