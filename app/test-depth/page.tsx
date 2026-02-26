"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface CameraDevice {
  deviceId: string;
  label: string;
}

export default function DepthTestPage() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [depthScale, setDepthScale] = useState(1.5);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [colormap, setColormap] = useState<"grayscale" | "turbo">("grayscale");
  const [blurRadius, setBlurRadius] = useState(2);

  const videoRef = useRef<HTMLVideoElement>(null);
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement>(null);
  const combinedCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      // Request permission first
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      tempStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError("Failed to enumerate cameras: " + (err as Error).message);
    }
  }, [selectedCamera]);

  // Start camera stream
  const startStream = useCallback(async () => {
    if (!selectedCamera) return;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedCamera },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError("Failed to start camera: " + (err as Error).message);
    }
  }, [selectedCamera]);

  // Stop camera stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Apply turbo colormap
  const applyTurboColormap = (value: number): [number, number, number] => {
    const t = Math.max(0, Math.min(1, value));
    let r, g, b;

    if (t < 0.25) {
      r = 0;
      g = 4 * t;
      b = 1;
    } else if (t < 0.5) {
      r = 0;
      g = 1;
      b = 1 - 4 * (t - 0.25);
    } else if (t < 0.75) {
      r = 4 * (t - 0.5);
      g = 1;
      b = 0;
    } else {
      r = 1;
      g = 1 - 4 * (t - 0.75);
      b = 0;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Box blur helper
  const boxBlur = (
    data: Float32Array,
    width: number,
    height: number,
    radius: number
  ): Float32Array => {
    const result = new Float32Array(width * height);
    const size = radius * 2 + 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += data[ny * width + nx];
              count++;
            }
          }
        }

        result[y * width + x] = sum / count;
      }
    }

    return result;
  };

  // Estimate depth using gradient-based approach with smoothing
  const estimateDepth = useCallback(
    (imageData: ImageData): ImageData => {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const depthData = new Uint8ClampedArray(data.length);

      // Convert to grayscale
      const gray = new Float32Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        gray[i] =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      }

      // Compute depth values based on gradient magnitude and luminance
      const depthValues = new Float32Array(width * height);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;

          // Sobel operators for gradient
          const gx =
            -gray[(y - 1) * width + (x - 1)] +
            gray[(y - 1) * width + (x + 1)] +
            -2 * gray[y * width + (x - 1)] +
            2 * gray[y * width + (x + 1)] +
            -gray[(y + 1) * width + (x - 1)] +
            gray[(y + 1) * width + (x + 1)];

          const gy =
            -gray[(y - 1) * width + (x - 1)] +
            -2 * gray[(y - 1) * width + x] +
            -gray[(y - 1) * width + (x + 1)] +
            gray[(y + 1) * width + (x - 1)] +
            2 * gray[(y + 1) * width + x] +
            gray[(y + 1) * width + (x + 1)];

          // Gradient magnitude (edges = closer in focus = closer to camera typically)
          const gradient = Math.sqrt(gx * gx + gy * gy);

          // Luminance (brighter often means closer due to lighting)
          const luminance = gray[idx] / 255;

          // Normalize gradient
          const normalizedGradient = Math.min(gradient / 400, 1);

          // Combine: high gradient (edges) = closer, higher luminance = closer
          // This is a heuristic that works reasonably for many scenes
          depthValues[idx] = 0.6 * normalizedGradient + 0.4 * luminance;
        }
      }

      // Apply box blur to smooth the depth map
      const smoothedDepth = boxBlur(depthValues, width, height, blurRadius);

      // Find min/max for normalization
      let minDepth = Infinity;
      let maxDepth = -Infinity;
      for (let i = 0; i < smoothedDepth.length; i++) {
        if (smoothedDepth[i] > 0) {
          minDepth = Math.min(minDepth, smoothedDepth[i]);
          maxDepth = Math.max(maxDepth, smoothedDepth[i]);
        }
      }

      // Normalize and apply colormap
      const range = maxDepth - minDepth || 1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const pixelIdx = idx * 4;

          let normalizedDepth = (smoothedDepth[idx] - minDepth) / range;
          // Apply gamma correction based on scale
          normalizedDepth = Math.pow(normalizedDepth, 1 / depthScale);

          if (colormap === "grayscale") {
            const grayVal = Math.round(normalizedDepth * 255);
            depthData[pixelIdx] = grayVal;
            depthData[pixelIdx + 1] = grayVal;
            depthData[pixelIdx + 2] = grayVal;
          } else {
            const [r, g, b] = applyTurboColormap(normalizedDepth);
            depthData[pixelIdx] = r;
            depthData[pixelIdx + 1] = g;
            depthData[pixelIdx + 2] = b;
          }
          depthData[pixelIdx + 3] = 255;
        }
      }

      return new ImageData(depthData, width, height);
    },
    [depthScale, colormap, blurRadius]
  );

  // Process frame
  const processFrame = useCallback(() => {
    if (
      !videoRef.current ||
      !colorCanvasRef.current ||
      !depthCanvasRef.current ||
      !combinedCanvasRef.current
    ) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const colorCtx = colorCanvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });
    const depthCtx = depthCanvasRef.current.getContext("2d");
    const combinedCtx = combinedCanvasRef.current.getContext("2d");

    if (!colorCtx || !depthCtx || !combinedCtx) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    // Set canvas sizes
    colorCanvasRef.current.width = width;
    colorCanvasRef.current.height = height;
    depthCanvasRef.current.width = width;
    depthCanvasRef.current.height = height;
    combinedCanvasRef.current.width = width * 2;
    combinedCanvasRef.current.height = height;

    // Draw color frame
    colorCtx.drawImage(video, 0, 0, width, height);
    const colorImageData = colorCtx.getImageData(0, 0, width, height);

    // Estimate depth
    const depthImageData = estimateDepth(colorImageData);
    depthCtx.putImageData(depthImageData, 0, 0);

    // Draw combined view (color left, depth right)
    combinedCtx.drawImage(colorCanvasRef.current, 0, 0);
    combinedCtx.drawImage(depthCanvasRef.current, width, 0);

    // Calculate FPS
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFrameTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [estimateDepth]);

  // Start/stop processing loop
  useEffect(() => {
    if (isStreaming) {
      lastFrameTimeRef.current = performance.now();
      frameCountRef.current = 0;
      processFrame();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isStreaming, processFrame]);

  // Initialize cameras on mount
  useEffect(() => {
    enumerateCameras();

    return () => {
      stopStream();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-foreground/10">
        <h1 className="text-2xl font-bold">Webcam Depth Test</h1>
        <p className="text-sm text-foreground/70 mt-1">
          Live 2D to depth estimation using edge detection
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls Section */}
        <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10 mb-8">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Camera Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Camera
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isStreaming}
                className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {cameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Depth Scale */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Depth Scale: {depthScale.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={depthScale}
                onChange={(e) => setDepthScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-foreground/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Blur Radius */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Smoothing: {blurRadius}
              </label>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={blurRadius}
                onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-foreground/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Colormap Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Colormap
              </label>
              <select
                value={colormap}
                onChange={(e) =>
                  setColormap(e.target.value as "grayscale" | "turbo")
                }
                className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grayscale">Grayscale</option>
                <option value="turbo">Turbo (Color)</option>
              </select>
            </div>

            {/* Start/Stop Button */}
            <div className="flex items-end">
              {!isStreaming ? (
                <button
                  onClick={startStream}
                  disabled={!selectedCamera}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={stopStream}
                  className="w-full px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isStreaming ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-foreground/70">
                {isStreaming ? "Streaming" : "Ready"}
              </span>
            </div>

            {isStreaming && (
              <span className="text-sm text-foreground/70">FPS: {fps}</span>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Video Display */}
        <div className="space-y-6">
          {/* Hidden video element */}
          <video ref={videoRef} className="hidden" playsInline muted autoPlay />

          {/* Combined View */}
          <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
            <h2 className="text-xl font-semibold mb-4">
              Combined View (Color | Depth)
            </h2>
            <div className="flex justify-center">
              <canvas
                ref={combinedCanvasRef}
                className="max-w-full h-auto rounded-lg border border-foreground/20"
                style={{ imageRendering: "auto" }}
              />
            </div>
            {!isStreaming && (
              <div className="mt-4 text-center text-foreground/50">
                Select a camera and click Start to begin
              </div>
            )}
          </div>

          {/* Individual Views (hidden, used for processing) */}
          <canvas ref={colorCanvasRef} className="hidden" />
          <canvas ref={depthCanvasRef} className="hidden" />

          {/* Info Section */}
          <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
            <h2 className="text-xl font-semibold mb-4">
              About Depth Estimation
            </h2>
            <div className="text-sm text-foreground/70 space-y-2">
              <p>
                This demo uses a gradient-based depth estimation algorithm.
                Objects with sharper edges and higher contrast are estimated as
                closer to the camera.
              </p>
              <p>
                <strong>Depth Scale:</strong> Adjusts the contrast/gamma of the
                depth map. Higher values increase the contrast between near and
                far objects.
              </p>
              <p>
                <strong>Smoothing:</strong> Applies blur to the depth map for
                smoother results. Higher values = smoother but less detailed.
              </p>
              <p>
                <strong>Colormap:</strong> Choose between grayscale (white =
                close, black = far) or turbo colormap for better visualization.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
