import { Receipt } from "lucide-react";

type Props = {
  fee?: {
    totalFee: number;
    amountPaid: number;
    remainingFee: number;
  } | null;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
    transactionId: string | null;
  }>;
};

export const FeeTransactions = ({ fee, payments }: Props) => {
  const hasFee = fee && (fee.totalFee > 0 || fee.amountPaid > 0 || fee.remainingFee > 0);
  const activePayments = payments && payments.length > 0 ? payments : [];
  const totalPaid = hasFee ? fee!.amountPaid : 0;
  const total = hasFee ? fee!.amountPaid + fee!.remainingFee : 0;
  const hasAny = hasFee || activePayments.length > 0;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 sm:p-6 mt-6 overflow-hidden min-w-0 -mx-1 sm:mx-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-lime-400 flex-shrink-0" /> Fee Details & Transactions
        </h3>
        {hasFee && (
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">FEES PAID / TOTAL</p>
            <p className="text-xl sm:text-2xl font-bold text-white">
              ₹{totalPaid.toLocaleString("en-IN")} <span className="text-gray-500">/ ₹{total.toLocaleString("en-IN")}</span>
            </p>
          </div>
        )}
      </div>

      {!hasAny ? (
        <div className="py-8 text-center text-gray-500 text-sm">No fee records</div>
      ) : (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left min-w-[320px]">
          <thead>
            <tr className="text-[11px] text-gray-400 font-bold tracking-wider uppercase border-b border-white/5">
              <th className="pb-4 font-medium">DATE</th>
              <th className="pb-4 font-medium">DESCRIPTION</th>
              <th className="pb-4 font-medium">METHOD</th>
              <th className="pb-4 font-medium">STATUS</th>
              <th className="pb-4 font-medium text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {activePayments.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="py-4 sm:py-5 text-gray-400 whitespace-nowrap">
                  {new Date(p.createdAt).toISOString().slice(0, 10)}
                </td>
                <td className="py-4 sm:py-5 font-bold text-gray-100">Fee payment</td>
                <td className="py-4 sm:py-5 text-gray-400">{p.method || "-"}</td>
                <td className="py-4 sm:py-5">
                  <span className="bg-lime-400/20 text-lime-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    {p.status || "Paid"}
                  </span>
                </td>
                <td className="py-4 sm:py-5 text-right font-bold text-white whitespace-nowrap">₹{p.amount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};