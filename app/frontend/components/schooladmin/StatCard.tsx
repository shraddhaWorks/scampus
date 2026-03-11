import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  iconClassName?: string;
  label: string;
  value: string | number;
}

export default function StatCard({ icon, iconClassName, label, value }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: [0, -10, 0, -5, 0], transition: { duration: 0.55, ease: "easeOut" } }}
      className="flex items-center gap-3 rounded-2xl border border-gray-500/30 bg-white/5 p-4 backdrop-blur shadow-md"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200/80 bg-orange-100/80 ${iconClassName ?? "text-orange-400"}`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-white/60">{label}</div>
        <div className="text-lg font-semibold text-white">{value}</div>
      </div>
    </motion.div>
  );
}
