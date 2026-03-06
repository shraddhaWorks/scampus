import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const schoolId = session.user.schoolId;
    const requesterRole = session.user.role as string;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    // Only SCHOOLADMIN or PRINCIPAL can create HODs
    if (requesterRole !== "SCHOOLADMIN" && requesterRole !== "SUPERADMIN" && requesterRole !== "PRINCIPAL") {
      return NextResponse.json(
        { message: "Only school admin or principal can create HOD accounts" },
        { status: 403 }
      );
    }

    const { name, email, password, mobile, department } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const departmentVal = department && String(department).trim() ? String(department).trim() : null;

    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.HOD,
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
        mobile: mobile || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
      },
    });

    if (departmentVal) {
      try {
        await prisma.user.update({
          where: { id: teacher.id },
          data: { department: departmentVal } as Parameters<typeof prisma.user.update>[0]["data"],
        });
      } catch (_) {
        // Ignore if Prisma client does not yet have department (run npx prisma generate)
      }
    }

    return NextResponse.json(
      { message: "HOD created successfully", teacher },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create HOD error:", error);
    if (error?.code === "P2002" && error?.meta?.target?.includes("email")) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
