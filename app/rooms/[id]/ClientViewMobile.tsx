import { DataFrame } from "@/app/teletable.model";
import { RefObject, useEffect, useRef, useState, useCallback } from "react";
import RobotVisualizer from "@/app/RobotVisualizer";

export function ClientViewMobile({
  isInControl,
  currentState,
  handleJointValuesUpdate,
  roomPassword,
  setRoomPassword,
  remoteStream,
  handleRequestControl,
  isRequestingControl,
  peerIsConnected,
  requestStatus,
}: {
  isInControl: boolean;
  currentState: RefObject<Record<string, DataFrame>>;
  handleJointValuesUpdate: (robotId: string, jointValues: number[]) => void;
  roomPassword: string;
  setRoomPassword: (roomPassword: string) => void;
  remoteStream: MediaStream | null;
  handleRequestControl: () => void;
  isRequestingControl: boolean;
  requestStatus: string | null;
  peerIsConnected: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Full frame robot visualizer */}
      <div className="absolute inset-0">
        <RobotVisualizer
          currentState={currentState}
          remotelyControlled={false}
          onJointValuesUpdate={handleJointValuesUpdate}
        />
      </div>

      {/* Burger menu button - Top left */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="absolute top-4 left-4 z-20 bg-white rounded-lg border border-gray-200 shadow-lg p-2.5 flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Backdrop overlay */}
      {isMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-10"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out menu panel */}
      <div
        className={`absolute top-0 left-0 h-full w-[280px] bg-white shadow-xl z-20 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <MobileRoomPasswordSection
              roomPassword={roomPassword}
              setRoomPassword={setRoomPassword}
            />
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <MobileControlRequestSection
              handleRequestControl={handleRequestControl}
              isRequestingControl={isRequestingControl}
              requestStatus={requestStatus}
              isInControl={isInControl}
            />
          </div>
        </div>
      </div>

      {/* Top right: Remote View section */}
      <div className="absolute top-4 right-4 z-10 max-w-[240px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-2.5">
          <MobileRemoteViewSection
            remoteStream={remoteStream}
            isInControl={isInControl}
          />
        </div>
      </div>

      {/* Bottom: Control section */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-4 px-4">
        <MobileControlSection isInControl={isInControl} />
      </div>
    </div>
  );
}

function MobileRoomPasswordSection({
  roomPassword,
  setRoomPassword,
}: {
  roomPassword: string;
  setRoomPassword: (roomPassword: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700">Room Password</label>
      <input
        type="password"
        value={roomPassword}
        onChange={(e) => setRoomPassword(e.target.value)}
        placeholder="Enter password"
        className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

function MobileRemoteViewSection({
  remoteStream,
  isInControl,
}: {
  remoteStream: MediaStream | null;
  isInControl: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-gray-700">Remote Feed</h3>
      <div className="bg-gray-50 rounded-md border border-gray-300 overflow-hidden aspect-video">
        {remoteStream && isInControl ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-xs">
                {isInControl ? "Connecting..." : "Request control to view"}
              </p>
            </div>
          </div>
        )}
      </div>
      {isInControl && remoteStream && (
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600">Stream active</span>
        </div>
      )}
    </div>
  );
}

function MobileControlRequestSection({
  handleRequestControl,
  isRequestingControl,
  requestStatus,
  isInControl,
}: {
  handleRequestControl: () => void;
  isRequestingControl: boolean;
  requestStatus: string | null;
  isInControl: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {!isInControl ? (
        <>
          <button
            onClick={handleRequestControl}
            disabled={isRequestingControl}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-1.5 px-3 rounded-md transition-colors text-xs font-medium"
          >
            {isRequestingControl ? "Requesting..." : "Request Control"}
          </button>
          {requestStatus && (
            <p
              className={`text-xs ${
                requestStatus.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {requestStatus}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600 font-medium">
            You have control
          </span>
        </div>
      )}
    </div>
  );
}

function MobileControlSection({ isInControl }: { isInControl: boolean }) {
  if (!isInControl) {
    return null;
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-xl p-2">
      <div className="flex items-center justify-between gap-2">
        {/* Left column */}
        <div className="flex flex-col gap-2 flex-1">
          <ControlRow label="Wrist" />
          <ControlRow label="Pitch" />
        </div>

        {/* Center: Joystick */}
        <div className="flex-shrink-0">
          <Joystick />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2 flex-1">
          <ControlRow label="Gripper" />
          <ControlRow label="Height" />
        </div>
      </div>
    </div>
  );
}

function ControlRow({ label }: { label: string }) {
  const handleDown = useCallback(() => {
    console.log(`${label} down`);
    // TODO: Implement control action
  }, [label]);

  const handleUp = useCallback(() => {
    console.log(`${label} up`);
    // TODO: Implement control action
  }, [label]);

  const getIcon = () => {
    switch (label) {
      case "Wrist":
        return (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        );
      case "Pitch":
        return (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "Gripper":
        return (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        );
      case "Height":
        return (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={handleDown}
        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-colors touch-manipulation"
      >
        <svg
          className="w-4 h-4 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div className="w-7 h-7 flex items-center justify-center">
        {getIcon()}
      </div>
      <button
        onClick={handleUp}
        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-colors touch-manipulation"
      >
        <svg
          className="w-4 h-4 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>
    </div>
  );
}

function Joystick() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const nippleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const updatePosition = useCallback((deltaX: number, deltaY: number) => {
    if (!nippleRef.current) return;

    const maxDistance = 30; // Maximum distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let constrainedX = deltaX;
    let constrainedY = deltaY;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      constrainedX = Math.cos(angle) * maxDistance;
      constrainedY = Math.sin(angle) * maxDistance;
    }

    // Direct DOM manipulation for smooth updates
    nippleRef.current.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;

    // Normalize to -1 to 1 range
    const normalizedX = constrainedX / maxDistance;
    const normalizedY = -constrainedY / maxDistance; // Invert Y for intuitive up/down

    // TODO: Send joystick command with normalizedX and normalizedY
    // console.log("Joystick:", { x: normalizedX, y: normalizedY });
  }, []);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickRef.current || !nippleRef.current) return;
      setIsDragging(true);
      const rect = joystickRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      // Remove transition during dragging for smooth movement
      nippleRef.current.style.transition = "none";
      updatePosition(
        clientX - centerRef.current.x,
        clientY - centerRef.current.y
      );
    },
    [updatePosition]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      // Use requestAnimationFrame for smooth updates
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        updatePosition(
          clientX - centerRef.current.x,
          clientY - centerRef.current.y
        );
      });
    },
    [isDragging, updatePosition]
  );

  const handleEnd = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsDragging(false);
    if (nippleRef.current) {
      // Restore transition for smooth return to center
      nippleRef.current.style.transition = "transform 0.2s ease-out";
      nippleRef.current.style.transform = "translate(0px, 0px)";
    }
    // TODO: Send stop command
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div
      ref={joystickRef}
      className="relative w-16 h-16 bg-gray-100 rounded-full border-2 border-gray-300 flex items-center justify-center touch-none"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        e.preventDefault();
        if (e.touches[0]) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
    >
      {/* Joystick nipple */}
      <div
        ref={nippleRef}
        className="absolute w-8 h-8 bg-gray-400 rounded-full shadow-lg will-change-transform"
        style={{
          transform: "translate(0px, 0px)",
        }}
      />
    </div>
  );
}
