
import { useEffect, useState } from "react";
import { IStudent } from "../interfaces/student";

export function useStudents(classId: string) {
  const [students, setStudents] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch(`/api/class/students?classId=${classId}`);
    const data = await res.json();
    setStudents(data.students || []);
    console.log("Fetched students:", data.students);
    setLoading(false);
  };

  useEffect(() => {
    if (classId) fetchStudents();
  }, [classId]);

  return {
    students,
    loading,
    refresh: fetchStudents,
  };
}
