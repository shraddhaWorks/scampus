import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }
    const where: any = {
      class: {
        schoolId: schoolId,
      },
    };

    // For students: only show their own attendance
    if (session.user.studentId) {
      where.studentId = session.user.studentId;
    } else {
      // For teachers/admins: can filter by student or class
      if (studentId) {
        where.studentId = studentId;
      }
      if (classId) {
        where.classId = classId;
      }
    }

    const toUtcDateOnly = (value: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split("-").map(Number);
        return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
      }
      const parsed = new Date(value);
      return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
    };

    if (date) {
      where.date = toUtcDateOnly(date);
    }

    if (startDate && endDate) {
      where.date = {
        gte: toUtcDateOnly(startDate),
        lte: toUtcDateOnly(endDate),
      };
    }
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: session.user.studentId ? undefined : {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        class: {
          select: { id: true, name: true, section: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { date: "desc" },
        { period: "asc" },
      ],
    });

    return NextResponse.json({ attendances }, { status: 200 });
  } catch (error: any) {
    console.error("View attendance error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
