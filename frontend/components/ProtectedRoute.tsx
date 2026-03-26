"use client";

import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import { session } from "@/lib/api";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = session.getToken();
    if (!token) {
      router.replace("/signup");
      setIsHydrated(true);
    } else {
      setIsAuthenticated(true);
      setIsHydrated(true);
    }
  }, [router]);

  // During SSR and initial render, return consistent markup
  if (!isHydrated) {
    return <div style={{ width: "100vw", height: "100vh", background: "#F5F5F7" }} />;
  }

  // After hydration, show content if authenticated
  if (!isAuthenticated) {
    return <div style={{ width: "100vw", height: "100vh", background: "#F5F5F7" }} />;
  }

  return <>{children}</>;
}
