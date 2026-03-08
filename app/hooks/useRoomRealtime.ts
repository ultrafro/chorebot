import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseRoomRealtimeOptions {
  roomId: string;
  enabled?: boolean;
  onRoomChanged: () => void;
}

/**
 * Hook that subscribes to Supabase Realtime for room changes.
 * When a change is detected, it calls onRoomChanged to trigger a data fetch.
 * This replaces polling with event-driven updates.
 */
export function useRoomRealtime({
  roomId,
  enabled = true,
  onRoomChanged,
}: UseRoomRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRoomChangedRef = useRef(onRoomChanged);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Keep callback ref updated
  useEffect(() => {
    onRoomChangedRef.current = onRoomChanged;
  }, [onRoomChanged]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsSubscribed(false);
  }, []);

  const subscribe = useCallback(() => {
    if (!roomId || !enabled) {
      unsubscribe();
      return;
    }

    // Clean up existing subscription
    unsubscribe();

    // Subscribe to changes on the specific room row
    const channel = supabase
      .channel(`room-changes:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("[Realtime] Room changed:", payload.eventType);
          onRoomChangedRef.current();
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for room ${roomId}:`, status);
        const connected = status === "SUBSCRIBED";
        setIsSubscribed(connected);
        // Ensure room state is fresh after (re)subscription.
        if (connected) {
          onRoomChangedRef.current();
        }
      });

    channelRef.current = channel;
  }, [roomId, enabled, unsubscribe]);

  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    isSubscribed,
  };
}
