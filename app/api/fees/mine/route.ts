import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" || !session.user.studentId) {
    return NextResponse.json(
      { message: "Only students can view their fee details" },
      { status: 403 }
    );
  }

  try {
    const studentId = session.user.studentId;

    const fee = await prisma.studentFee.findUnique({
      where: { studentId },
      include: {
        student: {
          select: { classId: true, schoolId: true, class: { select: { id: true, name: true, section: true } } },
        },
        installmentsList: { orderBy: { installmentNumber: "asc" } },
      },
    });

    if (!fee) {
      return NextResponse.json(
        { message: "Fee details not found for this student" },
        { status: 404 }
      );
    }

    const classId = fee.student.classId;
    const components =
      classId
        ? await prisma.classFeeStructure.findUnique({
            where: { classId },
            select: { components: true },
          })
        : null;

    const extraFees = await prisma.extraFee.findMany({
      where: {
        schoolId: fee.student.schoolId,
        OR: [
          { targetType: "SCHOOL" },
          { targetType: "STUDENT", targetStudentId: studentId },
          ...(classId ? [{ targetType: "CLASS", targetClassId: classId }] : []),
          ...(classId && fee.student.class?.section
            ? [
                {
                  targetType: "SECTION",
                  targetClassId: classId,
                  targetSection: fee.student.class.section,
                },
              ]
            : []),
        ],
      },
    });

    const payments = await prisma.payment.findMany({
      where: { studentId, eventRegistrationId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const paymentIds = payments.map((p) => p.id);
    let refunds: { id: string; paymentId: string; amount: number; status: string; createdAt: Date }[] = [];
    if (paymentIds.length > 0) {
      const placeholders = paymentIds.map((_, i) => `$${i + 1}`).join(", ");
      refunds = (await prisma.$queryRawUnsafe(
        `SELECT id, "paymentId", amount, status, "createdAt" FROM "Refund" WHERE "paymentId" IN (${placeholders}) AND status = 'SUCCESS' ORDER BY "createdAt" DESC`,
        ...paymentIds
      )) as { id: string; paymentId: string; amount: number; status: string; createdAt: Date }[];
    }

    const perInstallment = fee.finalFee / Math.max(fee.installments, 1);
    const baseDue = new Date(new Date().getFullYear(), 6, 15); // Jul 15
    const installments =
      fee.installmentsList.length > 0
        ? fee.installmentsList.map((i) => ({
            installmentNumber: i.installmentNumber,
            dueDate: i.dueDate,
            amount: i.amount,
            paidAmount: i.paidAmount,
            status: i.status,
            paymentId: i.paymentId,
          }))
        : Array.from({ length: fee.installments }, (_, idx) => {
            const d = new Date(baseDue);
            d.setMonth(d.getMonth() + idx * 2);
            const amt = Math.round(perInstallment * 100) / 100;
            const cutoff = (idx + 1) * perInstallment;
            const status = fee.amountPaid >= cutoff ? "PAID" : "PENDING";
            const paidAmt = status === "PAID" ? amt : 0;
            return {
              installmentNumber: idx + 1,
              dueDate: d.toISOString().slice(0, 10),
              amount: amt,
              paidAmount: paidAmt,
              status,
            };
          });

    const payload = {
      fee: {
        ...fee,
        components: (components?.components as Array<{ name: string; amount: number }>) || [],
        extraFees,
        payments,
        refunds,
        installmentsList: installments,
      },
    };
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Fetch student fee error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

