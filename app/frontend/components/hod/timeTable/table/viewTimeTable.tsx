"use client";

import { useEffect, useState } from "react";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface TimetableEntry {
  day: string;
  period: number;
  type: "SUBJECT" | "BREAK" | "LUNCH";
  subject?: string | null;
  teacherName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const PERIODS = [1,2,3,4,5,6,7,8];

export default function ViewTimeTable(){

  const [classes,setClasses] = useState<Class[]>([]);
  const [selectedClass,setSelectedClass] = useState("");
  const [timetable,setTimetable] = useState<TimetableEntry[]>([]);

  useEffect(()=>{
    fetchClasses();
  },[]);

  useEffect(()=>{
    if(selectedClass){
      fetchTimetable();
    }
  },[selectedClass]);

  const fetchClasses = async ()=>{
    const res = await fetch("/api/class/list");
    const data = await res.json();

    if(data.classes){
      setClasses(data.classes);
    }
  };

 const fetchTimetable = async ()=>{

  const res = await fetch(`/api/timetable/list?classId=${selectedClass}`, { credentials: "include" });
  const data = await res.json();

  console.log("API Response:", data);          // shows full response
  console.log("Timetable Data:", data.timetables); // shows timetable array

  if(data.timetables){
    setTimetable(data.timetables);
  }

};

 const getEntry = (day:string,period:number)=>{
  return timetable.find(
    t => t.day?.toUpperCase() === day && Number(t.period) === period
  );
};

  const getTypeColor = (type:string)=>{
    switch(type){
      case "SUBJECT":
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
      case "BREAK":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case "LUNCH":
        return "bg-green-500/20 border-green-500/30 text-green-400";
      default:
        return "bg-[#2d2d2d] border-[#404040] text-[#808080]";
    }
  };

  return(

    <div className="min-h-screen  p-6">

      <div className="max-w-7xl mx-auto">

        <h2 className="text-2xl font-bold text-white mb-6">
          View Timetable
        </h2>

        {/* Class Select */}

        <div className="mb-6">

          <label className="block text-sm text-[#808080] mb-2">
            Select Class
          </label>

          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="w-full md:w-72 bg-[#2d2d2d] border border-[#404040] text-white rounded-lg px-4 py-2"
          >

            <option value="">Select Class</option>

            {classes.map(c=>(
              <option key={c.id} value={c.id}>
                {c.name} {c.section ? `- ${c.section}`:""}
              </option>
            ))}

          </select>

        </div>

        {selectedClass && (

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>

                <tr className="bg-[#2d2d2d] border-b border-[#404040]">

                  <th className="border border-[#404040] p-3 text-left text-white">
                    Day / Period
                  </th>

                  {PERIODS.map(p=>(
                    <th
                      key={p}
                      className="border border-[#404040] p-3 text-center text-white"
                    >
                      Period {p}
                    </th>
                  ))}

                </tr>

              </thead>

              <tbody>

                {DAYS.map(day=>(

                  <tr key={day} className="hover:bg-[#2d2d2d]/50">

                    <td className="border border-[#404040] p-3 font-semibold text-white bg-[#2d2d2d]/50">
                      {day}
                    </td>

                    {PERIODS.map(period=>{

                      const entry = getEntry(day,period);

                      return(

                        <td
                          key={period}
                          className="border border-[#404040] p-2"
                        >

                          {!entry && (
                            <div className="text-center text-[#6b6b6b]">
                              -
                            </div>
                          )}

                          {entry && (

                            <div className={`p-3 rounded-lg border text-sm ${getTypeColor(entry.type)}`}>

                              <div className="font-semibold mb-1">
                                {entry.type}
                              </div>

                              {entry.type==="SUBJECT" && (
                                <>
                                  <div className="text-white">
                                    {entry.subject}
                                  </div>

                                  <div className="text-xs text-[#808080]">
                                    {entry.teacherName}
                                  </div>
                                </>
                              )}

                              {(entry.startTime || entry.endTime) && (
                                <div className="text-xs mt-2 text-[#808080]">
                                  {entry.startTime} - {entry.endTime}
                                </div>
                              )}

                            </div>

                          )}

                        </td>

                      )

                    })}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

}