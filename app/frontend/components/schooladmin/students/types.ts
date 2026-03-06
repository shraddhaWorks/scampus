import { IStudent } from "../../../interfaces/student";

export type ClassItem = {
  id: string;
  name: string;
  section?: string | null;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type StudentFormState = {
  name: string;
  rollNo: string;
  gender: string;
  dob: string;
  previousSchool: string;
  classId: string;
  section: string;
  status: string;
  fatherName: string;
  phoneNo: string;
  email: string;
  aadhaarNo: string;
  totalFee: string;
  discountPercent: string;
  address: string;
};

export type StudentFormErrors = Partial<Record<keyof StudentFormState, string>>;

export type StudentRow = IStudent;
