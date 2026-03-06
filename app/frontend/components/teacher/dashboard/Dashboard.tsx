"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../../common/PageHeader";
import { TeacherDashboardContent } from "./dashboardComponents/TeacherDashboardSections";
import { TeacherDashboardData } from "./dashboardComponents/types";
import { Sun } from "lucide-react";
import Spinner from "../../common/Spinner";

export default function TeacherDashboard() {
    const router = useRouter();
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/teacher/dashboard", { 
                    credentials: "include",
                    cache: "no-store"
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || (res.status === 401 ? "Unauthorized" : "Failed to load dashboard"));
                }
                const payload = (await res.json()) as TeacherDashboardData;
                if (!cancelled) setData(payload);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Unable to load dashboard");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <main className="flex-1 px-3 sm:px-4">
                <Spinner />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex-1 overflow-y-auto px-3 sm:px-4">
                <div className="py-6 sm:p-6 text-center text-red-400">{error}</div>
            </main>
        );
    }

    const stats = data?.stats ?? { totalClasses: 0, pendingChats: 0 };

    return (
        <div className="transition-all duration-500 opacity-100 scale-100 blur-0 
        animate-fadeIn max-w-7xl mx-auto space-y-6 pb-6 animate-fadeIn">
            {/* Hero Welcome Card */}
            <div className="
               rounded-2xl p-6 relative overflow-hidden group bg-white/5 backdrop-blur-xl border-b border-white/10
                    ">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white tracking-tight">
                    {getGreeting()}, {data?.profile?.name ?? "Teacher"} ☀️
                </h1>

                <p className="text-gray-400 text-sm md:text-base max-w-2xl">
                    Welcome back to your dashboard. You have{" "}
                    <span className="text-lime-300 font-semibold">
                        {stats.totalClasses} classes
                    </span>{" "}
                    scheduled for today and{" "}
                    <span className="text-lime-300 font-semibold">
                        {stats.pendingChats} new messages
                    </span>{" "}
                    from parents.
                </p>
            </div>

            {data && (
                <TeacherDashboardContent
                    data={data}
                    onManageClasses={() => router.push("/frontend/pages/teacher?tab=classes")}
                    onOpenChat={() => router.push("/frontend/pages/teacher?tab=chat")}
                />
            )}
        </div>

    );
}
