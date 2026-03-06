import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import prisma from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { FEATURE_IDS } from "../../../../lib/features";

/** Who can create which role: schooladmin add-user -> Teacher only; principal -> hods, teachers; hods -> teachers; teacher -> students */
const ALLOWED_CREATOR_ROLES: Record<string, string[]> = {
  SCHOOLADMIN: ["TEACHER"],
  SUPERADMIN: ["PRINCIPAL", "HOD", "TEACHER", "STUDENT"],
  PRINCIPAL: ["HOD", "TEACHER"],
  HOD: ["TEACHER"],
  TEACHER: ["STUDENT"],
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    const requesterRole = (session.user.role as string).toUpperCase();
    const allowedRoles = ALLOWED_CREATOR_ROLES[requesterRole];
    if (!allowedRoles || allowedRoles.length === 0) {
      return NextResponse.json(
        { message: "You do not have permission to create users" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      role,
      designation,
      username,
      password,
      allowedFeatures,
      // Teacher-specific
      teacherId,
      subjects,
      assignedClassIds,
      qualification,
      experience,
      joiningDate,
      teacherStatus,
      mobile,
      address,
      department,
    } = body;

    // Validation
    if (!name || !email || !role || !username || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const requestedRole = (role as string).toUpperCase();
    if (!allowedRoles.includes(requestedRole)) {
      return NextResponse.json(
        { message: `You can only create: ${allowedRoles.join(", ")}` },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let finalAllowedFeatures: string[] = Array.isArray(allowedFeatures) ? allowedFeatures : [];

    const validFeatureIds = new Set(FEATURE_IDS as readonly string[]);

    // Validate allowedFeatures: only feature ids that exist in the app
    if (finalAllowedFeatures.length > 0) {
      finalAllowedFeatures = finalAllowedFeatures.filter((f: string) =>
        validFeatureIds.has(f)
      );
    }

    // If requester is TEACHER (creating STUDENT), they cannot assign features; STUDENT has no allowedFeatures
    if (requesterRole === "TEACHER") {
      finalAllowedFeatures = [];
    } else if (["PRINCIPAL", "HOD"].includes(requesterRole)) {
      finalAllowedFeatures = finalAllowedFeatures.filter((f: string) =>
        validFeatureIds.has(f)
      );
    }

    const schoolId = session.user.schoolId as string;
    const finalRole = requestedRole;

    // Parse joining date (dd-mm-yyyy or ISO)
    let joiningDateParsed: Date | undefined;
    if (joiningDate && typeof joiningDate === "string") {
      const ddmmyyyy = joiningDate.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyy) {
        const [, d, m, y] = ddmmyyyy;
        joiningDateParsed = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      } else {
        joiningDateParsed = new Date(joiningDate);
      }
      if (isNaN(joiningDateParsed.getTime())) joiningDateParsed = undefined;
    }

    const teacherSubjects =
      Array.isArray(subjects) && subjects.every((s: unknown) => typeof s === "string")
        ? (subjects as string[]).filter(Boolean)
        : [];
    const classIds =
      Array.isArray(assignedClassIds) && assignedClassIds.every((c: unknown) => typeof c === "string")
        ? (assignedClassIds as string[])
        : [];

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
        ...(designation && { subject: designation }),
        allowedFeatures: finalAllowedFeatures,
        // Teacher fields (only applied when role is TEACHER)
        ...(finalRole === "TEACHER" && {
          teacherId: teacherId && String(teacherId).trim() ? String(teacherId).trim() : null,
          subject: teacherSubjects[0] || designation || null,
          subjects: teacherSubjects,
          qualification: qualification && String(qualification).trim() ? String(qualification).trim() : null,
          experience: experience && String(experience).trim() ? String(experience).trim() : null,
          joiningDate: joiningDateParsed || null,
          teacherStatus: teacherStatus && String(teacherStatus).trim() ? String(teacherStatus).trim() : "Active",
          mobile: mobile && String(mobile).trim() ? String(mobile).trim() : null,
          address: address && String(address).trim() ? String(address).trim() : null,
        }),
      },
    });

    const departmentVal = department && String(department).trim() ? String(department).trim() : null;
    if (departmentVal && (finalRole === "TEACHER" || finalRole === "HOD" || finalRole === "PRINCIPAL")) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { department: departmentVal } as Parameters<typeof prisma.user.update>[0]["data"],
        });
      } catch (_) {
        // Ignore if Prisma client does not yet have department (run npx prisma generate)
      }
    }

    // Assign teacher to classes (only for TEACHER role, and classes must belong to same school)
    if (finalRole === "TEACHER" && classIds.length > 0 && schoolId) {
      await prisma.class.updateMany({
        where: {
          id: { in: classIds },
          schoolId,
        },
        data: { teacherId: user.id },
      });
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
