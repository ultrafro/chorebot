import { RobotWebSocketResult } from "../hooks/useRobotWebSocket";

export default function ControlPageControlPanel({
  robotWS,
  directMode,
  setDirectMode,
  directValues,
  setDirectValues,
}: {
  robotWS: RobotWebSocketResult;
  directMode: boolean;
  setDirectMode: (value: boolean) => void;
  directValues: number[];
  setDirectValues: (values: number[]) => void;
}) {
  const jointNames = [
    "Shoulder Pan",
    "Shoulder Lift",
    "Elbow Flex",
    "Wrist Pitch",
    "Wrist Roll",
    "Gripper",
  ];

  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...directValues];
    newValues[index] = value;
    setDirectValues(newValues);
  };
  return (
    <>
      {/* Right side - Control panel */}

      {/* Connection Status Section */}
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Connection Status
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/70">Robot Server</span>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  robotWS.isConnected
                    ? "bg-green-500"
                    : robotWS.isConnecting
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm">
                {robotWS.isConnected
                  ? "Connected"
                  : robotWS.isConnecting
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Robot Server Control Section */}
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Robot Server Control
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            {!robotWS.isConnected ? (
              <button
                onClick={robotWS.connect}
                disabled={robotWS.isConnecting}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {robotWS.isConnecting ? "Connecting..." : "Connect"}
              </button>
            ) : (
              <button
                onClick={robotWS.disconnect}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Disconnect
              </button>
            )}
            <button
              onClick={robotWS.reconnect}
              disabled={robotWS.isConnecting}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reconnect
            </button>
          </div>

          {robotWS.lastError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              <strong>Connection Error:</strong> {robotWS.lastError}
            </div>
          )}

          <div className="text-xs text-foreground/60">
            <p>
              <strong>Default:</strong> ws://localhost:9000
            </p>
            <p>
              Make sure your Python robot server is running and listening on
              this port.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Mode Section */}
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Direct Mode
        </h3>
        <div className="space-y-4">
          <button
            onClick={() => setDirectMode(!directMode)}
            className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
              directMode
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            {directMode ? "Direct Mode: ON" : "Direct Mode: OFF"}
          </button>

          {directMode && (
            <div className="space-y-4 pt-2">
              {jointNames.map((name, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-foreground/70">{name}</label>
                    <span className="text-sm font-mono text-foreground">
                      {directValues[index].toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="0.1"
                    value={directValues[index]}
                    onChange={(e) =>
                      handleSliderChange(index, parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Instructions
        </h3>
        <div className="text-sm text-foreground/70 space-y-2">
          <p>Use the 3D controls in the visualizer to move the robot hands.</p>
          <p>
            When connected to the robot server, movements will be sent in
            real-time.
          </p>
          <p>
            Enable Direct Mode to manually control joint values with sliders.
          </p>
          <p>
            Joint values and control data will be logged to the browser console.
          </p>
        </div>
      </div>
    </>
  );
}
