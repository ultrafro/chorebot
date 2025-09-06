import { useState, useEffect } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export function useHandLandmarker() {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null
  );
  useEffect(() => {
    createHandLandmarker();
  }, []);

  const createHandLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm"
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        numHands: 2,
      });
      await landmarker?.setOptions({ runningMode: "VIDEO" });
      setHandLandmarker(landmarker);
    } catch (error) {
      console.error("Failed to create hand landmarker:", error);
    }
  };

  return handLandmarker;
}
