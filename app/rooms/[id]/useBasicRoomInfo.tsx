import { useState, useEffect, useCallback, useRef } from "react";
import { RoomData } from "./roomUI.model";
import { User, Session } from "@supabase/supabase-js";
import {
  createAuthFetchOptions,
  isUserAuthenticated,
} from "../../lib/authHeaders";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";

export function useBasicRoomInfo(
  roomId: string,
  user: User | null,
  session: Session | null
) {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 200; // Minimum ms between fetches to prevent rapid re-fetches

  const fetchRoomData = useCallback(async () => {
    if (!isUserAuthenticated(user)) return;

    // Debounce rapid fetches
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      const response = await fetch(
        `/api/getBasicRoomInfo?roomId=${roomId}&userId=${user.id}`,
        createAuthFetchOptions(session, "GET")
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoomData(data.roomInfo || data);
    } catch (error) {
      console.error("Error fetching room data:", error);
    }
  }, [user, session, roomId]);

  // Handle realtime room changes
  const handleRoomChanged = useCallback(() => {
    console.log("[useBasicRoomInfo] Realtime update received, fetching data...");
    fetchRoomData();
  }, [fetchRoomData]);

  // Subscribe to realtime updates
  const { isSubscribed: isRealtimeConnected } = useRoomRealtime({
    roomId,
    enabled: isUserAuthenticated(user),
    onRoomChanged: handleRoomChanged,
  });

  // Initial fetch
  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Realtime-first with polling safety net:
  // - Fast fallback when realtime is disconnected.
  // - Slow heartbeat when realtime is connected to recover from missed events.
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchRoomData();
      },
      isRealtimeConnected ? 15000 : 3000
    );

    return () => clearInterval(interval);
  }, [fetchRoomData, isRealtimeConnected]);

  return {
    roomData,
    refetchRoomData: fetchRoomData,
    isRealtimeConnected,
  };
}
