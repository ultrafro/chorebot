import { RobotWebSocketResult } from "../hooks/useRobotWebSocket";

export default function ControlPageControlPanel({
  robotWS,
}: {
  robotWS: RobotWebSocketResult;
}) {
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
            Joint values and control data will be logged to the browser console.
          </p>
        </div>
      </div>
    </>
  );
}
