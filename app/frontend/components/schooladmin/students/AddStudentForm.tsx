"use client";

import { Plus } from "lucide-react";
import InputField from "../schooladmincomponents/InputField";
import SelectInput from "../../common/SelectInput";
import { SelectOption, StudentFormErrors, StudentFormState } from "./types";

type Props = {
  form: StudentFormState;
  errors: StudentFormErrors;
  classOptions: SelectOption[];
  sectionOptions: SelectOption[];
  classesLoading?: boolean;
  ageLabel: string;
  saving: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onFieldChange: (key: keyof StudentFormState, value: string) => void;
  onCancel: () => void;
  onReset: () => void;
  onSave: () => void;
};

const renderError = (errors: StudentFormErrors, key: keyof StudentFormState) =>
  errors[key] ? (
    <p className="text-xs text-red-400 mt-1">{errors[key]}</p>
  ) : null;

export default function AddStudentForm({
  form,
  errors,
  classOptions,
  sectionOptions,
  classesLoading = false,
  ageLabel,
  saving,
  title = "Add New Student",
  subtitle = "Enter student details below",
  submitLabel = "Save Student",
  onFieldChange,
  onCancel,
  onReset,
  onSave,
}: Props) {
  return (
    <div className="bg-[#0F172A]/50 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-100 mb-4">{title}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <div>
          <InputField
            label="Full Name*"
            value={form.name}
            onChange={(value) => onFieldChange("name", value)}
            placeholder="Student Name"
            bgColor="white"
          />
          {renderError(errors, "name")}
        </div>
        <div>
          <InputField
            label="Student ID"
            value={form.rollNo}
            onChange={(value) => onFieldChange("rollNo", value)}
            placeholder="e.g. STU001"
            bgColor="white"
          />
        </div>
        <div>
          <InputField
            label="Aadhaar Number*"
            value={form.aadhaarNo}
            onChange={(value) => onFieldChange("aadhaarNo", value)}
            placeholder="12-digit Aadhaar"
            bgColor="white"
          />
          {renderError(errors, "aadhaarNo")}
        </div>
        <div>
          <SelectInput
            label="Gender"
            value={form.gender}
            onChange={(value) => onFieldChange("gender", value)}
            options={[
              { label: "Select Gender", value: "" },
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
              { label: "Other", value: "Other" },
            ]}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1.5">
            Age
          </label>
          <div className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-200">
            {ageLabel}
          </div>
        </div>
        <div>
          <InputField
            label="Date of Birth*"
            value={form.dob}
            onChange={(value) => onFieldChange("dob", value)}
            placeholder="dd-mm-yyyy"
            type="date"
            bgColor="white"
          />
          {renderError(errors, "dob")}
        </div>
        <div>
          <InputField
            label="Previous School Attended"
            value={form.previousSchool}
            onChange={(value) => onFieldChange("previousSchool", value)}
            placeholder="Previous School Name"
            bgColor="white"
          />
        </div>
        <div>
          <SelectInput
            label="Class"
            value={form.classId}
            onChange={(value) => onFieldChange("classId", value)}
            options={classOptions}
            disabled={classesLoading || classOptions.length <= 1}
          />
        </div>
        <div>
          <SelectInput
            label="Section"
            value={form.section}
            onChange={(value) => onFieldChange("section", value)}
            options={sectionOptions}
            disabled={classesLoading || sectionOptions.length <= 1}
          />
        </div>
        <div>
          <SelectInput
            label="Status"
            value={form.status}
            onChange={(value) => onFieldChange("status", value)}
            options={[
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>
        <div>
          <InputField
            label="Total Fee*"
            value={form.totalFee}
            onChange={(value) => onFieldChange("totalFee", value)}
            placeholder="e.g. 12000"
            type="number"
            bgColor="white"
          />
          {renderError(errors, "totalFee")}
        </div>
        <div>
          <InputField
            label="Discount (%)"
            value={form.discountPercent}
            onChange={(value) => onFieldChange("discountPercent", value)}
            placeholder="e.g. 10"
            type="number"
            bgColor="white"
          />
          {renderError(errors, "discountPercent")}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white/80 mb-3">
          Parent Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField
              label="Parent Name*"
              value={form.fatherName}
              onChange={(value) => onFieldChange("fatherName", value)}
              placeholder="Parent/Guardian Name"
              bgColor="white"
            />
            {renderError(errors, "fatherName")}
          </div>
          <div>
            <InputField
              label="Contact Number*"
              value={form.phoneNo}
              onChange={(value) => onFieldChange("phoneNo", value)}
              placeholder="10 digits"
              bgColor="white"
            />
            {renderError(errors, "phoneNo")}
          </div>
          {/* <div>
            <InputField
              label="Aadhaar Number*"
              value={form.aadhaarNo}
              onChange={(value) => onFieldChange("aadhaarNo", value.replace(/\D/g, "").slice(0, 12))}
              placeholder="12 digits"
              bgColor="white"
            />
            {renderError(errors, "aadhaarNo")}
          </div> */}
          <div className="md:col-span-2">
            <InputField
              label="Email"
              value={form.email}
              onChange={(value) => onFieldChange("email", value)}
              placeholder="parent@example.com"
              type="email"
              bgColor="white"
            />
            {renderError(errors, "email")}
          </div>
          <div className="md:col-span-2">
            <InputField
              label="Address"
              value={form.address}
              onChange={(value) => onFieldChange("address", value)}
              placeholder="Full address"
              bgColor="white"
            />
            {renderError(errors, "address")}
          </div>
        </div>
      </div>


      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-lime-400
           px-5 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          <Plus size={16} /> {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
