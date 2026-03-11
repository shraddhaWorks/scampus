import { motion } from "framer-motion";

interface ButtonProps {
  title: string;
  loading?: boolean;
  onClick?:()=>void
}

export default function PrimaryButton({ title, loading,onClick }: ButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading}
      type="submit"
      className="bg-[#F54E02] text-white font-semibold
       rounded-xl hover:bg-[#E63F00] 
       shadow-lg shadow-[#F54E02]/20
       w-full py-3"
    >
      {loading ? "Logging in..." : title}
    </motion.button>
  );
}