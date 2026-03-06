"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AppLayout from "../../AppLayout";
import { PRINCIPAL_MENU_ITEMS } from "../../constants/sidebar";
import RequiredRoles from "../../auth/RequiredRoles";
import RequireFeature from "../../auth/RequireFeature";
import Dashboard from "../../components/principle/dashboard";
import AddHod from "../../components/principle/addHod";
import AddUser from "../../components/principle/addUser";
import Analysis from "../../components/principle/analysis";
import BusBooking from "../../components/principle/busBooking";
import Certificates from "../../components/principle/certificates";
import Circular from "../../components/principle/circular";
import ExamSyllubus from "../../components/principle/examSyllubus";
import Fees from "../../components/principle/fees";
import HodLeaves from "../../components/principle/hodLeaves";
import HostelBooking from "../../components/principle/hostelBooking";
import Library from "../../components/principle/library";
import Marks from "../../components/principle/marks";
import NewsFeed from "../../components/principle/newsFeed";
import RoomAllocation from "../../components/principle/roomAllocation";
import StudentDetails from "../../components/principle/studentDetails";
import TeacherAttendennce from "../../components/principle/teacherAttendennce";
import TeacherAudit from "../../components/principle/teacherAudit";
import TimeTable from "../../components/principle/timeTable";
import WorkShops from "../../components/principle/workShops";
import Settings from "../../components/principle/settings";

const PRINCIPAL_TAB_TITLES = {
  dashboard: "Dashboard",
  addHod: "Add HOD",
  addUser: "Add User",
  analysis: "Analysis",
  busBooking: "Bus Booking",
  certificates: "Certificates",
  circular: "Circulars",
  examSyllubus: "Exam Syllabus",
  fees: "Fees",
  hodLeaves: "HOD Leaves",
  hostelBooking: "Hostel Booking",
  library: "Library",
  marks: "Marks",
  newsFeed: "News Feed",
  roomAllocation: "Room Allocation",
  studentDetails: "Student Details",
  teacherAttendennce: "Teacher Attendance",
  teacherAudit: "Teacher Audit",
  timeTable: "Time Table",
  workShops: "Workshops",
  settings: "Settings",
};

function PrincipalDashboardInner() {
  const { data: session } = useSession();
  const tab = useSearchParams().get("tab") ?? "dashboard";
  const title = (PRINCIPAL_TAB_TITLES as any)[tab] ?? tab.toUpperCase();
  const [profile, setProfile] = useState({
    name: session?.user?.name ?? "Principal",
    subtitle: "Principal",
    image: null as string | null,
    email: undefined as string | undefined,
    phone: undefined as string | undefined,
    address: undefined as string | undefined,
    userId: undefined as string | undefined,
  });

  const renderTabContent = () => {
    switch (tab) {
      case "dashboard":
        return <Dashboard />;
      case "addHod":
        return <AddHod />;
      case "addUser":
        return <AddUser />;
      case "analysis":
        return <Analysis />;
      case "busBooking":
        return <BusBooking />;
      case "certificates":
        return <Certificates />;
      case "circular":
        return <Circular />;
      case "examSyllubus":
        return <ExamSyllubus />;
      case "fees":
        return <Fees />;
      case "hodLeaves":
        return <HodLeaves />;
      case "hostelBooking":
        return <HostelBooking />;
      case "library":
        return <Library />;
      case "marks":
        return <Marks />;
      case "newsFeed":
        return <NewsFeed />;
      case "roomAllocation":
        return <RoomAllocation />;
      case "studentDetails":
        return <StudentDetails />;
      case "teacherAttendennce":
        return <TeacherAttendennce />;
      case "teacherAudit":
        return <TeacherAudit />;
      case "timeTable":
        return <TimeTable />;
      case "workShops":
        return <WorkShops />;
      case "settings":
        return <Settings />;
      default:
        return <div>Unknown Tab</div>;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();
        if (cancelled || !res.ok) return;
        const u = data.user;
        if (u) {
          setProfile({
            name: u.name ?? "Principal",
            subtitle: "Principal",
            image: u.photoUrl ?? null,
            email: u.email ?? undefined,
            phone: u.mobile ?? undefined,
            address: u.address ?? undefined,
            userId: u.id ?? undefined,
          });
        }
      } catch {
        // keep session-based default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.name]);

  return (
    <RequiredRoles allowedRoles={["PRINCIPAL"]}>
      <RequireFeature requiredFeature={tab}>
        <AppLayout
          activeTab={tab}
          title={title}
          menuItems={PRINCIPAL_MENU_ITEMS}
          profile={profile}
          children={renderTabContent()}
        />
      </RequireFeature>
    </RequiredRoles>
  );
}

export default function PrincipalDashboardContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/70">Loading…</div>}>
      <PrincipalDashboardInner />
    </Suspense>
  );
}
