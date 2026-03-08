import { UsePeerResult } from "@/app/hooks/usePeer";

/**
 * Hook that tracks if a video call is active.
 * Now reactive based on usePeer's internal connection tracking.
 */
export function useIsVideoCallConnected(peer: UsePeerResult) {
  return peer.hasActiveMediaConnections;
}
