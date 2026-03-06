"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Shield, Loader, CheckCircle, AlertCircle, Briefcase } from "lucide-react";
import InputField from "./schooladmincomponents/InputField";
import Spinner from "../common/Spinner";

type Principal = {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  role: string;
  allowedFeatures?: string[];
  department?: string | null;
};

export default function PrincipalCreate() {
  const [principal, setPrincipal] = useState<Principal | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchPrincipal = async () => {
    try {
      const res = await fetch("/api/principal/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setPrincipal(data.principal ?? null);
      if (data.principal) {
        setName(data.principal.name ?? "");
        setEmail(data.principal.email ?? "");
        setMobile(data.principal.mobile ?? "");
        setDepartment(data.principal.department ?? "");
      } else {
        setName("");
        setEmail("");
        setMobile("");
        setDepartment("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load principal");
      setPrincipal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipal();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/principal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, mobile: mobile.trim() || undefined, department: department.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Create failed");
      setSuccess(true);
      await fetchPrincipal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create principal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/principal/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim() || undefined,
          department: department.trim() || undefined,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      await fetchPrincipal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update principal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isUpdate = principal != null;

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isUpdate ? "Update Principal" : "Create Principal"}
            </h2>
            <p className="text-xs text-white/50">
              {isUpdate
                ? "Your school has one principal. Update their details below."
                : "Create the principal account for your school. Only one principal per school."}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-lime-400/10 border border-lime-400/20 p-4 mb-6">
          <p className="text-sm text-lime-200">
            <strong>Principal has the same features as School Admin</strong> — full access to dashboard, classes, students, teachers, fees, exams, workshops, certificates, and all other modules.
          </p>
        </div>

        <form onSubmit={isUpdate ? handleUpdate : handleCreate} className="space-y-4 max-w-xl">
          <InputField
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Principal full name"
            icon={<User className="w-4 h-4" />}
            required
          />
          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="principal@school.com"
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <InputField
            label="Mobile"
            value={mobile}
            onChange={setMobile}
            placeholder="+91..."
            icon={<Phone className="w-5 h-5" />}
          />
          <InputField
            label="Department"
            value={department}
            onChange={setDepartment}
            placeholder="e.g. Mathematics, Science"
            icon={<Briefcase className="w-4 h-4" />}
          />
          <InputField
            label={isUpdate ? "Password (leave blank to keep unchanged)" : "Password"}
            value={password}
            onChange={setPassword}
            type="password"
            placeholder={isUpdate ? "••••••••" : "Min 6 characters"}
            icon={<Lock className="w-4 h-4" />}
            required={!isUpdate}
          />
          {(password || !isUpdate) && (
            <InputField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              placeholder="Confirm password"
              icon={<Lock className="w-4 h-4" />}
              required={!isUpdate}
            />
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30"
            >
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-lime-400/20 border border-lime-400/30"
            >
              <CheckCircle size={18} className="text-lime-400 flex-shrink-0" />
              <span className="text-sm text-lime-300">
                {isUpdate ? "Principal updated successfully." : "Principal created successfully."}
              </span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ x: 4 }}
            className="px-6 py-3 bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl shadow-lg shadow-lime-400/20 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {isUpdate ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                {isUpdate ? "Update Principal" : "Create Principal"}
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
