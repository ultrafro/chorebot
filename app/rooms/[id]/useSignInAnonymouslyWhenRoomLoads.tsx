import { useAuth } from "@/app/lib/auth";
import { useEffect } from "react";

export function useSignInAnonymouslyWhenRoomLoads() {
  const { user, session, loading, signIn, signUp, signOut, signInAnonymously } =
    useAuth();

  useEffect(() => {
    if (!user && !loading) {
      signInAnonymously();
    }
  }, [user, loading, signInAnonymously]);
}
