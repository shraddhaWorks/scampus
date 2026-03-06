"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, Receipt } from "lucide-react";
import PayButton from "@/app/frontend/components/common/PayButton";

interface Installment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  paymentId?: string;
}

interface FeeData {
  fee: {
    id: string;
    totalFee: number;
    finalFee: number;
    amountPaid: number;
    remainingFee: number;
    installments: number;
    components: Array<{ name: string; amount: number }>;
    extraFees: Array<{ name: string; amount: number }>;
    payments: Array<{ id: string; amount: number; createdAt: string; transactionId?: string }>;
    installmentsList: Installment[];
  };
}

export default function ParentFeesTab() {
  const [data, setData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFee = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fees/mine");
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Failed to load fee details");
        return;
      }
      setData(json);
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFee();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (error || !data?.fee) {
    return (
      <div className="min-h-[40vh] p-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-amber-400">{error || "Fee details not configured. Contact your school."}</p>
        </div>
      </div>
    );
  }

  const fee = data.fee as FeeData["fee"] & { installmentsList?: Installment[] };
  const installments = fee.installmentsList || [];
  const nextInstallment = installments.find((i: Installment) => i.status === "PENDING");
  const perInstallment = fee.finalFee / Math.max(fee.installments || 1, 1);
  const payable = nextInstallment ? nextInstallment.amount : fee.remainingFee;

  return (
    <div className="min-h-[40vh] p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Fee Management</h2>
        <p className="text-sm text-gray-400">Track installment payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Fee</p>
          <p className="text-2xl font-bold">₹{fee.totalFee?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500">{fee.installments ?? 0} Installments</p>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-400">
            ₹{fee.amountPaid?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round((fee.amountPaid / (fee.finalFee || 1)) * 100)}% complete
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-400">
            ₹{fee.remainingFee?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500">
            {installments.filter((i: Installment) => i.status === "PENDING").length} installments left
          </p>
        </div>
      </div>

      {fee.remainingFee > 0 && nextInstallment && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Next Payment Due!</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-white">₹{payable?.toLocaleString()}</p>
              <p className="text-sm text-gray-400">
                Installment {nextInstallment.installmentNumber} • Due:{" "}
                {new Date(nextInstallment.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <PayButton
              amount={payable}
              onSuccess={fetchFee}
              returnPath="/frontend/pages/parent?tab=fees"
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Instant payment • 100% secure • Get instant receipt
          </p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Payment Installments</h3>
        <p className="text-sm text-gray-400 mb-4">
          {fee.installments ?? 0} installments of ₹{perInstallment?.toFixed(0)} each
        </p>
        <div className="space-y-3">
          {installments.map((inst: Installment) => (
            <div
              key={inst.installmentNumber}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="font-medium">Installment {inst.installmentNumber}</p>
                <p className="text-sm text-gray-400">
                  Due: {new Date(inst.dueDate).toLocaleDateString("en-IN")}
                </p>
                <p className="text-lg font-semibold">₹{inst.amount?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {inst.status === "PAID" ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
                      <CheckCircle size={16} /> Paid
                    </span>
                    <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-white/20 text-sm hover:bg-white/5">
                      <Receipt size={16} /> Receipt
                    </button>
                  </>
                ) : (
                  <PayButton
                    amount={inst.amount}
                    onSuccess={fetchFee}
                    returnPath="/frontend/pages/parent?tab=fees"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {fee.components && fee.components.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Fee Breakdown</h3>
          <div className="space-y-2">
            {fee.components.map((c: { name: string; amount: number }, i: number) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b border-white/5"
              >
                <span className="text-gray-400">{c.name}</span>
                <span>₹{c.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
