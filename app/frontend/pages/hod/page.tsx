"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AppLayout from "../../AppLayout";
import { HOD_MENU_ITEMS } from "../../constants/sidebar";
import RequiredRoles from "../../auth/RequiredRoles";
import RequireFeature from "../../auth/RequireFeature";
import Dashboard from "../../components/hod/dashboard";
import Classes from "../../components/hod/classes";
import TeacherAttendence from "../../components/hod/teacherAttendence";
import StudentAttendence from "../../components/hod/studentAttendence";
import AddUser from "../../components/hod/addUser";
import AddStudents from "../../components/hod/addStudents";
import TeacherAudit from "../../components/hod/teacherAudit";
import Circular from "../../components/hod/circular";
import ExamAndSyllabus from "../../components/hod/examAndSyllabus";
import RoomAllocation from "../../components/hod/roomAllocation";
import NewsFeed from "../../components/hod/newsFeed";
import WorkShops from "../../components/hod/workShops";
import TimeTable from "../../components/hod/timeTable";
import Library from "../../components/hod/library";
import Assignments from "../../components/hod/assignments";
import Marks from "../../components/hod/marks";
import Analysis from "../../components/hod/analysis";
import Settings from "../../components/hod/settings";

const HOD_TAB_TITLES = {
  dashboard: "Dashboard",
  classes: "Classes",
  teacherAttendence: "Teacher Attendance",
  studentAttendence: "Student Attendance",
  addUser: "Add User",
  addStudents: "Add Students",
  teacherAudit: "Teacher Audit",
  circular: "Circulars",
  examAndSyllabus: "Exam Syllabus",
  roomAllocation: "Room Allocation",
  newsFeed: "News Feed",
  workShops: "Workshops",
  timeTable: "Time Table",
  library: "Library",
  assignments: "Assignments",
  marks: "Marks",
  analysis: "Analysis",
  settings: "Settings",
};

function HodDashboardInner() {
  const { data: session } = useSession();
  const tab = useSearchParams().get("tab") ?? "dashboard";
  const title = (HOD_TAB_TITLES as any)[tab] ?? tab.toUpperCase();
  const [profile, setProfile] = useState({
    name: session?.user?.name ?? "HOD",
    subtitle: "Head of Department",
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
      case "classes":
        return <Classes />;
      case "teacherAttendence":
        return <TeacherAttendence />;
      case "studentAttendence":
        return <StudentAttendence />;
      case "addUser":
        return <AddUser />;
      case "addStudents":
        return <AddStudents />;
      case "teacherAudit":
        return <TeacherAudit />;
      case "circular":
        return <Circular />;
      case "examAndSyllabus":
        return <ExamAndSyllabus />;
      case "roomAllocation":
        return <RoomAllocation />;
      case "newsFeed":
        return <NewsFeed />;
      case "workShops":
        return <WorkShops />;
      case "timeTable":
        return <TimeTable />;
      case "library":
        return <Library />;
      case "assignments":
        return <Assignments />;
      case "marks":
        return <Marks />;
      case "analysis":
        return <Analysis />;
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
            name: u.name ?? "HOD",
            subtitle: "Head of Department",
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
    <RequiredRoles allowedRoles={["HOD"]}>
      <RequireFeature requiredFeature={tab}>
        <AppLayout
          activeTab={tab}
          title={title}
          menuItems={HOD_MENU_ITEMS}
          profile={profile}
          children={renderTabContent()}
        />
      </RequireFeature>
    </RequiredRoles>
  );
}

export default function HodDashboardContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/70">Loading…</div>}>
      <HodDashboardInner />
    </Suspense>
  );
}
