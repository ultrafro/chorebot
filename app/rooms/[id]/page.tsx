"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { useCamera } from "../../hooks/useCamera";
import { usePeerJS } from "../../hooks/usePeerJS";
import {
  RoomData,
  ClientRoomInfo,
  ClientRoomInfoResponse,
  RoomResponse,
} from "./roomUI.model";
import HostView from "./HostView";
import ClientView from "./ClientView";
import CameraSelectionModal from "./CameraSelectionModal";
import { useBasicRoomInfo } from "./useBasicRoomInfo";
import { RoomStatus } from "./RoomStatus";
import { useSignInAnonymouslyWhenRoomLoads } from "./useSignInAnonymouslyWhenRoomLoads";

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, session, loading: authLoading, signInAnonymously } = useAuth();

  // Initialize camera and PeerJS hooks
  const peerJS = usePeerJS();

  useSignInAnonymouslyWhenRoomLoads();

  const basicRoomInfo = useBasicRoomInfo(id as string, user);

  //if this is room host, show host view
  const isHost = basicRoomInfo?.isHost;
  const isClient = !isHost && !!user?.id && !!basicRoomInfo;

  if (!basicRoomInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <RoomStatus roomData={basicRoomInfo} user={user} />
      <div className="flex-1 p-4">
        {isHost && <HostView roomData={basicRoomInfo} peerJS={peerJS} />}
        {isClient && (
          <ClientView roomData={basicRoomInfo} peerJS={peerJS} user={user} />
        )}
      </div>
    </div>
  );
}
