"use client";

import { useState, useEffect } from "react";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface TimetableEntry {
  id?: string;
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

export default function TimetableManagement(){

  const [classes,setClasses] = useState<Class[]>([]);
  const [selectedClass,setSelectedClass] = useState("");
  const [timetables,setTimetables] = useState<TimetableEntry[]>([]);
  const [saving,setSaving] = useState(false);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

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
    setLoading(true);

    const res = await fetch(`/api/timetable/list?classId=${selectedClass}`);
    const data = await res.json();

    if(data.timetables){
      setTimetables(data.timetables);
    }

    setLoading(false);
  };

  const getEntry = (day:string,period:number)=>{
    return timetables.find(t=>t.day===day && t.period===period);
  };

  const updateEntry = (day:string,period:number,entry:TimetableEntry)=>{

    setTimetables(prev => {

      const existingIndex = prev.findIndex(
        t => t.day === day && t.period === period
      );

      if(existingIndex !== -1){
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      }

      return [...prev, entry];
    });

  };

  const deleteEntry = (day:string,period:number)=>{
    setTimetables(prev =>
      prev.filter(t => !(t.day === day && t.period === period))
    );
  };

  const saveAll = async () => {

    if (!selectedClass) return;

    setSaving(true);
    setMessage("");

    try {

      const requests = timetables.map(entry =>
        fetch("/api/timetable/create",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({
            classId:selectedClass,
            day:entry.day,
            period:entry.period,
            type:entry.type,
            subject:entry.subject || null,
            teacherName:entry.teacherName || null,
            startTime:entry.startTime || null,
            endTime:entry.endTime || null
          })
        })
      );

      await Promise.all(requests);

      setMessage("Timetable saved successfully!");
      fetchTimetable();

    } catch(err){
      console.error(err);
      setMessage("Error saving timetable");
    }

    setSaving(false);
  };

  return(

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Timetable Management
      </h1>

      {message && (
        <div className="mb-4 p-2 bg-gray-100 border rounded">
          {message}
        </div>
      )}

      <div className="mb-6">

        <label className="block mb-2 font-medium">
          Select Class
        </label>

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="border p-2 rounded"
        >

          <option value="">Select Class</option>

          {classes.map(c=>(
            <option key={c.id} value={c.id}>
              {c.name} {c.section ? `- ${c.section}`:""}
            </option>
          ))}

        </select>

      </div>

      {loading && <p>Loading timetable...</p>}

      {selectedClass && !loading && (

        <>

        <div className="overflow-x-auto">

          <table className="border w-full">

            <thead>

              <tr>
                <th className="border p-2">Day / Period</th>

                {PERIODS.map(p=>(
                  <th key={p} className="border p-2">
                    Period {p}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody>

              {DAYS.map(day=>(

                <tr key={day}>

                  <td className="border p-2 font-semibold">
                    {day}
                  </td>

                  {PERIODS.map(period=>{

                    const entry = getEntry(day,period);

                    return(

                      <td key={period} className="border p-2">

                        <TimetableCell
                          entry={entry}
                          day={day}
                          period={period}
                          onSave={(data)=>updateEntry(day,period,data)}
                          onDelete={()=>deleteEntry(day,period)}
                        />

                      </td>

                    )

                  })}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <button
          onClick={saveAll}
          disabled={saving}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
        >
          {saving ? "Saving..." : "Save Timetable"}
        </button>

        </>

      )}

    </div>

  );

}

function TimetableCell({
  entry,
  day,
  period,
  onSave,
  onDelete
}:{
  entry?:TimetableEntry
  day:string
  period:number
  onSave:(entry:TimetableEntry)=>void
  onDelete:()=>void
}){

  const [editing,setEditing] = useState(false);

  const [type,setType] = useState(entry?.type || "SUBJECT");
  const [subject,setSubject] = useState(entry?.subject || "");
  const [teacher,setTeacher] = useState(entry?.teacherName || "");
  const [startTime,setStartTime] = useState(entry?.startTime || "");
  const [endTime,setEndTime] = useState(entry?.endTime || "");

  const save = ()=>{

    const data = {
      day,
      period,
      type:type as "SUBJECT" | "BREAK" | "LUNCH",
      subject,
      teacherName:teacher,
      startTime,
      endTime
    };

    onSave(data);
    setEditing(false);
  };

  if(!entry && !editing){

    return(
      <button
        onClick={()=>setEditing(true)}
        className="text-blue-600"
      >
        Add
      </button>
    )

  }

  if(editing){

    return(

      <div className="flex flex-col gap-2">

        <select
          value={type}
          onChange={(e)=>setType(e.target.value as any)}
          className="border p-1"
        >
          <option value="SUBJECT">Subject</option>
          <option value="BREAK">Break</option>
          <option value="LUNCH">Lunch</option>
        </select>

        {type==="SUBJECT" && (
          <>
          <input
            placeholder="Subject"
            value={subject}
            onChange={(e)=>setSubject(e.target.value)}
            className="border p-1"
          />

          <input
            placeholder="Teacher"
            value={teacher}
            onChange={(e)=>setTeacher(e.target.value)}
            className="border p-1"
          />
          </>
        )}

        <input
          type="time"
          value={startTime}
          onChange={(e)=>setStartTime(e.target.value)}
          className="border p-1"
        />

        <input
          type="time"
          value={endTime}
          onChange={(e)=>setEndTime(e.target.value)}
          className="border p-1"
        />

        <div className="flex gap-2">

          <button
            onClick={save}
            className="bg-green-600 text-white text-sm px-2 py-1"
          >
            Save
          </button>

          <button
            onClick={()=>setEditing(false)}
            className="bg-gray-500 text-white text-sm px-2 py-1"
          >
            Cancel
          </button>

        </div>

      </div>

    )

  }

  return(

    <div className="text-sm">

      <div className="font-semibold">
        {entry?.type}
      </div>

      {entry?.subject && <div>{entry.subject}</div>}
      {entry?.teacherName && <div>{entry.teacherName}</div>}

      {(entry?.startTime || entry?.endTime) && (
        <div className="text-xs text-gray-500">
          {entry.startTime} - {entry.endTime}
        </div>
      )}

      <div className="flex gap-2 mt-1">

        <button
          onClick={()=>setEditing(true)}
          className="text-blue-600 text-xs"
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          className="text-red-600 text-xs"
        >
          Delete
        </button>

      </div>

    </div>

  )

}