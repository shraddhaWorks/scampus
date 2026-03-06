"use client";

import { useState } from "react";
import SelectInput from "../../common/SelectInput";
import PrimaryButton from "../../common/PrimaryButton";
import SecondaryButton from "../../common/SecondaryButton";
import type { Student } from "./types";

interface OfflinePaymentFormProps {
  students: Student[];
  onSuccess: () => void;
}

export default function OfflinePaymentForm({ students, onSuccess }: OfflinePaymentFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [refNo, setRefNo] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!studentId || !amount || Number(amount) <= 0) {
      alert("Select student and enter amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/fees/offline-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount: Number(amount),
          paymentMode,
          refNo: refNo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to record payment");
        return;
      }
      setShowForm(false);
      setStudentId("");
      setAmount("");
      setRefNo("");
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Offline Payment Entry</h3>
      <p className="text-sm text-gray-400 mb-4">
        Record manual payments, cheque deposits, or bank transfers.
      </p>
      {!showForm ? (
        <SecondaryButton title="Record Offline Payment" onClick={() => setShowForm(true)} />
      ) : (
        <div className="space-y-4">
          <SelectInput
            label="Student"
            value={studentId}
            onChange={setStudentId}
            options={[
              { label: "Select student", value: "" },
              ...students.map((s) => ({
                label: `${s.user.name || s.admissionNumber} (${s.class?.name || "-"})`,
                value: s.id,
              })),
            ]}
          />
          <div>
            <label className="block text-xs text-white/70 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-white"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2">
            {["Cash", "Cheque", "UPI", "Bank"].map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  paymentMode === m ? "bg-emerald-500/30 text-emerald-400" : "bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Ref / Cheque No.</label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-white"
            />
          </div>
          <div className="flex gap-2">
            <PrimaryButton
              title={saving ? "Saving..." : "Generate Receipt & Save"}
              loading={saving}
              onClick={handleSubmit}
            />
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
