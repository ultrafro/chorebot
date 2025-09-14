import { User } from "@supabase/supabase-js";
import { RoomData } from "./roomUI.model";

export function RoomStatus({
  roomData,
  user,
}: {
  roomData: RoomData;
  user: User | null;
}) {
  const isHost = roomData.isHost;
  const isControlling = user?.id === roomData.currentControllingClientId;
  const requestingClients = Object.values(
    roomData.info?.requestingClientIds || {}
  );
  const hasRequested = user?.id
    ? roomData.info?.requestingClientIds?.[user.id]
    : false;

  const getConnectionStatus = () => {
    if (!roomData.hostPeerId)
      return { text: "Host Disconnected", color: "text-red-600" };
    if (!roomData.hostPeerId)
      return { text: "Connecting", color: "text-yellow-600" };
    return { text: "Connected", color: "text-green-600" };
  };

  const getControlStatus = () => {
    if (isHost) return { text: "Host (Full Control)", color: "text-blue-600" };
    if (isControlling) return { text: "In Control", color: "text-green-600" };
    if (hasRequested)
      return { text: "Request Pending", color: "text-yellow-600" };
    if (roomData.currentControllingClientId)
      return { text: "Client Controlled", color: "text-orange-600" };
    return { text: "Available", color: "text-foreground/70" };
  };

  const connectionStatus = getConnectionStatus();
  const controlStatus = getControlStatus();

  return (
    <div className="bg-foreground/5 border-b border-foreground/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Room {roomData.roomId}
            </h1>
            <p className="text-foreground/70 text-sm">
              {isHost ? "You are the host" : "You are a client"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground/70">Connection</p>
            <p className={`font-medium ${connectionStatus.color}`}>
              {connectionStatus.text}
            </p>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
          {/* Room ID */}
          <div className="bg-background/50 rounded-lg p-3 border border-foreground/10">
            <p className="text-foreground/70 text-xs uppercase tracking-wide mb-1">
              Room ID
            </p>
            <p className="font-medium text-foreground font-mono text-sm">
              {roomData.roomId}
            </p>
          </div>

          {/* Your User ID */}
          <div className="bg-background/50 rounded-lg p-3 border border-foreground/10">
            <p className="text-foreground/70 text-xs uppercase tracking-wide mb-1">
              Your User ID
            </p>
            <p className="font-medium text-foreground font-mono text-xs">
              {user?.id ? user.id.slice(0, 8) + "..." : "Not logged in"}
            </p>
          </div>

          {/* Control Status */}
          <div className="bg-background/50 rounded-lg p-3 border border-foreground/10">
            <p className="text-foreground/70 text-xs uppercase tracking-wide mb-1">
              Control Status
            </p>
            <p className={`font-medium ${controlStatus.color}`}>
              {controlStatus.text}
            </p>
          </div>

          {/* Current Controller */}
          <div className="bg-background/50 rounded-lg p-3 border border-foreground/10">
            <p className="text-foreground/70 text-xs uppercase tracking-wide mb-1">
              Current Controller
            </p>
            <p className="font-medium text-foreground">
              {roomData.currentControllingClientId
                ? roomData.currentControllingClientId === user?.id
                  ? "You"
                  : roomData.currentControllingClientId.slice(0, 8) + "..."
                : "None"}
            </p>
          </div>

          {/* Pending Requests */}
          <div className="bg-background/50 rounded-lg p-3 border border-foreground/10">
            <p className="text-foreground/70 text-xs uppercase tracking-wide mb-1">
              Pending Requests
            </p>
            <p className="font-medium text-foreground">
              {requestingClients.length} client
              {requestingClients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Additional Info for Host */}
        {isHost && requestingClients.length > 0 && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Clients requesting control:
            </p>
            <div className="space-y-1">
              {requestingClients.map((request) => (
                <div
                  key={request.clientId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-blue-700 dark:text-blue-300">
                    {request.clientId.slice(0, 8)}...
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                    {new Date(request.requestTime).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
