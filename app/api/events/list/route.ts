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
    const teacherId = searchParams.get("teacherId");
    const scope = searchParams.get("scope"); // "teacher" = only events created/assigned to current teacher

    let schoolId = session.user.schoolId;
    if (!schoolId && session.user.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: session.user.studentId },
        select: { schoolId: true },
      });
      schoolId = student?.schoolId ?? null;
    }
    if (!schoolId) {
      const adminSchool = await prisma.school.findFirst({
        where: { admins: { some: { id: session.user.id } } },
        select: { id: true },
      });
      schoolId = adminSchool?.id ?? null;
      if (!schoolId && session.user.role === "TEACHER") {
        const teacherSchool = await prisma.school.findFirst({
          where: { teachers: { some: { id: session.user.id } } },
          select: { id: true },
        });
        schoolId = teacherSchool?.id ?? null;
      }
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

    // Show all workshops for everyone (teachers, admins, parents, students)
    // Optional filters: classId, teacherId, scope=teacher
    if (scope === "teacher" && session.user.role === "TEACHER") {
      where.teacherId = session.user.id;
    } else if (teacherId) {
      where.teacherId = teacherId;
    }
    if (classId) {
      where.classId = classId;
    }
    const events = await prisma.event.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, section: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // For students, also include registration status and workshop certificate
    if (session.user.studentId) {
      const workshopCerts = await prisma.certificate.findMany({
        where: {
          studentId: session.user.studentId!,
          title: { endsWith: " - Participation" },
        },
        select: { title: true },
      });
      const eventTitlesWithCert = new Set(
        workshopCerts.map((c) => c.title.replace(/ - Participation$/, ""))
      );

      const eventsWithRegistration = await Promise.all(
        events.map(async (event) => {
          const registration = await prisma.eventRegistration.findUnique({
            where: {
              eventId_studentId: {
                eventId: event.id,
                studentId: session.user.studentId!,
              },
            },
          });

          return {
            ...event,
            isRegistered: !!registration,
            registrationStatus: registration?.paymentStatus || null,
            hasCertificate: eventTitlesWithCert.has(event.title),
          };
        })
      );

      return NextResponse.json({ events: eventsWithRegistration }, { status: 200 });
    }

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error("List events error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
