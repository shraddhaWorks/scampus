"use client";

import { useState } from "react";
import CreatingTimeTable from "./table/creatingTimeTable";
import ViewTimeTable from "./table/viewTimeTable";

export default function TimeTablePage(){

  const [tab,setTab] = useState<"create" | "view">("create");

  return(

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Time Table
      </h1>

      <div className="flex gap-4 mb-6">

        <button
          onClick={()=>setTab("create")}
          className={`px-4 py-2 rounded ${
            tab==="create" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Create Timetable
        </button>

        <button
          onClick={()=>setTab("view")}
          className={`px-4 py-2 rounded ${
            tab==="view" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          View Timetable
        </button>

      </div>

      {tab === "create" && <CreatingTimeTable />}

      {tab === "view" && <ViewTimeTable />}

    </div>

  );

}