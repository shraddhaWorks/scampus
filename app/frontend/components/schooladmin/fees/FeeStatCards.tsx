"use client";

import { DollarSign } from "lucide-react";
import type { FeeSummary } from "./types";

interface FeeStatCardsProps {
  stats: FeeSummary | null;
}

export default function FeeStatCards({ stats }: FeeStatCardsProps) {
  const total = (stats?.totalCollected ?? 0) + (stats?.totalDue ?? 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
          <DollarSign size={18} /> Total Fees (Net)
        </div>
        <div className="text-xl font-bold">₹{total.toLocaleString("en-IN")}</div>
      </div>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-400 mb-1">Collected</div>
        <div className="text-xl font-bold text-emerald-400">
          ₹{(stats?.totalCollected ?? 0).toLocaleString("en-IN")}
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-400 mb-1">Pending</div>
        <div className="text-xl font-bold text-amber-400">
          ₹{(stats?.totalDue ?? 0).toLocaleString("en-IN")}
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-400 mb-1">Critical</div>
        <div className="text-xl font-bold text-red-400">{stats?.pending ?? 0}</div>
      </div>
    </div>
  );
}
