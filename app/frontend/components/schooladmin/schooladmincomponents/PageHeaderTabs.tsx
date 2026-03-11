"use client";

import { useRouter, useSearchParams } from "next/navigation";

type TabItem = {
  label: string;
  value: string;
};

interface PageTabsProps {
  tabs: TabItem[];
  queryKey?: string; // default = "tab"
}

export default function PageTabs({
  tabs,
  queryKey = "tab",
}: PageTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawActive = searchParams.get(queryKey) ?? tabs[0].value;
  const active =
    rawActive === "add-user"
      ? "add"
      : rawActive === "all-users"
      ? "all"
      : rawActive;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(queryKey, value);

    if (queryKey === "view" && value === "add") {
      params.delete("userId");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-max sm:w-full p-1 rounded-xl border border-white/10">
        {tabs.map((tab) => {
          const isActive = active === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => handleChange(tab.value)}
              className={`
                whitespace-nowrap
                px-4 sm:px-5
                py-2
                rounded-xl
                text-xs sm:text-sm
                font-medium
                transition-all
                ${
                  isActive
                    ? "bg-[#F54E02] text-white shadow-lg"
                    : "bg-white text-black shadow-md hover:shadow-lg"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
