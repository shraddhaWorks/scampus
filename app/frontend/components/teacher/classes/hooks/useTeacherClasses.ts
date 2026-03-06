"use client";

import { useEffect, useState } from "react";

export type TeacherClass = {
  id: string;
  name: string;
  section?: string | null;
  teacher?: { name?: string | null; subject?: string | null };
  _count?: { students?: number };
};

export type StudentRow = {
  id: string;
  rollNo?: string | null;
  admissionNumber?: string | null;
  phoneNo?: string | null;
  photoUrl?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    photoUrl?: string | null;
    image?: string | null;
  };
  class?: { id: string; name: string; section?: string | null };
};

type ClassesState = {
  classes: TeacherClass[];
  students: StudentRow[];
  loading: boolean;
  error: string | null;
};

export function useTeacherClasses() {
  const [state, setState] = useState<ClassesState>({
    classes: [],
    students: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [classRes, studentRes] = await Promise.all([
          fetch("/api/class/list"),
          fetch("/api/student/list"),
        ]);

        if (!classRes.ok) throw new Error("Failed to load classes.");

        const classData = await classRes.json();
        const studentData = studentRes.ok ? await studentRes.json() : null;

        if (!isMounted) return;

        setState({
          classes: Array.isArray(classData?.classes) ? classData.classes : [],
          students: Array.isArray(studentData?.students) ? studentData.students : [],
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setState({
          classes: [],
          students: [],
          loading: false,
          error: err?.message ?? "Unable to load classes.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
