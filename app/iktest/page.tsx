"use client";
import { useCallback, useMemo } from "react";
import RobotVisualizer from "../RobotVisualizer";
import {
  BothHands,
  DefaultLeftHandDetection,
  DefaultRightHandDetection,
} from "../teletable.model";
import { copyHands } from "../rooms/[id]/copyHands";

export default function IKTest() {
  const currentHands = useMemo(
    () => ({
      left: {
        ...DefaultLeftHandDetection,
      },
      right: {
        ...DefaultRightHandDetection,
      },
    }),
    []
  );

  // Callback to handle direct control updates from the robot visualizer
  const handleDirectControlUpdate = useCallback((hands: BothHands) => {
    copyHands(hands, currentHands);
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <RobotVisualizer
        currentHands={currentHands}
        showDirectControl={true}
        onDirectControlHandsUpdate={handleDirectControlUpdate}
      />
    </div>
  );
}
