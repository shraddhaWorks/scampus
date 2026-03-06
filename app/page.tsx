"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/app/frontend/constants/routes";
import Spinner from "./frontend/components/common/Spinner";
import LoginForm from "./frontend/auth/LoginForm";

export default function Home() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.role || hasRedirected) return;

    const roleRoutes: Record<string, string> = {
      SUPERADMIN: ROUTES.SUPERADMIN,
      SCHOOLADMIN: ROUTES.SCHOOLADMIN,
      PRINCIPAL: ROUTES.PRINCIPAL,
      HOD: ROUTES.HOD,
      STUDENT: ROUTES.PARENT,
      TEACHER: ROUTES.TEACHER,
    };
    const role = String(session.user.role).toUpperCase();
    const destination = roleRoutes[role];

    if (destination) {
      setHasRedirected(true);
      window.location.href = destination;
    }
  }, [status, session?.user?.role, hasRedirected]);

  // Always show login form for unauthenticated users
  // Show loading only while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
              <Spinner/>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Loading</h2>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated but redirecting, show loading
  if (status === "authenticated" && session?.user?.role && hasRedirected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
              <Spinner/>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Redirecting</h2>
          <p className="text-gray-400">Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login form for everyone else (unauthenticated or authenticated without valid role)
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <LoginForm />
    </div>
  );
}
