"use client";

import { useState } from "react";

interface ApiResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export default function TestPage() {
  const [authToken, setAuthToken] = useState("test-user-123");
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Form states
  const [hostForm, setHostForm] = useState({
    hostId: "host-123",
    roomId: "room-abc",
    peerId: "peer-xyz-789",
  });

  const [requestForm, setRequestForm] = useState({
    clientId: "client-456",
    roomId: "room-abc",
  });

  const [approveForm, setApproveForm] = useState({
    hostId: "host-123",
    roomId: "room-abc",
    clientId: "client-456",
  });

  const [peerIdForm, setPeerIdForm] = useState({
    clientId: "client-456",
    roomId: "room-abc",
  });

  const [createRoomForm, setCreateRoomForm] = useState({
    roomId: "room-xyz",
    hostId: "host-123",
  });

  const makeApiCall = async (endpoint: string, data: any, key: string) => {
    setLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setResponses((prev) => ({
        ...prev,
        [key]: { ...result, status: response.status },
      }));
    } catch (error) {
      setResponses((prev) => ({
        ...prev,
        [key]: { error: `Network error: ${error}`, status: 0 },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const ResponseDisplay = ({
    response,
    isLoading,
  }: {
    response?: ApiResponse;
    isLoading?: boolean;
  }) => {
    if (isLoading) {
      return <div className="text-blue-600">Loading...</div>;
    }

    if (!response) {
      return <div className="text-gray-400">No response yet</div>;
    }

    const statusColor =
      response.status >= 200 && response.status < 300
        ? "text-green-600"
        : "text-red-600";

    return (
      <div className="mt-2 p-3 bg-gray-100 rounded">
        <div className={`font-semibold ${statusColor}`}>
          Status: {response.status}
        </div>
        <pre className="text-sm mt-1 overflow-auto">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teletable API Test Page
        </h1>

        {/* Auth Token */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          <div className="flex gap-4 items-center">
            <label className="font-medium">Auth Token:</label>
            <input
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter authentication token"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This token will be used for all API calls. In this demo, the token
            serves as the user ID.
          </p>
        </div>

        {/* Create Room */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Create Room</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <input
                type="text"
                value={createRoomForm.roomId}
                onChange={(e) =>
                  setCreateRoomForm((prev) => ({
                    ...prev,
                    roomId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Host ID</label>
              <input
                type="text"
                value={createRoomForm.hostId}
                onChange={(e) =>
                  setCreateRoomForm((prev) => ({
                    ...prev,
                    hostId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() =>
              makeApiCall("createRoom", createRoomForm, "createRoom")
            }
            disabled={loading.createRoom}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Room
          </button>
          <ResponseDisplay
            response={responses.createRoom}
            isLoading={loading.createRoom}
          />
        </div>

        {/* Host Ready for Control */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            2. Host Is Ready For Control
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Host ID</label>
              <input
                type="text"
                value={hostForm.hostId}
                onChange={(e) =>
                  setHostForm((prev) => ({ ...prev, hostId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <input
                type="text"
                value={hostForm.roomId}
                onChange={(e) =>
                  setHostForm((prev) => ({ ...prev, roomId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Peer ID</label>
              <input
                type="text"
                value={hostForm.peerId}
                onChange={(e) =>
                  setHostForm((prev) => ({ ...prev, peerId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() =>
              makeApiCall("hostIsReadyForControl", hostForm, "hostReady")
            }
            disabled={loading.hostReady}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Set Host Ready
          </button>
          <ResponseDisplay
            response={responses.hostReady}
            isLoading={loading.hostReady}
          />
        </div>

        {/* Request Control */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3. Request Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={requestForm.clientId}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <input
                type="text"
                value={requestForm.roomId}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    roomId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() =>
              makeApiCall("requestControl", requestForm, "requestControl")
            }
            disabled={loading.requestControl}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Request Control
          </button>
          <ResponseDisplay
            response={responses.requestControl}
            isLoading={loading.requestControl}
          />
        </div>

        {/* Approve Client Request */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            4. Approve Client Request
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Host ID</label>
              <input
                type="text"
                value={approveForm.hostId}
                onChange={(e) =>
                  setApproveForm((prev) => ({
                    ...prev,
                    hostId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <input
                type="text"
                value={approveForm.roomId}
                onChange={(e) =>
                  setApproveForm((prev) => ({
                    ...prev,
                    roomId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={approveForm.clientId}
                onChange={(e) =>
                  setApproveForm((prev) => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() =>
              makeApiCall("approveClientRequest", approveForm, "approveRequest")
            }
            disabled={loading.approveRequest}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            Approve Request
          </button>
          <ResponseDisplay
            response={responses.approveRequest}
            isLoading={loading.approveRequest}
          />
        </div>

        {/* Request Room Peer ID */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            5. Request Room Peer ID
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={peerIdForm.clientId}
                onChange={(e) =>
                  setPeerIdForm((prev) => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <input
                type="text"
                value={peerIdForm.roomId}
                onChange={(e) =>
                  setPeerIdForm((prev) => ({ ...prev, roomId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() =>
              makeApiCall("requestRoomPeerId", peerIdForm, "requestPeerId")
            }
            disabled={loading.requestPeerId}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Request Peer ID
          </button>
          <ResponseDisplay
            response={responses.requestPeerId}
            isLoading={loading.requestPeerId}
          />
        </div>

        {/* Room Status */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Room Status (Debug)</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Room ID (optional - leave empty for all rooms)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="roomStatusInput"
            />
            <button
              onClick={() => {
                const input = document.getElementById(
                  "roomStatusInput"
                ) as HTMLInputElement;
                const roomId = input.value.trim();
                const url = roomId
                  ? `/api/getRoomStatus?roomId=${encodeURIComponent(roomId)}`
                  : "/api/getRoomStatus";

                setLoading((prev) => ({ ...prev, roomStatus: true }));
                fetch(url, {
                  headers: { Authorization: `Bearer ${authToken}` },
                })
                  .then((response) => response.json())
                  .then((result) =>
                    setResponses((prev) => ({ ...prev, roomStatus: result }))
                  )
                  .catch((error) =>
                    setResponses((prev) => ({
                      ...prev,
                      roomStatus: { error: `Network error: ${error}` },
                    }))
                  )
                  .finally(() =>
                    setLoading((prev) => ({ ...prev, roomStatus: false }))
                  );
              }}
              disabled={loading.roomStatus}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Get Status
            </button>
          </div>
          <ResponseDisplay
            response={responses.roomStatus}
            isLoading={loading.roomStatus}
          />
        </div>

        {/* Instructions */}
        <div className="p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Create a room by calling "Create Room" with your auth token
              matching the Host ID
            </li>
            <li>
              Set the host as ready by calling "Host Is Ready For Control" with
              the same Host ID and Room ID
            </li>
            <li>
              Change your auth token to match the Client ID, then call "Request
              Control"
            </li>
            <li>
              Change your auth token back to the Host ID, then call "Approve
              Client Request"
            </li>
            <li>
              Change your auth token back to the Client ID, then call "Request
              Room Peer ID" to get the host's peer ID
            </li>
            <li>
              Use "Room Status" to debug and see the current state of rooms
            </li>
          </ol>
          <p className="mt-4 text-sm text-gray-600">
            Note: Authentication is simplified for this demo. The auth token
            serves as both authentication and user identification.
          </p>
        </div>
      </div>
    </div>
  );
}
