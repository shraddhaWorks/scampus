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

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    const { name, email, password, mobile, allowedFeatures, department } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const features =
      Array.isArray(allowedFeatures) && allowedFeatures.every((f: unknown) => typeof f === "string")
        ? allowedFeatures
        : [];

    const departmentVal = department && String(department).trim() ? String(department).trim() : null;
    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.TEACHER,
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
        mobile: mobile || null,
        allowedFeatures: features,
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
      { message: "Teacher created successfully", teacher },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create teacher error:", error);

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
