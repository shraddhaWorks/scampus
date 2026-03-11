"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  FileImage,
  Loader2,
  Send,
  Upload,
  Users,
} from "lucide-react";
import SuccessPopup from "./SuccessPopup";
import { uploadImage, uploadBlob } from "@/app/frontend/utils/upload";
import {
  generateCertificateWithName,
  type ClickPosition,
  type NameTextStyle,
  DEFAULT_TEXT_STYLE,
} from "./certificateUtils";

interface HubStudent {
  id: string;
  name: string | null;
  email?: string | null;
  class?: string | null;
}

interface HubEvent {
  id: string;
  title: string;
  eventDate?: string | null;
  _count?: { registrations: number };
}

interface CreateHubProps {
  events: HubEvent[];
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreateHub({ events }: CreateHubProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [namePosition, setNamePosition] = useState<ClickPosition | null>(null);
  const [nameTextStyle, setNameTextStyle] = useState<NameTextStyle>(DEFAULT_TEXT_STYLE);
  const [students, setStudents] = useState<HubStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignProgress, setAssignProgress] = useState({ current: 0, total: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [popupStage, setPopupStage] = useState<"generating" | "done">(
    "generating"
  );
  const [error, setError] = useState<string | null>(null);
  const [previewImgSize, setPreviewImgSize] = useState<{ w: number; h: number } | null>(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  const fetchRegistrations = useCallback(async (eventId: string) => {
    setLoadingStudents(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load enrolled students");
      }
      const list = Array.isArray(data?.students) ? data.students : [];
      setStudents(list);
      setSelectedStudentIds(new Set(list.map((s: HubStudent) => s.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
      setStudents([]);
      setSelectedStudentIds(new Set());
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    } else {
      setStudents([]);
      setSelectedStudentIds(new Set());
    }
  }, [selectedEventId, fetchRegistrations]);

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload JPEG, PNG, or WebP image");
      return;
    }
    setError(null);
    setCertificateFile(file);
    setUploadingCert(true);
    setNamePosition(null);
    setPreviewImgSize(null);
    try {
      const url = await uploadImage(file, "certificates");
      setCertificateUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setCertificateFile(null);
      setCertificateUrl(null);
    } finally {
      setUploadingCert(false);
    }
    e.target.value = "";
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedStudentIds(new Set(students.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  const createTemplateAndAssign = async () => {
    if (!selectedEvent || !certificateUrl) {
      setError("Please select workshop and attach certificate.");
      return;
    }
    if (!namePosition) {
      setError("Please click on the certificate preview to set the name position.");
      return;
    }
    const toAssign = students.filter((s) => selectedStudentIds.has(s.id));
    if (toAssign.length === 0) {
      setError("Please select at least one student");
      return;
    }

    setError(null);
    setAssigning(true);

    try {
      const templateRes = await fetch("/api/certificates/workshop/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventTitle: selectedEvent.title,
          imageUrl: certificateUrl,
        }),
      });
      const templateData = await templateRes.json();
      if (!templateRes.ok) {
        throw new Error(templateData?.message || "Failed to create template");
      }
      const tid = templateData?.template?.id;
      if (!tid) throw new Error("No template ID returned");

      setAssignProgress({ current: 0, total: toAssign.length });
      let successCount = 0;

      for (let i = 0; i < toAssign.length; i++) {
        const student = toAssign[i];
        setAssignProgress({ current: i + 1, total: toAssign.length });
        try {
          const studentName = (student.name ?? "").trim() || "Participant";
          const blob = await generateCertificateWithName(
            certificateUrl,
            studentName,
            namePosition,
            nameTextStyle
          );
          const filename = `cert-${selectedEvent.title.replace(/\W/g, "-")}-${student.id}.png`;
          const certUrl = await uploadBlob(blob, filename, "certificates");

          const res = await fetch("/api/certificates/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              templateId: tid,
              studentId: student.id,
              title: `${selectedEvent.title} - Participation`,
              description: `Certificate of participation for ${selectedEvent.title}`,
              certificateUrl: certUrl,
              eventId: selectedEvent.id,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.message || "Assign failed");
          }
          successCount++;
        } catch (err) {
          console.error("Assign error for", student.name, err);
          setError(
            `Failed for ${student.name}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }

      setShowPopup(true);
      setPopupStage("done");
      setCertificateFile(null);
      setCertificateUrl(null);
      setNamePosition(null);
      setNameTextStyle(DEFAULT_TEXT_STYLE);
      setSelectedStudentIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setAssigning(false);
      setAssignProgress({ current: 0, total: 0 });
    }
  };

  useEffect(() => {
    if (!showPopup) return;
    if (popupStage === "done") return;
    const t = setTimeout(() => setPopupStage("done"), 1200);
    return () => clearTimeout(t);
  }, [showPopup, popupStage]);

  const selectedCount = selectedStudentIds.size;
  const canAssign =
    selectedEvent &&
    certificateUrl &&
    namePosition !== null &&
    selectedCount > 0 &&
    !assigning &&
    !uploadingCert &&
    students.length > 0;

  const handlePreviewClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!certificateUrl) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const xPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const yPercent = Math.max(0, Math.min(1, clickY / rect.height));
    setNamePosition({ xPercent, yPercent });
  };

  const handlePreviewImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setPreviewImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 lg:p-8 backdrop-blur-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-lime-400 shrink-0">
            <Award size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">
              Certificate Hub
            </h3>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5">
              Select a workshop, attach certificate, choose name position, then
              assign to enrolled students
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
        {/* Left: Workshop + Certificate */}
        <div className="xl:col-span-1 space-y-6">
          {/* 1. Select Workshop */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                1. Select Workshop
              </span>
              <span className="text-xs text-lime-300 border border-lime-400/30 bg-lime-400/10 px-2.5 py-1 rounded-full">
                {events.length} Events
              </span>
            </div>
            <div className="space-y-2 max-h-[200px] sm:max-h-[240px] overflow-y-auto no-scrollbar pr-1">
              {events.map((event) => {
                const isSelected = event.id === selectedEventId;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 text-left transition-colors ${
                      isSelected
                        ? "border-lime-400/70 bg-white/10"
                        : "border-white/10 bg-black/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${
                          isSelected
                            ? "bg-[#F54E02]"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {event.title?.[0] ?? "E"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium text-sm sm:text-base truncate ${
                            isSelected ? "text-white" : "text-white/50"
                          }`}
                        >
                          {event.title}
                        </div>
                        <div
                          className={`text-xs ${
                            isSelected ? "text-white/60" : "text-white/40"
                          }`}
                        >
                          {formatDate(event.eventDate) || "Date"} •{" "}
                          {event._count?.registrations ?? 0} enrolled
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-lime-300 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
              {events.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-white/50 text-center">
                  No events yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* 2. Attach Certificate */}
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              2. Attach Certificate
            </span>
            <label className="mt-3 block">
              <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-white/20 hover:border-lime-400/40 bg-black/20 p-4 sm:p-6 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCertUpload}
                  disabled={uploadingCert}
                />
                {uploadingCert ? (
                  <div className="flex flex-col items-center gap-2 text-white/60">
                    <Loader2 size={32} className="animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : certificateUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-lime-400 shrink-0">
                      <FileImage size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {certificateFile?.name || "Certificate attached"}
                      </div>
                      <div className="text-xs text-white/50">Click to replace</div>
                    </div>
                    <Check size={18} className="text-lime-400 shrink-0" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/50">
                    <Upload size={28} />
                    <span className="text-sm">Upload certificate image</span>
                    <span className="text-xs">JPEG, PNG or WebP</span>
                  </div>
                )}
              </div>
            </label>
            {!certificateUrl && (
              <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-black/20 h-[200px] sm:h-[220px] lg:h-[240px] flex items-center justify-center text-white/40 text-sm">
                Upload a certificate first
              </div>
            )}
          </div>

        </div>

        {/* Right: Name Position & Enrolled Students */}
        <div className="xl:col-span-2 space-y-6">
          {/* 3. Name Position & Text Style */}
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              3. Name Position & Style
            </span>
            <p className="mt-2 text-xs text-white/50 mb-3">
              Click on the certificate where the student name should appear
            </p>
            <div className="mt-3 grid grid-cols-1 xl:grid-cols-[0.75fr_1.25fr] gap-4 items-stretch">
              {certificateUrl ? (
                <div
                  className="relative rounded-xl overflow-hidden border-2 border-white/20 hover:border-lime-400/50 bg-black/30 transition-colors h-[220px] sm:h-[240px] lg:h-[260px] flex items-center justify-center"
                  style={
                    previewImgSize
                      ? { aspectRatio: `${previewImgSize.w} / ${previewImgSize.h}` }
                      : { aspectRatio: "3 / 2" }
                  }
                >
                  <img
                    src={certificateUrl}
                    alt="Certificate preview"
                    className="w-full h-full object-cover select-none cursor-crosshair"
                    draggable={false}
                    onClick={handlePreviewClick}
                    onLoad={handlePreviewImgLoad}
                  />
                  {namePosition && (
                    <div
                      className="absolute pointer-events-none w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lime-400 bg-lime-400/40"
                      style={{
                        left: `${namePosition.xPercent * 100}%`,
                        top: `${namePosition.yPercent * 100}%`,
                      }}
                    />
                  )}
                  {!namePosition && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                      <span className="text-sm text-white/70">Click on certificate to set name position</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 h-[220px] sm:h-[240px] lg:h-[260px] flex items-center justify-center text-white/50 text-sm px-4 text-center">
                  Attach a certificate in section 2 to set the name position.
                </div>
              )}

              {/* Text Style Options */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 h-full min-w-0">
                <span className="text-xs font-medium text-white/70">Text style</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs text-white/50 mb-1">Font family</label>
                    <select
                      value={nameTextStyle.fontFamily}
                      onChange={(e) =>
                        setNameTextStyle((s) => ({ ...s, fontFamily: e.target.value }))
                      }
                      className="w-full rounded-lg bg-black/30 border border-white/20 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-lime-400/50"
                    >
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs text-white/50 mb-1">Font size (px)</label>
                    <input
                      type="number"
                      min={12}
                      max={120}
                      value={nameTextStyle.fontSize}
                      onChange={(e) =>
                        setNameTextStyle((s) => ({
                          ...s,
                          fontSize: Math.max(12, Math.min(120, Number(e.target.value) || 32)),
                        }))
                      }
                      className="w-full rounded-lg bg-black/30 border border-white/20 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-lime-400/50"
                    />
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <label className="block text-xs text-white/50 mb-1">Font color</label>
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="color"
                        value={nameTextStyle.fontColor}
                        onChange={(e) =>
                          setNameTextStyle((s) => ({ ...s, fontColor: e.target.value }))
                        }
                        className="h-9 w-12 shrink-0 rounded cursor-pointer border border-white/20 bg-black/30"
                      />
                    <input
                      type="text"
                      value={nameTextStyle.fontColor}
                      onChange={(e) =>
                        setNameTextStyle((s) => ({ ...s, fontColor: e.target.value || "#1a1a1a" }))
                      }
                      className="min-w-0 flex-1 rounded-lg bg-black/30 border border-white/20 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-lime-400/50"
                      placeholder="#1a1a1a"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs text-white/50 mb-1">Font weight</label>
                  <select
                    value={nameTextStyle.fontWeight}
                    onChange={(e) =>
                      setNameTextStyle((s) => ({
                        ...s,
                        fontWeight: e.target.value as "normal" | "bold",
                      }))
                    }
                    className="w-full rounded-lg bg-black/30 border border-white/20 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-lime-400/50"
                  >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/50 mb-1">Text align</label>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() =>
                            setNameTextStyle((s) => ({ ...s, textAlign: align }))
                          }
                          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                            nameTextStyle.textAlign === align
                              ? "bg-[#F54E02]"
                              : "bg-black/30 border border-white/20 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/50 mb-1">Preview</label>
                    <div className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 min-h-[48px] flex items-center">
                      <span
                        className="block w-full"
                        style={{
                          fontFamily: nameTextStyle.fontFamily,
                          fontSize: Math.min(24, nameTextStyle.fontSize),
                          fontWeight: nameTextStyle.fontWeight,
                          color: nameTextStyle.fontColor,
                          textAlign: nameTextStyle.textAlign,
                        }}
                      >
                        Student Name
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              4. Select Students ({selectedCount} selected)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium text-lime-400 hover:text-lime-300"
              >
                Select All
              </button>
              <span className="text-white/30">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs font-medium text-white/60 hover:text-white/80"
              >
                Deselect All
              </button>
            </div>
          </div>

          {!selectedEvent && (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-white/20 bg-white/5 min-h-[220px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white/40 text-center px-4">
                <ChevronRight className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center" />
                <span className="text-sm">Select a workshop to see enrolled students</span>
              </div>
            </div>
          )}

          {selectedEvent && loadingStudents && (
            <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 min-h-[220px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white/60">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-sm">Loading students...</span>
              </div>
            </div>
          )}

          {selectedEvent && !loadingStudents && students.length === 0 && (
            <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 min-h-[220px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white/50 text-center px-4">
                <Users size={32} />
                <span className="text-sm">No students enrolled in this workshop yet</span>
              </div>
            </div>
          )}

          {selectedEvent && !loadingStudents && students.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 max-h-[280px] sm:max-h-[320px] overflow-y-auto no-scrollbar">
                <div className="divide-y divide-white/5">
                  {students.map((s) => {
                    const isSelected = selectedStudentIds.has(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-white/5" : "hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudent(s.id)}
                          className="rounded border-white/30 bg-black/30 text-lime-400 focus:ring-lime-400/50"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {s.name || "Unknown"}
                          </div>
                          {s.class && (
                            <div className="text-xs text-white/50 truncate">
                              {s.class}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {assigning && (
                  <span className="text-sm text-white/60">
                    Assigning {assignProgress.current} of {assignProgress.total}...
                  </span>
                )}
                <button
                  type="button"
                  onClick={createTemplateAndAssign}
                  disabled={!canAssign}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F54E02] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F54E02]/30 hover:bg-[#E63F00] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F54E02] w-full sm:w-auto"
                >
                  {assigning ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Assign to {selectedCount} Student{selectedCount !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SuccessPopup
        open={showPopup}
        title={
          popupStage === "done"
            ? "Certificates Assigned"
            : "Generating Certificates..."
        }
        description={
          popupStage === "done"
            ? `${selectedCount} certificate(s) issued successfully`
            : "Applying name overlay and uploading..."
        }
        onClose={() => setShowPopup(false)}
      />
    </section>
  );
}
