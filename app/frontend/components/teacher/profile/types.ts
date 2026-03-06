export type TeacherStatus = "Active" | "Inactive";

export interface TeacherProfileData {
  name: string;
  teacherId: string;
  subject: string;
  assignedClasses: string;
  qualification: string;
  experience: string;
  joiningDate: string;
  status: TeacherStatus;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
}

export interface ClassHandlingItem {
  className: string;
  subject: string;
  students: number;
}

export interface QuickStats {
  totalClasses: number;
  totalStudents: number;
  workshopsConducted: number;
}
