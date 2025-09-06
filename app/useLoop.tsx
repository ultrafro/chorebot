import { useEffect, useRef } from "react";

export function useLoop(callback: () => void) {
  const animationFrameRef = useRef<number>(-1);
  useEffect(() => {
    const onLoop = () => {
      callback();
      animationFrameRef.current = requestAnimationFrame(onLoop);
    };
    onLoop();
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [callback]);
}
