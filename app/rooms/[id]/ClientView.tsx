import router from "next/router";
import {
  ClientRoomInfo,
  ClientRoomInfoResponse,
  RoomData,
} from "./roomUI.model";
import { useCallback, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UsePeerJSResult } from "@/app/hooks/usePeerJS";
import { getAuthHeaders } from "@/app/lib/authHeaders";

export default function ClientView({
  roomData,
  peerJS,
  user,
}: {
  roomData: RoomData;
  peerJS: UsePeerJSResult;
  user: User | null;
}) {
  const [isRequestingControl, setIsRequestingControl] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const handleRequestControl = useCallback(async () => {
    if (!user?.id || !roomData.roomId) {
      console.error("Missing user ID or room ID");
      return;
    }

    setIsRequestingControl(true);
    setRequestStatus(null);

    try {
      const response = await fetch("/api/requestControl", {
        method: "POST",
        headers: getAuthHeaders(user),
        body: JSON.stringify({
          clientId: user.id,
          roomId: roomData.roomId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRequestStatus("Request sent successfully!");
      } else {
        setRequestStatus(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error requesting control:", error);
      setRequestStatus("Network error occurred");
    } finally {
      setIsRequestingControl(false);
    }
  }, [user, roomData.roomId]);

  const isInControl = user?.id === roomData.currentControllingClientId;

  return (
    <div className="max-w-4xl mx-auto h-full">
      <div className="bg-foreground/5 rounded-lg border border-foreground/10 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Client View</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-foreground/70">Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="bg-background rounded-lg border border-foreground/10 p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Host Stream
            </h3>
            <div className="aspect-video bg-foreground/5 rounded-lg flex items-center justify-center">
              <p className="text-foreground/50">Waiting for host stream...</p>
            </div>
          </div>

          {!isInControl && (
            <div className="bg-background rounded-lg border border-foreground/10 p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Controls
              </h3>
              <div className="space-y-4">
                <button
                  onClick={handleRequestControl}
                  disabled={isRequestingControl || !user?.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {isRequestingControl ? "Requesting..." : "Request Control"}
                </button>
                {requestStatus && (
                  <p
                    className={`text-sm ${
                      requestStatus.includes("successfully")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {requestStatus}
                  </p>
                )}
                <p className="text-foreground/70 text-sm">
                  Click to request control from the host
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
