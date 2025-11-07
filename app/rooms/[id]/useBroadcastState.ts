import { UsePeerResult } from "@/app/hooks/usePeer";
import { BothHands, DataFrame } from "@/app/teletable.model";
import { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { DataConnection } from "peerjs";
import { useCallback } from "react";

export function useBroadcastState(dataConnection: DataConnection | null) {
  const onUpdate = useCallback(
    (state: Record<string, DataFrame>) => {
      if (dataConnection) {
        dataConnection.send(JSON.stringify(state));
      }
    },
    [dataConnection]
  );

  return onUpdate;
}
