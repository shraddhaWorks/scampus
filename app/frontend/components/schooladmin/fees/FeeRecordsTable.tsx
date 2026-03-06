"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import SelectInput from "../../common/SelectInput";
import type { Class, FeeRecord } from "./types";

interface FeeRecordsTableProps {
  fees: FeeRecord[];
  classes: Class[];
}

export default function FeeRecordsTable({ fees, classes }: FeeRecordsTableProps) {
  const [searchName, setSearchName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const filteredFees = fees.filter((f) => {
    const name = (f.student.user?.name || "").toLowerCase();
    const q = searchName.toLowerCase();
    if (q && !name.includes(q)) return false;
    if (selectedClass && f.student.class?.id !== selectedClass) return false;
    return true;
  });

  return (
    <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Fee Records ({filteredFees.length})</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Name or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white"
          />
        </div>
        <SelectInput
          value={selectedClass}
          onChange={setSelectedClass}
          options={[
            { label: "All Classes", value: "" },
            ...classes.map((c) => ({
              label: `${c.name}${c.section ? `-${c.section}` : ""}`,
              value: c.id,
            })),
          ]}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10">
              <th className="py-3">Student</th>
              <th className="py-3">Class</th>
              <th className="py-3">Total</th>
              <th className="py-3">Paid</th>
              <th className="py-3">Pending</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.map((f) => (
              <tr key={f.id} className="border-b border-white/5">
                <td className="py-3">{f.student.user?.name || "-"}</td>
                <td className="py-3">
                  {f.student.class
                    ? `${f.student.class.name}${f.student.class.section ? `-${f.student.class.section}` : ""}`
                    : "-"}
                </td>
                <td className="py-3">₹{f.finalFee.toLocaleString()}</td>
                <td className="py-3 text-emerald-400">₹{f.amountPaid.toLocaleString()}</td>
                <td className="py-3 text-amber-400">₹{f.remainingFee.toLocaleString()}</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      f.remainingFee <= 0
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {f.remainingFee <= 0 ? "Paid" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
