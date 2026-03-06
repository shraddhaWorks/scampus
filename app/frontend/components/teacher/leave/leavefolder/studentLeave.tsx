import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Briefcase,
  Clock,
  CheckCircle2,
  Search,
  Calendar,
  Paperclip,
  Check,
  X,
} from "lucide-react";
import { log } from "console";
import PageHeader from "../../../common/PageHeader";
import Spinner from "../../../common/Spinner";

type StudentLeaveItem = {
  attachment: any;
  id: string;
  leaveType: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  student: {
    id: string;
    user: { id: string; name: string | null; email: string | null; photoUrl: string | null } | null;
    class: { id: string; name: string; section: string | null } | null;
  };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateRange(from: string, to: string) {
  return `${formatDate(from)} - ${formatDate(to)}`;
}

function daysBetween(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

function leaveTypeShort(t: string) {
  if (t === "SICK") return "SICK";
  if (t === "CASUAL") return "CASUAL";
  if (t === "PAID") return "PAID";
  if (t === "UNPAID") return "UNPAID";
  return t;
}

export default function StudentLeave() {
  const [subTab, setSubTab] = useState<"pending" | "history">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingLeaves, setPendingLeaves] = useState<StudentLeaveItem[]>([]);
  const [allLeaves, setAllLeaves] = useState<StudentLeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/student-leaves/pending");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setPendingLeaves(data);
      else setPendingLeaves([]);
    } catch {
      setPendingLeaves([]);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/student-leaves/all");
      const data = await res.json();
      //console.log("All Leaves:", data);
      if (res.ok && Array.isArray(data)) setAllLeaves(data);
      else setAllLeaves([]);
    } catch (err) {
      setAllLeaves([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPending(), fetchAll()]).finally(() => setLoading(false));
  }, [fetchPending, fetchAll]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/student-leaves/${id}/approve`, { method: "PATCH" });
      if (res.ok) {
        await fetchPending();
        await fetchAll();
      }
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/student-leaves/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchPending();
        await fetchAll();
      }
    } finally {
      setActionId(null);
    }
  };

  const displayList = subTab === "pending" ? pendingLeaves : allLeaves;
  const filteredList = searchQuery.trim()

    ? displayList.filter((l) =>
      (l.student?.user?.name ?? "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
    )
    : displayList;

  const approvedRecent = allLeaves.filter((l) => l.status === "APPROVED").length;

  return (
    <div className="text-white  md:px-0">
      {/* Header Section */}
      <PageHeader
        title="Student Approvals"
        subtitle="Review and manage leave requests from your class"
        rightSlot={
          <div className="flex flex-wrap items-center gap-3">
            {/* Pending Status Pill */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Clock size={16} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xs md:text-sm">
                {pendingLeaves.length} Pending
              </span>
            </div>

            {/* Approved Status Pill */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-[#b4f03d]/10 border border-[#b4f03d]/20">
              <CheckCircle2 size={16} className="text-[#b4f03d]" />
              <span className="text-[#b4f03d] font-bold text-xs md:text-sm">
                {approvedRecent} Approved
              </span>
            </div>
          </div>
        }
      />
        {loading && (
              <div className="flex justify-center items-center min-h-[300px]">
                <Spinner />
              </div>
            )}

      {/* Sub-Nav & Search Bar */}
      <div className="max-w-6xl mb-6 bg-white/[0.03] border border-white/10 rounded-[1rem] p-4 md:p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full md:w-auto">
            <button
              onClick={() => setSubTab("pending")}
              className={`flex-1 md:flex-none px-4 md:px-8 py-2 rounded-xl text-sm transition-all duration-300 ${subTab === "pending" ? "bg-[#b4f03d] text-black" : "text-white/40 hover:text-white"
                }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSubTab("history")}
              className={`flex-1 md:flex-none px-4 md:px-8 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${subTab === "history" ? "bg-[#b4f03d] text-black" : "text-white/40 hover:text-white"
                }`}
            >
              History
            </button>
          </div>
          <div className="relative group w-full md:w-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#b4f03d] transition-colors"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student name..."
              className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-6 w-full md:w-80 focus:outline-none focus:border-[#b4f03d]/50 transition-all placeholder:text-white/20"
            />
          </div>
        </div>
      </div>

      {/* Request Cards */}
      {loading ? (
        <div className="max-w-6xl mx-auto flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-[#b4f03d]/30 border-t-[#b4f03d] rounded-full animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="max-w-6xl mx-auto border border-white/10 rounded-[1rem] p-8 text-center text-white/50">
          {subTab === "pending" ? "No pending student leave requests." : "No leave history."}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-4">
          {filteredList.map((leave) => {
            const name = leave.student?.user?.name ?? "Student";
            const classLabel = leave.student?.class
              ? `${leave.student.class.name}${leave.student.class.section ? `-${leave.student.class.section}` : ""}`
              : "—";
            const avatarUrl = leave.student?.user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=56&background=4ade80&color=fff`;

            return (
              <div
                key={leave.id}
                className="border border-white/10 rounded-[1.2rem] p-4 md:p-6 backdrop-blur-lg flex flex-col md:flex-row items-start gap-4 md:gap-6 relative group hover:border-white/20 transition-all shadow-2xl bg-white/[0.02]"
              >
                {/* Profile Section */}
                <div className="flex flex-row items-start gap-4 min-w-full md:min-w-[160px]">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[1rem] md:text-[1.1rem] text-white tracking-tight">{name}</h3>
                    <p className="text-white/40 text-xs font-medium mt-0.5">Class {classLabel}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold tracking-widest text-white/40 uppercase w-fit">
                      {leaveTypeShort(leave.leaveType)}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col gap-3 w-full">
                  <div className="flex items-center">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-xl border border-white/5">
                      <Calendar size={14} className="text-[#b4f03d]" />
                      <span className="text-[10px] md:text-xs font-medium text-white/80">
                        {formatDateRange(leave.fromDate, leave.toDate)}
                      </span>
                      <span className="text-white/10 mx-1">|</span>
                      <span className="text-[10px] md:text-xs font-bold text-white">
                        {daysBetween(leave.fromDate, leave.toDate)} Days
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl px-4 py-3 border border-white/[0.03] min-h-[20px] flex flex-col justify-center">
                    <p className="text-white/70 text-[0.85rem] md:text-[0.9rem] leading-relaxed font-normal">
                      {leave.reason}
                    </p>
                    {/*{leave.attachment && (
                      <button className="flex items-center gap-1.5 mt-2 text-[#b4f03d] text-xs font-semibold hover:underline w-fit">
                        <Paperclip size={12} /> View Attachment
                      </button>
                    )}*/}
                  </div>
                </div>

                {/* Action Section */}
                {subTab === "pending" && leave.status === "PENDING" && (
                  <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto justify-stretch md:justify-center items-center md:border-l border-white/5 md:pl-6 self-stretch">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      disabled={actionId !== null}
                      className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 bg-white/[0.03] hover:bg-[#b4f03d] hover:text-black border border-white/10 text-[#b4f03d] px-4 md:px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 md:min-w-[120px] group/btn disabled:opacity-50"
                    >
                      <Check size={16} strokeWidth={3} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      disabled={actionId !== null}
                      className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 bg-white/[0.03] hover:bg-red-500/80 hover:text-white border border-white/10 text-red-400 px-4 md:px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 md:min-w-[120px] group/btn disabled:opacity-50"
                    >
                      <X size={18} strokeWidth={3} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {subTab === "history" && leave.status !== "PENDING" && (
                  <div className="flex items-center md:border-l border-white/5 md:pl-6 self-stretch">
                    <span
                      className={`px-4 py-2 rounded-lg text-xs font-bold border ${leave.status === "APPROVED"
                          ? "bg-[#b4f03d]/10 text-[#b4f03d] border-[#b4f03d]/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}