import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: [0, -10, 0, -5, 0], transition: { duration: 0.55, ease: "easeOut" } }}
      className="bg-white rounded-lg border border-gray-300 shadow-md p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-orange-100 text-orange-400">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
