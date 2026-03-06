"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  CheckCircle,
  Receipt,
  AlertCircle,
  IndianRupee,
  Shield,
} from "lucide-react";
import PageHeader from "../../common/PageHeader";
import PayButton from "@/app/frontend/components/common/PayButton";

interface InstallmentItem {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  paymentId?: string;
}

interface PaymentItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  transactionId?: string;
  gateway?: string;
}

interface RefundItem {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface ExtraFeeItem {
  id: string;
  name: string;
  amount: number;
}

interface FeeData {
  id: string;
  totalFee: number;
  discountPercent: number;
  finalFee: number;
  amountPaid: number;
  remainingFee: number;
  installments: number;
  components?: Array<{ name: string; amount: number }>;
  extraFees?: ExtraFeeItem[];
  payments: PaymentItem[];
  refunds?: RefundItem[];
  installmentsList: InstallmentItem[];
}

export default function ParentFeesTab() {
  const searchParams = useSearchParams();
  const [fee, setFee] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<1 | 3>(1);
  const [selectedComponents, setSelectedComponents] = useState<Set<number>>(new Set());
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());
  const [customAmount, setCustomAmount] = useState<string>("");
  const verifiedRef = useRef(false);

  const fetchFee = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/fees/mine");
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load fee details");
        setFee(null);
        return;
      }
      setFee(data.fee);
    } catch {
      setError("Something went wrong");
      setFee(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle HyperPG return: verify from URL params or cookie (return_url has no query params)
  useEffect(() => {
    if (verifiedRef.current) return;
    const success = searchParams.get("success");
    const amount = searchParams.get("amount");
    const orderId = searchParams.get("order_id");
    let orderIdToVerify = orderId;
    let amountToVerify = amount ? parseFloat(amount) : NaN;
    if ((success !== "1" || !orderIdToVerify || !amount) && typeof document !== "undefined") {
      const match = document.cookie.match(/hyperpg_pending=([^;]+)/);
      if (match) {
        try {
          const [oid, amt] = decodeURIComponent(match[1]).split("|");
          if (oid && amt) {
            orderIdToVerify = oid;
            amountToVerify = parseFloat(amt);
            document.cookie = "hyperpg_pending=; path=/; max-age=0";
          }
        } catch (_) {}
        }
      }
    if (orderIdToVerify && !isNaN(amountToVerify) && amountToVerify > 0) {
      verifiedRef.current = true;
      fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "HYPERPG",
          order_id: orderIdToVerify,
          amount: amountToVerify,
        }),
      })
        .then(async (res) => {
          const d = await res.json();
          if (!res.ok) alert(d.message || "Payment verification failed");
          else {
            fetchFee();
            window.location.href = `/frontend/pages/payment-success?order_id=${encodeURIComponent(orderIdToVerify)}`;
          }
        })
        .catch(console.error);
    }
  }, [searchParams, fetchFee]);

  useEffect(() => {
    fetchFee();
  }, [fetchFee]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
        <PageHeader title="Fees" subtitle="View and pay your child's school fees" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading fee details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
        <PageHeader title="Fees" subtitle="View and pay your child's school fees" />
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="w-16 h-16 text-amber-400" />
          <p className="text-white font-medium">
            {error || "Fee details not configured. Please contact the school admin."}
          </p>
        </div>
      </div>
    );
  }

  const remainingAmount = fee.remainingFee;

  // Selected fees amount (when user picks specific items)
  const selectedAmount = (() => {
    let sum = 0;
    fee.components?.forEach((c, i) => {
      if (selectedComponents.has(i)) sum += c.amount || 0;
    });
    fee.extraFees?.forEach((ef) => {
      if (selectedExtraIds.has(ef.id)) sum += ef.amount || 0;
    });
    return sum;
  })();
  const useSelectedFees = selectedAmount > 0 && selectedAmount <= remainingAmount;
  const basePayable = useSelectedFees ? selectedAmount : remainingAmount;
  const suggestedPayable = plan === 1 ? basePayable : basePayable / plan;
  // Editable amount: use custom if valid, else suggested
  const customNum = customAmount.trim() === "" ? null : parseFloat(customAmount);
  const payable = customNum != null && !isNaN(customNum) && customNum > 0 && customNum <= remainingAmount
    ? Math.min(customNum, remainingAmount)
    : suggestedPayable;
  const progress = fee.finalFee > 0 ? Math.min((fee.amountPaid / fee.finalFee) * 100, 100) : 0;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 pb-6">
      <PageHeader
        title="Fees"
        subtitle="View and pay your child's school fees"
        compact
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-lime-400" />
            Fee Summary
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Fee</p>
              <p className="text-xl font-bold text-white mt-1">₹{fee.totalFee.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Discount</p>
              <p className="text-xl font-bold text-lime-400 mt-1">{fee.discountPercent}%</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Payable</p>
              <p className="text-xl font-bold text-white mt-1">₹{fee.finalFee.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Paid</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹{fee.amountPaid.toLocaleString()}</p>
            </div>
          </div>

          {/* Fee Breakdown - select specific fees to pay */}
          {((fee.components && fee.components.length > 0) || (fee.extraFees && fee.extraFees.length > 0)) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Fee Breakdown</h4>
              <p className="text-xs text-gray-400">Select the fees you want to pay (or pay full remaining)</p>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {fee.components?.map((c, i) => (
                    <label
                      key={`base-${i}`}
                      className="flex justify-between items-center px-4 py-3 bg-white/5 cursor-pointer hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedComponents.has(i)}
                          onChange={(e) => {
                            setSelectedComponents((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(i);
                              else next.delete(i);
                              return next;
                            });
                          }}
                          className="rounded border-white/30 w-4 h-4 accent-lime-500"
                        />
                        <span className="text-sm text-gray-300 truncate">{c.name || `Component ${i + 1}`}</span>
                      </div>
                      <span className="text-sm font-medium text-white shrink-0 ml-2">₹{(c.amount || 0).toLocaleString()}</span>
                    </label>
                  ))}
                  {fee.extraFees?.map((ef) => (
                    <label
                      key={ef.id}
                      className="flex justify-between items-center px-4 py-3 bg-white/5 cursor-pointer hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedExtraIds.has(ef.id)}
                          onChange={(e) => {
                            setSelectedExtraIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(ef.id);
                              else next.delete(ef.id);
                              return next;
                            });
                          }}
                          className="rounded border-white/30 w-4 h-4 accent-lime-500"
                        />
                        <span className="text-sm text-gray-300 truncate">{ef.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white shrink-0 ml-2">₹{(ef.amount || 0).toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Payment progress</span>
              <span className="text-white font-medium">
                ₹{fee.amountPaid.toFixed(0)} / ₹{fee.finalFee.toFixed(0)}
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full"
              />
            </div>
          </div>

          {/* Pay Section */}
          {remainingAmount <= 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">All fees paid</p>
                <p className="text-sm text-gray-400">Thank you for your payment!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {([1, 3] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={`px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition min-h-[44px] touch-manipulation ${
                      plan === p
                        ? "bg-lime-500 text-black"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {p === 1 ? "Pay full" : `${p} installments`}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount to pay (₹)</label>
                  <input
                    type="number"
                    min={1}
                    max={remainingAmount}
                    step={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Max: ₹${remainingAmount.toLocaleString()}`}
                    className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-lg font-semibold text-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter amount as per your budget (max ₹{remainingAmount.toLocaleString()})
                  </p>
                </div>
                <div className="w-full">
                  <PayButton
                    amount={payable}
                    onSuccess={() => {
                      fetchFee();
                      setCustomAmount("");
                    }}
                    returnPath="/frontend/pages/parent?tab=fees"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Secure payment via HyperPG • Instant receipt
              </p>
            </div>
          )}
        </motion.div>

        {/* Installments & History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-lime-400" />
            Installments
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {fee.installmentsList?.map((inst) => (
              <div
                key={inst.installmentNumber}
                className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white">Installment {inst.installmentNumber}</p>
                  <p className="text-xs text-gray-500">
                    Due: {new Date(inst.dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">₹{inst.amount.toFixed(0)}</p>
                  <span
                    className={`text-xs ${
                      inst.status === "PAID" ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-white flex items-center gap-2 pt-4 border-t border-white/10">
            <CreditCard className="w-5 h-5 text-lime-400" />
            Payment & Refund history
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {(() => {
              const payments = fee.payments || [];
              const refunds = fee.refunds || [];
              const transactions = [
                ...payments.map((p) => ({ type: "payment" as const, ...p })),
                ...refunds.map((r) => ({ type: "refund" as const, ...r })),
              ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              if (transactions.length === 0) {
                return <p className="text-sm text-gray-500 py-4">No payments or refunds yet</p>;
              }
              return transactions.map((t) =>
                t.type === "payment" ? (
                  <div
                    key={`pay-${t.id}`}
                    className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-emerald-400">
                        +₹{t.amount.toLocaleString()} (Payment)
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        t.status === "SUCCESS"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ) : (
                  <div
                    key={`ref-${t.id}`}
                    className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-amber-500/20"
                  >
                    <div>
                      <p className="text-sm font-medium text-amber-400">
                        -₹{t.amount.toLocaleString()} (Refund)
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                      Refunded
                    </span>
                  </div>
                )
              );
            })()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
