"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Shield, Loader, CheckCircle, AlertCircle, Briefcase } from "lucide-react";
import InputField from "@/app/frontend/components/schooladmin/schooladmincomponents/InputField";

export default function AddHod() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hod/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          mobile: mobile.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create HOD");
      setSuccess(true);
      setName("");
      setEmail("");
      setMobile("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create HOD");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-cyan-400/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Add HOD</h2>
            <p className="text-xs text-white/50">Create a Head of Department account for your school.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <InputField label="Full Name" value={name} onChange={setName} placeholder="HOD full name" icon={<User className="w-4 h-4" />} required />
          <InputField label="Email" value={email} onChange={setEmail} placeholder="hod@school.com" icon={<Mail className="w-4 h-4" />} required />
          <InputField label="Mobile" value={mobile} onChange={setMobile} placeholder="+91..." icon={<Phone className="w-5 h-5" />} />
          <InputField label="Department" value={department} onChange={setDepartment} placeholder="e.g. Mathematics, Science" icon={<Briefcase className="w-4 h-4" />} />
          <InputField label="Password" value={password} onChange={setPassword} type="password" placeholder="Min 6 characters" icon={<Lock className="w-4 h-4" />} required />
          <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm password" icon={<Lock className="w-4 h-4" />} required />

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-lime-400/20 border border-lime-400/30">
              <CheckCircle size={18} className="text-lime-400 flex-shrink-0" />
              <span className="text-sm text-lime-300">HOD created successfully.</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ x: 4 }}
            className="px-6 py-3 bg-[#F54E02] hover:bg-[#E63F00] text-white font-bold rounded-xl shadow-lg shadow-[#F54E02]/20 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                Create HOD
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
