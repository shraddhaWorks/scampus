"use client";

import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import type { FeeSummary } from "./types";

interface FeeStatCardsProps {
  stats: FeeSummary | null;
}

const bounceHover = {
  y: [0, -10, 0, -5, 0],
  transition: { duration: 0.55, ease: "easeOut" as const },
};

export default function FeeStatCards({ stats }: FeeStatCardsProps) {
  const total = (stats?.totalCollected ?? 0) + (stats?.totalDue ?? 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <motion.div
        whileHover={bounceHover}
        className="rounded-xl border border-gray-500/30 bg-white/5 p-4 shadow-md backdrop-blur"
      >
        <div className="mb-1 flex items-center gap-2 text-gray-400">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200/80 bg-orange-100/80 text-orange-400">
            <DollarSign size={18} />
          </span>
          Total Fees (Net)
        </div>
        <div className="text-xl font-bold">Rs {total.toLocaleString("en-IN")}</div>
      </motion.div>

      <motion.div
        whileHover={bounceHover}
        className="rounded-xl border border-gray-500/30 bg-white/5 p-4 shadow-md backdrop-blur"
      >
        <div className="mb-1 flex items-center gap-2 text-gray-400">Collected</div>
        <div className="text-xl font-bold text-emerald-400">
          Rs {(stats?.totalCollected ?? 0).toLocaleString("en-IN")}
        </div>
      </motion.div>

      <motion.div
        whileHover={bounceHover}
        className="rounded-xl border border-gray-500/30 bg-white/5 p-4 shadow-md backdrop-blur"
      >
        <div className="mb-1 flex items-center gap-2 text-gray-400">Pending</div>
        <div className="text-xl font-bold text-amber-400">
          Rs {(stats?.totalDue ?? 0).toLocaleString("en-IN")}
        </div>
      </motion.div>

      <motion.div
        whileHover={bounceHover}
        className="rounded-xl border border-gray-500/30 bg-white/5 p-4 shadow-md backdrop-blur"
      >
        <div className="mb-1 flex items-center gap-2 text-gray-400">Critical</div>
        <div className="text-xl font-bold text-red-400">{stats?.pending ?? 0}</div>
      </motion.div>
    </div>
  );
}
