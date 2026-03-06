import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { FEATURE_IDS } from "@/lib/features";
import { redis } from "@/lib/redis";

/** PUT: Update the school's principal (only one per school). Principal keeps same features as school admin. */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const schoolId = session.user.schoolId as string | null;
    const requesterRole = session.user.role as string;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    if (requesterRole !== "SCHOOLADMIN" && requesterRole !== "SUPERADMIN") {
      return NextResponse.json(
        { message: "Only school admin can update the principal" },
        { status: 403 }
      );
    }

    const principal = await prisma.user.findFirst({
      where: { schoolId, role: Role.PRINCIPAL },
    });

    if (!principal) {
      return NextResponse.json(
        { message: "Principal not found. Create one first." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, mobile, password, department } = body;

    const data: { name?: string; email?: string; mobile?: string | null; password?: string; department?: string | null; allowedFeatures: string[] } = {
      allowedFeatures: [...FEATURE_IDS],
    };

    if (name != null && String(name).trim()) data.name = String(name).trim();
    if (email != null && String(email).trim()) data.email = String(email).trim();
    if (mobile !== undefined) data.mobile = mobile ? String(mobile).trim() : null;
    if (password != null && String(password).length > 0) {
      data.password = await bcrypt.hash(String(password), 10);
    }
    if (department !== undefined) data.department = department && String(department).trim() ? String(department).trim() : null;

    const updated = await prisma.user.update({
      where: { id: principal.id },
      data: data as Parameters<typeof prisma.user.update>[0]["data"],
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        allowedFeatures: true,
      },
    });

    await redis.del(`principal:${schoolId}`);

    return NextResponse.json(
      { message: "Principal updated successfully", principal: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Principal update error:", error);
    if (error?.code === "P2002" && error?.meta?.target?.includes("email")) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
