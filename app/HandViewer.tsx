"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { useLoop } from "./useLoop";
import { useHandLandmarker } from "./useHandLandmarker";
import { useDrawingUtils } from "./useDrawingUtils";

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandDetectionResult {
  landmarks: HandLandmark[][];
  handednesses: any[];
}

export default function HandViewer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarker = useHandLandmarker();

  const [webcamRunning, setWebcamRunning] = useState(false);
  const [error, setError] = useState<string>("");
  const animationFrameRef = useRef<number>(-1);
  const [drawingUtils, setDrawingUtils] = useState<DrawingUtils | null>(null);

  const onLoop = useCallback(() => {
    if (
      !handLandmarker ||
      !videoRef.current ||
      !canvasRef.current ||
      !webcamRunning
    ) {
      return;
    }

    // Update canvas size to match video size
    const video = videoRef.current;
    const canvas = canvasRef.current;

    //check if the canvas is the same size, update it if not
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = video.offsetWidth + "px";
      canvas.style.height = video.offsetHeight + "px";
    }

    // Clear canvas before drawing
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (!drawingUtils) {
        setDrawingUtils(new DrawingUtils(ctx));
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const results = handLandmarker.detectForVideo(
      videoRef.current,
      performance.now()
    );
    if (results.landmarks && results.landmarks.length > 0) {
      for (const landmarks of results.landmarks) {
        drawingUtils?.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          { color: "#00FF00", lineWidth: 3 }
        );
        drawingUtils?.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 1,
        });
      }
    }
  }, [handLandmarker, webcamRunning, drawingUtils]);
  useLoop(onLoop);

  const startWebcam = async () => {
    if (!handLandmarker) {
      setError("Hand detector not ready yet.");
      return;
    }

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

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setWebcamRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Hand Position Viewer
          </h1>
          <p className="text-lg text-gray-600">
            Real-time hand landmark detection using MediaPipe
          </p>
        </div>

        {!handLandmarker && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading MediaPipe hand detector...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {handLandmarker && !error && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="relative mb-6">
              <video
                ref={videoRef}
                className="w-full max-w-2xl mx-auto rounded-lg bg-black"
                autoPlay
                playsInline
                muted
                style={{ display: webcamRunning ? "block" : "none" }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none rounded-lg"
                style={{ display: webcamRunning ? "block" : "none" }}
              />

              {!webcamRunning && (
                <div className="w-full max-w-2xl mx-auto h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👋</div>
                    <p className="text-gray-600 text-lg">
                      Click the button below to start hand detection
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={webcamRunning ? stopWebcam : startWebcam}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  webcamRunning
                    ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                    : "bg-blue-500 hover:bg-blue-600 shadow-blue-200"
                } shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                {webcamRunning ? "Stop Detection" : "Start Hand Detection"}
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>• Green lines show hand structure connections</p>
              <p>• Red dots mark individual hand landmarks</p>
              <p>• Up to 2 hands can be detected simultaneously</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
