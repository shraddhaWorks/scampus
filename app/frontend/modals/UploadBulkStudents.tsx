
import { useState } from "react";
import { toast } from "../services/toast.service";
import { assignStudentsToClass } from "../services/student.service";
import { PRIMARY_COLOR } from "../constants/colors";


export default function UploadCSVModal({ classId, onClose, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      setLoading(true);

      /* ================= 1.BULK UPLOAD ================= */

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/student/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        toast.error(uploadData.message || "Bulk upload failed");
        return;
      }

      /* ================= 2.FETCH UNASSIGNED STUDENTS (FIX) ================= */

      const studentsRes = await fetch("/api/student/list");
      const studentsData = await studentsRes.json();

      if (!studentsRes.ok || !Array.isArray(studentsData.students)) {
        toast.error("Failed to fetch students");
        return;
      }

      //  filter only unassigned students
      const unassignedStudents = studentsData.students.filter(
        (student: any) => !student.class
      );

      if (unassignedStudents.length === 0) {
        toast.error("No unassigned students found");
        return;
      }

      /* ================= 3.ASSIGN TO CLASS ================= */

      for (const student of unassignedStudents) {
        const assignRes = await assignStudentsToClass(
          student.id,
          classId
        );

        const assignData = await assignRes.json();

        if (!assignRes.ok) {
          toast.error(
            assignData.message ||
              `Failed to assign student ${student.user?.name || ""}`
          );
          return;
        }
      }

      /* ================= SUCCESS ================= */

      toast.success(
        `${uploadData.createdCount} students added & assigned successfully`
      );

      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Something went wrong during bulk upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[400px]">
        <h3 className="font-semibold mb-4">Upload Students CSV</h3>

        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="border px-4 py-2 rounded border-gray-300">
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            style={{ backgroundColor: PRIMARY_COLOR }}
            className="text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
