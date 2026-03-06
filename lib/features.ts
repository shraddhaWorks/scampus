/**
 * Central list of feature keys for granular access control.
 * When creating a Teacher, HOD, or Principal, toggles map to these keys.
 * IDs should match sidebar tab/permission where used for access checks.
 */

export const FEATURES = [
  { id: "dashboard", label: "Dashboard", description: "Overview and analytics" },
  { id: "classes", label: "Classes", description: "Manage class sections" },
  { id: "students", label: "Students", description: "Student directory" },
  { id: "add-user", label: "Add User", description: "Create users (Principal, HOD, Teacher, Student)" },
  { id: "principal", label: "Principal", description: "Principal management" },
  { id: "student-details", label: "Student Details", description: "View student details" },
  { id: "teachers", label: "Teachers", description: "Teachers list" },
  { id: "teacher-leaves", label: "Teacher Leaves", description: "Teacher leave requests" },
  { id: "teacher-audit", label: "Teacher Audit", description: "Teacher audit records" },
  { id: "workshops", label: "Workshops & Events", description: "Workshops and events" },
  { id: "newsfeed", label: "News Feed", description: "School news and updates" },
  { id: "circulars", label: "Circulars", description: "Circulars and notices" },
  { id: "certificates", label: "Certificates", description: "Issue and manage certificates" },
  { id: "fees", label: "Fees", description: "Fees and payments" },
  { id: "exams", label: "Exams", description: "Exams and syllabus" },
  { id: "analysis", label: "Analysis", description: "School analysis and reports" },
  { id: "roomAllocation", label: "Room Allocation", description: "Classroom and room allocations" },
  { id: "bus", label: "Bus", description: "Bus routes and bookings" },
  { id: "hostel", label: "Hostel", description: "Hostel and cot bookings" },
  { id: "timeTable", label: "Timetable", description: "Timetable management" },
  { id: "library", label: "Library", description: "Library resources and issues" },
  { id: "marks-entry", label: "Marks Entry", description: "Enter and manage student marks" },
  { id: "marks-view", label: "Marks View", description: "View marks and reports" },
  { id: "attendance-mark", label: "Attendance Mark", description: "Mark daily attendance" },
  { id: "attendance-view", label: "Attendance View", description: "View attendance records" },
  { id: "homework", label: "Homework", description: "Create and manage homework" },
  { id: "communication", label: "Communication", description: "Appointments and messages" },
  { id: "leaves", label: "Leaves Management", description: "Apply and view leave requests" },
  { id: "student-leaves", label: "Student Leave Approval", description: "Approve student leave requests" },
  { id: "school", label: "School Details", description: "School information" },
  { id: "payments", label: "Payments", description: "Payments" },
  { id: "tc", label: "Transfer Certificate", description: "TC requests and approval" },
  { id: "profile", label: "Profile", description: "View and edit the profile" },
  { id: "settings", label: "Settings", description: "App and portal settings" },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];

export const FEATURE_IDS = FEATURES.map((f) => f.id);

/** Default features for a new teacher when none selected (empty = use role default in UI) */
export function getDefaultFeaturesForRole(role: "TEACHER" | "SCHOOLADMIN"): FeatureId[] {
  if (role === "SCHOOLADMIN") return [...FEATURE_IDS];
  return [
    "dashboard",
    "classes",
    "students",
    "teachers",
    "marks-entry",
    "marks-view",
    "attendance-mark",
    "attendance-view",
    "homework",
    "newsfeed",
    "workshops",
    "exams",
    "communication",
    "leaves",
    "student-leaves",
    "certificates",
    "tc",
    "profile",
    "settings",
  ];
}
