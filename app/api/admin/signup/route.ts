import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

const VALID_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.SCHOOLADMIN,
  Role.TEACHER,
  Role.STUDENT,
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role: roleInput } = body;

    if (!name || !email || !password || !roleInput) {
      return NextResponse.json(
        { message: "Missing parameters: name, email, password and role are required" },
        { status: 400 }
      );
    }

    const role = VALID_ROLES.includes(roleInput) ? roleInput : Role.SCHOOLADMIN;

    // Check existing user (explicit select to avoid any missing column in legacy DBs)
    const existing = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        role,
        allowedFeatures: [],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string };
    console.error("Signup error:", err);

    if (err?.code === "P2002") {
      const field = err?.meta?.target?.[0] || "email";
      return NextResponse.json(
        { message: `${field} already exists` },
        { status: 400 }
      );
    }
    if (err?.code === "P2022") {
      return NextResponse.json(
        {
          message:
            "Database schema is out of sync. Run: npx prisma db push",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: err?.message || "Internal server error in signup route",
      },
      { status: 500 }
    );
  }
}
