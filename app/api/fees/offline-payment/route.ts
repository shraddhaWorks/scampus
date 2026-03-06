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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = session.user.role === "SCHOOLADMIN" || session.user.role === "SUPERADMIN";
  if (!isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const schoolId = await getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ message: "School not found" }, { status: 400 });
    }

    const body = await req.json();
    const { studentId, amount: rawAmount, paymentDate, paymentMode, refNo, transactionId, remarks } = body;

    const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
    if (!studentId || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: "studentId and amount (positive number) required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { fee: true },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found in your school" }, { status: 404 });
    }

    if (!student.fee) {
      return NextResponse.json({ message: "Fee record not found for this student" }, { status: 404 });
    }

    const fee = student.fee;
    const newAmountPaid = fee.amountPaid + amount;
    const newRemaining = Math.max(fee.finalFee - newAmountPaid, 0);

    const txId = transactionId || refNo || `OFF-${Date.now()}`;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentId,
          amount,
          gateway: "OFFLINE",
          status: "SUCCESS",
          transactionId: txId,
        },
      }),
      prisma.studentFee.update({
        where: { studentId },
        data: { amountPaid: newAmountPaid, remainingFee: newRemaining },
      }),
    ]);

    return NextResponse.json({ payment, message: "Payment recorded successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Offline payment error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
