import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import SelectInput from "../../../common/SelectInput";

type Props = {
  data?: Array<{ subject: string; score: number }>;
};

export const AcademicPerformance = ({ data = [] }: Props) => {
  const chartData = data.length > 0 ? data : [];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-4 sm:p-8 w-full max-w-3xl min-w-0 overflow-hidden">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-white text-2xl font-bold flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[#b4f44d]" /> 
          Academic Performance
        </h3>
        
        <div className="min-w-[140px]">
          <SelectInput
            value="Midterm"
            options={[{ label: "Midterm", value: "Midterm" }]}
            bgColor="black"
          />
        </div>
      </div>

      <div className="h-64 w-full min-h-[200px]">
        {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)" 
            />
            <XAxis 
              dataKey="subject" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9ca3af", fontSize: 14 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9ca3af", fontSize: 14 }} 
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Bar 
              dataKey="score" 
              fill="#b4f44d" 
              radius={[6, 6, 0, 0]} 
              barSize={45} 
            />
          </BarChart>
        </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">No academic data</div>
        )}
      </div>
    </div>
  );
};
