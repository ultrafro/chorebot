import { DrawingUtils } from "@mediapipe/tasks-vision";
import { useState, useEffect } from "react";

export function useDrawingUtils(
  ctx: CanvasRenderingContext2D | null | undefined
) {
  const [drawingUtils, setDrawingUtils] = useState<DrawingUtils | null>(null);
  useEffect(() => {
    if (!ctx) return;
    const drawingUtils = new DrawingUtils(ctx);
    setDrawingUtils(drawingUtils);
  }, [ctx]);
  return drawingUtils;
}
