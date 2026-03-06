"use client";

import { useState, useEffect, useCallback } from "react";

export interface StudentWithRelations {
  id: string;
  admissionNumber: string;
  rollNo: string | null;
  fatherName: string;
  aadhaarNo: string;
  phoneNo: string;
  dob: string;
  address: string | null;
  classId: string | null;
  user: { id: string; name: string | null; email: string | null };
  class?: { id: string; name: string; section: string | null } | null;
}

interface UseStudentsResult {
  students: StudentWithRelations[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<StudentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch students");
      setStudents(data.students ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { students, loading, error, refetch };
}
