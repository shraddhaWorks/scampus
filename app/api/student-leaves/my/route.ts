import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 400 });

    const leaves = await prisma.studentLeaveRequest.findMany({
      where: { studentId: student.id },
      orderBy: { fromDate: "desc" },
    });

    return NextResponse.json(leaves, { status: 200 });
  } catch (e: unknown) {
    console.error("Student leaves my:", e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
