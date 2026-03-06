"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import SelectInput from "../../common/SelectInput";
import SearchInput from "../../common/SearchInput";
import RefundModal, { type TransactionItem } from "./RefundModal";
import type { Student } from "./types";

interface FeeTransactionsListProps {
  students: Student[];
  onSuccess: () => void;
}

interface ClassItem {
  id: string;
  name: string;
  section: string | null;
}

interface ClassDetailStudent {
  id: string;
  admissionNumber: string;
  user?: { name?: string | null } | null;
  class?: { section?: string | null } | null;
}

export default function FeeTransactionsList({ students: _students, onSuccess }: FeeTransactionsListProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [classStudents, setClassStudents] = useState<ClassDetailStudent[]>([]);
  const [refundTarget, setRefundTarget] = useState<TransactionItem | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fees/transactions");
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setClassLoading(true);
    try {
      const res = await fetch("/api/class/list");
      const data = await res.json();
      if (res.ok) {
        setClasses(Array.isArray(data.classes) ? data.classes : []);
      } else {
        setClasses([]);
      }
    } catch {
      setClasses([]);
    } finally {
      setClassLoading(false);
    }
  };

  const fetchClassDetails = async (classId: string) => {
    if (!classId) {
      setClassStudents([]);
      setSelectedSection("");
      return;
    }
    setSectionLoading(true);
    try {
      const res = await fetch(`/api/class/${encodeURIComponent(classId)}`);
      const data = await res.json();
      if (res.ok && data.class) {
        setSelectedSection("");
        setClassStudents(Array.isArray(data.class.students) ? data.class.students : []);
      } else {
        setSelectedSection("");
        setClassStudents([]);
      }
    } catch {
      setSelectedSection("");
      setClassStudents([]);
    } finally {
      setSectionLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    fetchClassDetails(selectedClassId);
  }, [selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    const sectionFromClass = selectedClass.section || "";
    const sectionFromStudents = Array.from(
      new Set(
        classStudents
          .map((s) => s.class?.section || "")
          .filter((x) => x !== "")
      )
    );
    const unique = Array.from(new Set([sectionFromClass, ...sectionFromStudents].filter(Boolean)));
    return [
      { label: "All Sections", value: "" },
      ...unique.map((s) => ({ label: s, value: s })),
    ];
  }, [selectedClass, classStudents]);

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        transactions.map((t) => String(new Date(t.createdAt).getFullYear()))
      )
    ).sort((a, b) => Number(b) - Number(a));
    return [
      { label: "All Years", value: "" },
      ...years.map((y) => ({ label: y, value: y })),
    ];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txClassName = t.student.class?.name || "";
      const txSection = t.student.class?.section || "";
      const txYear = String(new Date(t.createdAt).getFullYear());
      const txStudentName = t.student.user?.name || "";
      const txAdmission = t.student.admissionNumber || "";

      const matchClass = selectedClass ? txClassName === selectedClass.name : true;
      const matchSection = selectedSection ? txSection === selectedSection : true;
      const matchYear = selectedYear ? txYear === selectedYear : true;
      const search = studentSearch.trim().toLowerCase();
      const matchStudent =
        !search ||
        txStudentName.toLowerCase().includes(search) ||
        txAdmission.toLowerCase().includes(search);

      return matchClass && matchSection && matchYear && matchStudent;
    });
  }, [transactions, selectedClass, selectedSection, selectedYear, studentSearch]);

  return (
    <section className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-amber-400" />
        Fee Transactions & Refunds
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        View successful payments and process refunds when needed.
      </p>
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <SearchInput
              label="Search Student"
              value={studentSearch}
              onChange={setStudentSearch}
              icon={Search}
              showSearchIcon
              placeholder="Name or ID..."
              variant="glass"
            />
          </div>
          <div>
            <SelectInput
              label="Year"
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
            />
          </div>
          <div>
            <SelectInput
              label="Class"
              value={selectedClassId}
              onChange={setSelectedClassId}
              disabled={classLoading}
              options={[
                { label: "All Classes", value: "" },
                ...classes.map((c) => ({
                  label: c.name,
                  value: c.id,
                })),
              ]}
            />
          </div>
          <div>
            <SelectInput
              label="Section"
              value={selectedSection}
              onChange={setSelectedSection}
              disabled={!selectedClassId || sectionLoading}
              options={
                selectedClassId
                  ? sectionOptions
                  : [{ label: "All Sections", value: "" }]
              }
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-8 text-center text-gray-400">No transactions found</div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Class</th>
                <th className="pb-3 font-medium">Gateway</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Refunded</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="py-3 text-gray-400 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-white font-medium">
                    {t.student.user?.name || t.student.admissionNumber || "-"}
                  </td>
                  <td className="py-3 text-gray-400">
                    {t.student.class
                      ? `${t.student.class.name}${t.student.class.section ? `-${t.student.class.section}` : ""}`
                      : "-"}
                  </td>
                  <td className="py-3 text-gray-400">{t.gateway}</td>
                  <td className="py-3 text-emerald-400">₹{t.amount.toLocaleString()}</td>
                  <td className="py-3">
                    {t.refundable < t.amount ? (
                      <span className="text-amber-400">
                        ₹{(t.amount - t.refundable).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {t.refundable > 0 ? (
                      <button
                        onClick={() => setRefundTarget(t)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium"
                      >
                        Refund
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs">Full refund</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RefundModal
        transaction={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          fetchTransactions();
          onSuccess();
        }}
      />
    </section>
  );
}
