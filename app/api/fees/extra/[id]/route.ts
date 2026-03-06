import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

async function getSchoolId(session: { user: { id: string; schoolId?: string | null } }) {
  let schoolId = session.user.schoolId;
  if (!schoolId) {
    const adminSchool = await prisma.school.findFirst({
      where: { admins: { some: { id: session.user.id } } },
      select: { id: true },
    });
    schoolId = adminSchool?.id ?? null;
  }
  return schoolId;
}

function getStudentWhere(
  targetType: string,
  targetClassId: string | null,
  targetSection: string | null,
  targetStudentId: string | null,
  schoolId: string
) {
  if (targetType === "SCHOOL") return { schoolId };
  if (targetType === "CLASS" && targetClassId)
    return { schoolId, classId: targetClassId };
  if (targetType === "SECTION" && targetClassId && targetSection)
    return {
      schoolId,
      classId: targetClassId,
      class: { section: targetSection },
    };
  if (targetType === "STUDENT" && targetStudentId)
    return { schoolId, id: targetStudentId };
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const isAdmin =
    session.user.role === "SCHOOLADMIN" || session.user.role === "SUPERADMIN";
  if (!isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const schoolId = await getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ message: "School not found" }, { status: 400 });
    }

    const { id } = await params;
    const extraFee = await prisma.extraFee.findFirst({
      where: { id, schoolId },
    });
    if (!extraFee) {
      return NextResponse.json(
        { message: "Extra fee not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, amount } = body;

    const updates: Record<string, string | number> = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (amount !== undefined && typeof amount === "number" && amount > 0)
      updates.amount = amount;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ extraFee });
    }

    const studentWhere = getStudentWhere(
      extraFee.targetType,
      extraFee.targetClassId,
      extraFee.targetSection,
      extraFee.targetStudentId,
      schoolId
    );

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.extraFee.update({
        where: { id },
        data: updates,
      });

      if (studentWhere && updates.amount !== undefined) {
        const delta = (updates.amount as number) - extraFee.amount;
        const students = await tx.student.findMany({
          where: studentWhere,
          select: { id: true },
        });
        for (const s of students) {
          const fee = await tx.studentFee.findUnique({
            where: { studentId: s.id },
          });
          if (fee) {
            const discount = (fee.discountPercent || 0) / 100;
            const finalDelta = Math.round(delta * (1 - discount) * 100) / 100;
            await tx.studentFee.update({
              where: { studentId: s.id },
              data: {
                totalFee: fee.totalFee + delta,
                finalFee: fee.finalFee + finalDelta,
                remainingFee: Math.max(0, fee.remainingFee + finalDelta),
              },
            });
          }
        }
      }

      return u;
    });

    return NextResponse.json({ extraFee: updated });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Extra fee PATCH error:", error);
    return NextResponse.json(
      { message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const isAdmin =
    session.user.role === "SCHOOLADMIN" || session.user.role === "SUPERADMIN";
  if (!isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const schoolId = await getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ message: "School not found" }, { status: 400 });
    }

    const { id } = await params;
    const extraFee = await prisma.extraFee.findFirst({
      where: { id, schoolId },
    });
    if (!extraFee) {
      return NextResponse.json(
        { message: "Extra fee not found" },
        { status: 404 }
      );
    }

    const studentWhere = getStudentWhere(
      extraFee.targetType,
      extraFee.targetClassId,
      extraFee.targetSection,
      extraFee.targetStudentId,
      schoolId
    );

    await prisma.$transaction(async (tx) => {
      if (studentWhere) {
        const students = await tx.student.findMany({
          where: studentWhere,
          select: { id: true },
        });
        for (const s of students) {
          const fee = await tx.studentFee.findUnique({
            where: { studentId: s.id },
          });
          if (fee) {
            const discount = (fee.discountPercent || 0) / 100;
            const finalDelta = Math.round(
              -extraFee.amount * (1 - discount) * 100
            ) / 100;
            await tx.studentFee.update({
              where: { studentId: s.id },
              data: {
                totalFee: fee.totalFee - extraFee.amount,
                finalFee: fee.finalFee + finalDelta,
                remainingFee: Math.max(0, fee.remainingFee + finalDelta),
              },
            });
          }
        }
      }
      await tx.extraFee.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Extra fee DELETE error:", error);
    return NextResponse.json(
      { message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
