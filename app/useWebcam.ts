import { useRef, useState, useEffect } from "react";

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [error, setError] = useState<string>("");

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", () => {
          setWebcamRunning(true);
        });
        setError("");
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setError(
        "Could not access webcam. Please ensure camera permissions are granted."
      );
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setWebcamRunning(false);
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return { webcamRunning, startWebcam, stopWebcam, error, videoRef };
}
