"use client";

import { useSearchParams } from "next/navigation";
import AppLayout from "../../AppLayout";
import { PARENT_MENU_ITEMS } from "../../constants/sidebar";
import RequiredRoles from "../../auth/RequiredRoles";
import ParentFeesTab from "./ParentFeesTab";

const PARENT_TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  homework: "Homework",
  attendance: "Attendance",
  marks: "Marks",
  chat: "Chat",
  fees: "Fees",
  certificates: "Certificates",
};

function renderTabContent(tab: string) {
  switch (tab) {
    case "fees":
      return <ParentFeesTab />;
    default:
      return <div className="p-6 text-white/60">Content for {tab}</div>;
  }
}

export default function ParentDashboardClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "dashboard";
  const title = PARENT_TAB_TITLES[tab] ?? tab.toUpperCase();

  return (
    <RequiredRoles allowedRoles={["STUDENT"]}>
      <AppLayout
        title={title}
        activeTab={tab}
        menuItems={PARENT_MENU_ITEMS}
        profile={{ name: "Parent", subtitle: "Student Parent" }}
      >
        {renderTabContent(tab)}
      </AppLayout>
    </RequiredRoles>
  );
}
