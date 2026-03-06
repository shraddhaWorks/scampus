"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ExtraFee } from "./types";

interface ExtraFeesListProps {
  extraFees: ExtraFee[];
  classes: Array<{ id: string; name: string; section: string | null }>;
  students: Array<{ id: string; user: { name: string | null }; admissionNumber: string }>;
  onSuccess: () => void;
}

function targetLabel(
  ef: ExtraFee,
  classes: Array<{ id: string; name: string; section: string | null }>,
  students: Array<{ id: string; user: { name: string | null }; admissionNumber: string }>
) {
  if (ef.targetType === "SCHOOL") return "Entire School";
  if (ef.targetType === "CLASS" && ef.targetClassId) {
    const c = classes.find((x) => x.id === ef.targetClassId);
    return c ? `Class ${c.name}${c.section ? `-${c.section}` : ""}` : "Class";
  }
  if (ef.targetType === "SECTION" && ef.targetClassId && ef.targetSection) {
    const c = classes.find((x) => x.id === ef.targetClassId);
    return c ? `Section ${c.name}-${ef.targetSection}` : "Section";
  }
  if (ef.targetType === "STUDENT" && ef.targetStudentId) {
    const s = students.find((x) => x.id === ef.targetStudentId);
    return s ? s.user?.name || s.admissionNumber : "Student";
  }
  return "-";
}

export default function ExtraFeesList({
  extraFees,
  classes,
  students,
  onSuccess,
}: ExtraFeesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const startEdit = (ef: ExtraFee) => {
    setEditingId(ef.id);
    setEditName(ef.name);
    setEditAmount(String(ef.amount));
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim() || !editAmount || Number(editAmount) <= 0)
      return;
    try {
      const res = await fetch(`/api/fees/extra/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          amount: Number(editAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update");
        return;
      }
      setEditingId(null);
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Failed to update");
    }
  };

  const handleDelete = async (ef: ExtraFee) => {
    if (!confirm(`Do you really want to delete "${ef.name}"? Student amounts will be recalculated. This action cannot be undone.`))
      return;
    try {
      const res = await fetch(`/api/fees/extra/${ef.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete");
        return;
      }
      setEditingId(null);
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  if (extraFees.length === 0) return null;

  return (
    <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">All Extra Fees</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10">
              <th className="py-3">Name</th>
              <th className="py-3">Amount</th>
              <th className="py-3">Applies To</th>
              <th className="py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {extraFees.map((ef) => (
              <tr key={ef.id} className="border-b border-white/5">
                <td className="py-3">
                  {editingId === ef.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/10 px-2 py-1.5 text-sm w-full max-w-[180px]"
                    />
                  ) : (
                    <span className="text-white">{ef.name}</span>
                  )}
                </td>
                <td className="py-3">
                  {editingId === ef.id ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/10 px-2 py-1.5 text-sm w-24"
                    />
                  ) : (
                    <span className="text-white">₹{ef.amount.toLocaleString()}</span>
                  )}
                </td>
                <td className="py-3 text-gray-400">
                  {targetLabel(ef, classes, students)}
                </td>
                <td className="py-3">
                  {editingId === ef.id ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handleUpdate}
                        className="px-2 py-1 rounded-lg bg-lime-500/20 text-lime-400 text-xs hover:bg-lime-500/30"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded-lg border border-white/20 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(ef)}
                        className="p-1.5 rounded-lg hover:bg-white/10"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ef)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
