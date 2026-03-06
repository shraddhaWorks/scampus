"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import SelectInput from "../../common/SelectInput";
import PrimaryButton from "../../common/PrimaryButton";
import type { Class, FeeStructure } from "./types";

interface FeeStructureConfigProps {
  classes: Class[];
  structures: FeeStructure[];
  onSuccess: () => void;
}

export default function FeeStructureConfig({
  classes,
  structures,
  onSuccess,
}: FeeStructureConfigProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [structureClassId, setStructureClassId] = useState("");
  const [components, setComponents] = useState<Array<{ name: string; amount: number }>>([]);

  const startEdit = (s: FeeStructure) => {
    setEditingId(s.id);
    setStructureClassId(s.classId);
    setComponents((s.components as Array<{ name: string; amount: number }>) || []);
  };

  const startNew = () => {
    setEditingId("new");
    setStructureClassId(classes[0]?.id || "");
    setComponents([
      { name: "Tuition Fee", amount: 35000 },
      { name: "Transport Fee", amount: 10000 },
      { name: "Lab Charges", amount: 2500 },
      { name: "Activity Fee", amount: 2500 },
    ]);
  };

  const handleSave = async () => {
    if (!structureClassId || components.length === 0) return;
    try {
      const res = await fetch("/api/fees/structure", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: structureClassId, components }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Failed to save");
        return;
      }
      setEditingId(null);
      onSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Global Fee Breakdown Configuration</h3>
      <p className="text-sm text-gray-400 mb-4">
        Manage base fee structures for different classes. Changes apply to all students in the
        selected class.
      </p>
      <div className="flex flex-wrap gap-4 mb-4">
        {structures.map((s) => (
          <div
            key={s.id}
            className="bg-white/5 rounded-xl p-4 border border-white/10 min-w-[200px]"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  Class {s.class.name}
                  {s.class.section ? `-${s.class.section}` : ""}
                </p>
                <p className="text-sm text-gray-400">
                  Total: ₹
                  {(s.components as Array<{ amount: number }>).reduce((a, c) => a + (c.amount || 0), 0)}
                </p>
              </div>
              <button
                onClick={() => startEdit(s)}
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={startNew}
          className="bg-white/5 rounded-xl p-4 border border-dashed border-white/20 flex items-center gap-2 hover:bg-white/10"
        >
          <Plus size={20} /> Add class structure
        </button>
      </div>
      {editingId && (
        <div className="border-t border-white/10 pt-4 space-y-4">
          <SelectInput
            label="Class"
            value={structureClassId}
            onChange={setStructureClassId}
            options={classes.map((c) => ({
              label: `${c.name}${c.section ? `-${c.section}` : ""}`,
              value: c.id,
            }))}
          />
          <div>
            <p className="text-sm font-medium mb-2">Fee Components</p>
            {components.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => {
                    const n = [...components];
                    n[i] = { ...n[i], name: e.target.value };
                    setComponents(n);
                  }}
                  placeholder="Component name"
                  className="flex-1 rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={c.amount}
                  onChange={(e) => {
                    const n = [...components];
                    n[i] = { ...n[i], amount: Number(e.target.value) };
                    setComponents(n);
                  }}
                  className="w-24 rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setComponents(components.filter((_, idx) => idx !== i))}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                  title="Remove component"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setComponents([...components, { name: "", amount: 0 }])}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              + Add component
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton title="Save Structure" onClick={handleSave} />
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 rounded-xl border border-white/20"
            >
              Cancel
            </button>
            {editingId !== "new" && (
              <button
                type="button"
                onClick={async () => {
                  if (!structureClassId || !confirm("Do you really want to delete this entire class fee structure? Student amounts will be recalculated. This action cannot be undone.")) return;
                  try {
                    const res = await fetch(`/api/fees/structure?classId=${encodeURIComponent(structureClassId)}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) {
                      const d = await res.json();
                      alert(d.message || "Failed to delete");
                      return;
                    }
                    setEditingId(null);
                    onSuccess();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Delete Structure
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
