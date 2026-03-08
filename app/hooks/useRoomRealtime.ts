import { useEffect, useRef, useCallback } from "react";
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

  // Keep callback ref updated
  useEffect(() => {
    onRoomChangedRef.current = onRoomChanged;
  }, [onRoomChanged]);

  const subscribe = useCallback(() => {
    if (!roomId || !enabled) return;

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to changes on the specific room row
    const channel = supabase
      .channel(`room-changes-${roomId}`)
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
      });

    channelRef.current = channel;
  }, [roomId, enabled]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    isSubscribed: channelRef.current !== null,
  };
}
