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
    const subject = searchParams.get("subject");

    let schoolId = session.user.schoolId;
    if (!schoolId) {
      const teacherClass = await prisma.class.findFirst({
        where: { teacherId: session.user.id },
        select: { schoolId: true },
      });
      schoolId = teacherClass?.schoolId ?? null;
    }
    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    const where: any = {
      schoolId: schoolId,
    };

    // Filter by class if provided
    if (classId) {
      where.classId = classId;
    }

    // For students: show homework for their class only
    if (session.user.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: session.user.studentId },
        select: { classId: true },
      });

      if (student && student.classId) {
        where.classId = student.classId;
      }
    }

    if (subject) {
      where.subject = subject;
    }

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            _count: { select: { students: true } },
          },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For students, also include submission status
    if (session.user.studentId) {
      const homeworksWithSubmission = await Promise.all(
        homeworks.map(async (homework) => {
          const submission = await prisma.homeworkSubmission.findUnique({
            where: {
              homeworkId_studentId: {
                homeworkId: homework.id,
                studentId: session.user.studentId!,
              },
            },
          });

          return {
            ...homework,
            hasSubmitted: !!submission,
            submission: submission || null,
          };
        })
      );

      return NextResponse.json({ homeworks: homeworksWithSubmission }, { status: 200 });
    }

    return NextResponse.json({ homeworks }, { status: 200 });
  } catch (error: any) {
    console.error("List homeworks error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
