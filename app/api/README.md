# Teletable API Routes

This document describes the API routes implemented according to the backend plan for the Teletable project.

## Setup

### Database Configuration

This API uses Supabase as the database backend. To set up:

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema in `app/api/db/schema.sql` in your Supabase SQL editor
3. Set up environment variables in your `.env.local` file:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (has admin access)

**WARNING**: Keep the service role key secret! Only use it in server-side code.

## Authentication

All routes require authentication via the `Authorization` header with a `Bearer` token:

```
Authorization: Bearer <token>
```

For this demo implementation, the token serves as the user ID. In production, this would be replaced with proper JWT validation.

## Data Structure

### Room Object

```typescript
interface Room {
  roomId: string;
  hostId: string;
  hostPeerId: string | null;
  currentControllingClientId: string | null;
  info: {
    requestingClientIds: Record<
      string,
      {
        clientId: string;
        requestTime: number;
      }
    >;
    version: "0";
  };
}
```

### Database Schema

The `rooms` table in Supabase contains:

- `id` (TEXT, PRIMARY KEY)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `hostId` (TEXT, NOT NULL)
- `hostPeerId` (TEXT, DEFAULT NULL)
- `currentControllingClientId` (TEXT, DEFAULT NULL)
- `info` (JSONB, DEFAULT '{}')

## API Routes

### 1. POST `/api/createRoom`

Creates a new room with the specified host.

**Request Body:**

```json
{
  "roomId": "string",
  "hostId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Room created successfully",
  "room": {
    "roomId": "string",
    "hostId": "string",
    "isReady": false
  }
}
```

**Behavior:**

- Creates a new room with the specified roomId and hostId
- Room is initially not ready (hostPeerId is null)
- Returns error if room already exists
- Only the authenticated user matching hostId can create the room

### 2. POST `/api/hostIsReadyForControl`

Sets up a room and marks the host as ready for control.

**Request Body:**

```json
{
  "hostId": "string",
  "roomId": "string",
  "peerId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "room": {
    "roomId": "string",
    "hostId": "string",
    "isReady": true
  }
}
```

**Behavior:**

- Updates the room with the host's peer ID
- Sets hostId and hostPeerId
- Resets currentControllingClientId to null
- Clears requestingClientIds object

### 3. POST `/api/requestControl`

Allows a client to request control of a room.

**Request Body:**

```json
{
  "clientId": "string",
  "roomId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Control request submitted",
  "requestStatus": "pending"
}
```

**Behavior:**

- Adds clientId to the room's requestingClientIds object
- Room must exist first
- Stores request timestamp

### 4. POST `/api/approveClientRequest`

Host approves a client's control request.

**Request Body:**

```json
{
  "hostId": "string",
  "roomId": "string",
  "clientId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Client request approved",
  "controllingClient": "string"
}
```

**Behavior:**

- Sets currentControllingClientId to the approved clientId
- Removes clientId from requestingClientIds object
- Only the host can approve requests
- Client must have previously requested control

### 5. POST `/api/requestRoomPeerId`

Client polls for approval and retrieves host's peer ID.

**Request Body:**

```json
{
  "clientId": "string",
  "roomId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "hostPeerId": "string",
  "roomId": "string"
}
```

**Behavior:**

- Returns hostPeerId only if clientId matches currentControllingClientId
- Used by clients to establish peer connection after approval

### 6. GET `/api/getRoomStatus` (Debug Route)

Get room status for debugging purposes.

**Query Parameters:**

- `roomId` (optional): Get specific room status, or all rooms if omitted

**Response:**

```json
{
  "success": true,
  "room": {
    "roomId": "string",
    "hostId": "string",
    "hasHostPeerId": boolean,
    "currentControllingClientId": "string | null",
    "requestingClientIds": ["string"],
    "isReady": boolean
  }
}
```

## Error Responses

All routes may return these error responses:

- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User not authorized for this action
- `404 Not Found`: Room not found
- `400 Bad Request`: Missing required fields or invalid request
- `500 Internal Server Error`: Server error or database connection issues

## Test Page

Visit `/test` to access an interactive test page that allows you to test all API routes with a user-friendly interface.

## Typical Flow

1. **Room Creation**: Host calls `/api/createRoom` to create a new room
2. **Host Setup**: Host calls `/api/hostIsReadyForControl` with their peer ID
3. **Client Request**: Client calls `/api/requestControl` to request control
4. **Host Approval**: Host calls `/api/approveClientRequest` to approve the client
5. **Client Connection**: Client calls `/api/requestRoomPeerId` to get host's peer ID and establish connection

## Storage

Uses Supabase (PostgreSQL) for persistent data storage. All room data is stored in the `rooms` table with proper indexing for performance. The service role key provides admin-level access for API operations.

## Migration from In-Memory Storage

This implementation has been migrated from in-memory storage to Supabase. Key changes:

- All `RoomManager` methods are now `async`
- Data is persisted in Supabase's PostgreSQL database
- Automatic timestamps for created_at and updated_at
- JSON storage for complex requesting client data
- Row-level security policies for data protection
