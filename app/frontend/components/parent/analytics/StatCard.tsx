import React from "react";
import { motion } from "framer-motion";

const glass = "bg-white/5 backdrop-blur-xl border border-gray-500/30 shadow-md";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tag: string;
}

export default function StatCard({ icon, label, value, sub, tag }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: [0, -10, 0, -5, 0], transition: { duration: 0.55, ease: "easeOut" } }}
      className={`${glass} rounded-2xl p-5`}
    >
      <div className="flex justify-between mb-3">
        <div className="rounded-lg border border-orange-200/80 bg-orange-100/80 p-2 text-orange-400">
          {icon}
        </div>
        <span className="text-xs text-lime-400 bg-lime-400/10 px-2 py-1 rounded">
          {tag}
        </span>
      </div>
      <div className="text-white/60 text-xs">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/40">{sub}</div>
    </motion.div>
  );
}
