"use client";

import { Shield } from "lucide-react";
import clsx from "clsx";

export type AddUserRole = "SCHOOLADMIN" | "PRINCIPAL" | "HOD" | "TEACHER" | "STUDENT";

interface RoleSelectorProps {
  value: AddUserRole;
  onChange: (role: AddUserRole) => void;
  /** Roles the current user is allowed to create (from backend/session) */
  allowedRoles: AddUserRole[];
}

const ALL_ROLES: { value: AddUserRole; label: string }[] = [
  { value: "PRINCIPAL", label: "Principal" },
  { value: "HOD", label: "HOD" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
  { value: "SCHOOLADMIN", label: "School Admin" },
];

export default function RoleSelector({
  value,
  onChange,
  allowedRoles,
}: RoleSelectorProps) {
  const rolesToShow = allowedRoles.length > 0
    ? ALL_ROLES.filter((r) => allowedRoles.includes(r.value))
    : [{ value: "TEACHER" as AddUserRole, label: "Teacher" }];

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-white mb-3">
        User Role
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {rolesToShow.map((role) => {
          const isActive = value === role.value;

          return (
            <label
              key={role.value}
              className={clsx(
                "py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all bg-black/20 border-white/10 text-gray-400 hover:border-white/30",
                isActive
                  ? "border-lime-400 text-lime-400 shadow-lg shadow-lime-400/10"
                  : "border-white/10 text-white/70 bg-white/5 hover:bg-white/10"
              )}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={isActive}
                onChange={() => onChange(role.value)}
                className="hidden"
              />

              <Shield
                size={16}
                className={clsx(
                  "transition-colors",
                  isActive ? "text-lime-400" : "text-white/40"
                )}
              />

              {role.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
