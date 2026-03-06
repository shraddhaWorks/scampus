"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../common/PageHeader";
import { formatAmount as fmtAmount } from "../../utils/format";
import Spinner from "../common/Spinner";
import SearchInput from "../common/SearchInput";
import TableLayout from "../common/TableLayout";
import { Column } from "../../types/superadmin";
import { useDebounce } from "@/app/frontend/hooks/useDebounce";
import { AVATAR_URL } from "../../constants/images";

export interface SchoolRow {
  slNo: number;
  id: string;
  name: string;
  address: string;
  location: string;
  studentCount: number;
  teacherCount: number;
  classCount: number;
  turnover: number;
  admin: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    photoUrl?: string | null;
  } | null;
}

export default function Schools() {
  const PAGE_SIZE = 10;
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);

  const fetchSchools = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const res = await fetch(`/api/superadmin/schools?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load schools");
      setSchools(data.schools ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading schools");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchSchools(debouncedSearch);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(schools.length / PAGE_SIZE));
  const paginatedSchools = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return schools.slice(start, start + PAGE_SIZE);
  }, [page, schools]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const columns = useMemo<Column<SchoolRow>[]>(
    () => [
      {
        header: "#",
        align: "center",
        render: (s) => String(s.slNo).padStart(2, "0"),
      },
      {
        header: "School Name",
        render: (s) => {
          const fallback = AVATAR_URL;
          const avatar = s.admin?.photoUrl?.trim() ? s.admin.photoUrl : fallback;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={avatar}
                alt={`${s.name} profile`}
                className="w-9 h-9 rounded-full object-cover border border-white/20 flex-shrink-0"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = fallback;
                }}
              />
              <span className="text-white font-medium truncate">{s.name}</span>
            </div>
          );
        },
      },
      {
        header: "Admin Name",
        align: "center",
        render: (s) => s.admin?.name ?? "-",
      },
      {
        header: "Contact",
        align: "center",
        render: (s) => s.admin?.mobile ?? "-",
      },
      {
        header: "Email",
        align: "center",
        render: (s) => (
          <span className="truncate inline-block max-w-[180px]">
            {s.admin?.email ?? "-"}
          </span>
        ),
      },
      {
        header: "Students",
        align: "center",
        render: (s) => s.studentCount.toLocaleString(),
      },
      {
        header: "Turnover",
        align: "center",
        render: (s) => (
          <span className="text-lime-300 font-medium">
            {fmtAmount(s.turnover, true)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <main className="flex-1 overflow-y-auto flex flex-col items-center">
      <div className="w-full min-h-screen space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
        <PageHeader
          title="Schools"
          subtitle="Manage schools, admins, students, and turnover"
          rightSlot={
            <div className="w-full max-w-sm">
              <SearchInput
                value={search}
                onChange={setSearch}
                icon={Search}
                iconPosition="right"
                placeholder="Search school, admin, email"
                variant="glass"
              />
            </div>
          }
        />

        {error && <div className="text-red-400 text-sm py-2">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <TableLayout
            columns={columns}
            data={paginatedSchools}
            emptyText="No schools found"
            rowKey={(row) => row.id}
            pagination={{
              page,
              totalPages,
              onChange: setPage,
            }}
          />
        )}
      </div>
    </main>
  );
}
