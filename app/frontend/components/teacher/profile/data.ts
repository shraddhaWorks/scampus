import { ClassHandlingItem, QuickStats, TeacherProfileData } from "./types";

export const DEFAULT_TEACHER_PROFILE: TeacherProfileData = {
  name: "Mrs. Priya Sharma",
  teacherId: "EMP2021/015",
  subject: "Mathematics",
  assignedClasses: "10-A, 10-B",
  qualification: "M.Sc Mathematics, B.Ed",
  experience: "8 years",
  joiningDate: "01/08/2021",
  status: "Active",
  email: "priya.sharma@timelly.school.com",
  phone: "+91 98765 12345",
  address: "456, Teachers Colony, New Delhi - 110017",
  avatarUrl: "https://i.pravatar.cc/240?img=47",
};

export const CLASS_HANDLING: ClassHandlingItem[] = [
  { className: "Class 10-A", subject: "Mathematics", students: 45 },
  { className: "Class 10-B", subject: "Mathematics", students: 42 },
  { className: "Class 9-A", subject: "Mathematics", students: 48 },
  { className: "Class 9-B", subject: "Mathematics", students: 44 },
];

export const QUICK_STATS: QuickStats = {
  totalClasses: 4,
  totalStudents: 179,
  workshopsConducted: 12,
};

export const STATUS_OPTIONS = [
  { id: "Active", name: "Active" },
  { id: "Inactive", name: "Inactive" },
];
