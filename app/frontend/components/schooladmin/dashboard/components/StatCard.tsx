import { LucideIcon } from 'lucide-react';
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  trendColor?: string;
  Icon: LucideIcon;
}

export const StatCard = ({ label, value, trend, trendColor = "text-lime-400", Icon }: StatCardProps) => (
  <motion.div
    whileHover={{ y: [0, -10, 0, -5, 0], transition: { duration: 0.55, ease: "easeOut" } }}
    className="bg-white/5 backdrop-blur-xl border-b border-gray-500/30 border rounded-2xl p-3 sm:p-4 md:p-5 flex-1 min-w-0 sm:min-w-[160px] md:min-w-[180px] lg:min-w-[220px] shadow-md"
  >
    <div className="p-2 sm:p-2.5 md:p-3 bg-orange-100/80 w-fit rounded-xl md:rounded-2xl mb-3 sm:mb-4 md:mb-6 border border-orange-200/80">
      <Icon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400" />
    </div>
    <p className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">{label}</p>
    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mt-0.5 sm:mt-1 mb-1 sm:mb-2 text-white truncate">{value}</h3>
    <p className={`${trendColor} text-[9px] sm:text-[10px] font-bold tracking-widest uppercase truncate`}>
      {trend}
    </p>
  </motion.div>
);
