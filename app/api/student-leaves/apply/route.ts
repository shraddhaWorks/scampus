import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import { LeaveType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "STUDENT" && !session.user.studentId) {
      return NextResponse.json({ message: "Only students can apply for leave" }, { status: 403 });
    }

    const studentId = session.user.studentId
      ? session.user.studentId
      : (
          await prisma.student.findFirst({
            where: { userId: session.user.id },
            select: { id: true },
          })
        )?.id;

    if (!studentId) return NextResponse.json({ message: "Student record not found" }, { status: 400 });

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { schoolId: true },
    });
    if (!student?.schoolId) return NextResponse.json({ message: "School not found" }, { status: 400 });

    const body = await req.json();
    const { leaveType, reason, fromDate, toDate } = body;
    if (!reason || !fromDate || !toDate) {
      return NextResponse.json(
        { message: "reason, fromDate, and toDate are required" },
        { status: 400 }
      );
    }

    const validTypes: LeaveType[] = ["CASUAL", "SICK", "PAID", "UNPAID"];
    const type = validTypes.includes(leaveType) ? leaveType : "CASUAL";

    const leave = await prisma.studentLeaveRequest.create({
      data: {
        studentId,
        schoolId: student.schoolId,
        leaveType: type,
        reason,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
      },
    });

    return NextResponse.json({ leave }, { status: 201 });
  } catch (e: unknown) {
    console.error("Student leave apply:", e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
