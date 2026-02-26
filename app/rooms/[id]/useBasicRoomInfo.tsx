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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
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
  const { isSubscribed } = useRoomRealtime({
    roomId,
    enabled: isUserAuthenticated(user),
    onRoomChanged: handleRoomChanged,
  });

  // Track realtime connection status
  useEffect(() => {
    setIsRealtimeConnected(isSubscribed);
  }, [isSubscribed]);

  // Initial fetch
  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Fallback polling at a much slower rate (30 seconds) in case realtime misses updates
  // This is a safety net, not the primary update mechanism
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[useBasicRoomInfo] Fallback poll triggered");
      fetchRoomData();
    }, 30000); // 30 second fallback poll

    return () => clearInterval(interval);
  }, [fetchRoomData]);

  return {
    roomData,
    refetchRoomData: fetchRoomData,
    isRealtimeConnected,
  };
}
