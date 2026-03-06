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

    console.log("Student creation request received");

    let schoolId = session.user.schoolId;

    // Fallback: find school where the admin belongs
    if (!schoolId) {
      const adminSchool = await prisma.school.findFirst({
        where: { admins: { some: { id: session.user.id } } },
        select: { id: true },
      });
      schoolId = adminSchool?.id ?? null;

      if (schoolId) {
        // persist the school on the user for future requests
        await prisma.user.update({
          where: { id: session.user.id },
          data: { schoolId },
        });
      }
    }

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("Received student data:", {
      name: body.name,
      fatherName: body.fatherName,
      aadhaarNo: body.aadhaarNo ? "***" : undefined,
      phoneNo: body.phoneNo,
      email: body.email,
      dob: body.dob,
      classId: body.classId,
      totalFee: body.totalFee,
      discountPercent: body.discountPercent,
    });

    const {
      name,
      fatherName,
      aadhaarNo,
      phoneNo,
      email: emailInput,
      dob,
      classId: classIdInput,
      address: addressInput,
      totalFee: totalFeeInput,
      discountPercent: discountPercentInput,
      rollNo,
      gender: genderInput,
      previousSchool: previousSchoolInput,
    } = body;

    // Validate all required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      console.error("Validation failed: Student name is required", { name, type: typeof name });
      return NextResponse.json(
        { message: "Student name is required" },
        { status: 400 }
      );
    }
    if (!dob) {
      console.error("Validation failed: Date of birth is required", { dob, type: typeof dob });
      return NextResponse.json(
        { message: "Date of birth (dob) is required" },
        { status: 400 }
      );
    }
    if (!fatherName || typeof fatherName !== "string" || !fatherName.trim()) {
      console.error("Validation failed: Father's name is required", { fatherName, type: typeof fatherName });
      return NextResponse.json(
        { message: "Father's name is required" },
        { status: 400 }
      );
    }
    if (!aadhaarNo || typeof aadhaarNo !== "string" || !aadhaarNo.trim()) {
      console.error("Validation failed: Aadhaar number is required", { aadhaarNo: aadhaarNo ? "***" : undefined, type: typeof aadhaarNo });
      return NextResponse.json(
        { message: "Aadhaar number is required" },
        { status: 400 }
      );
    }
    if (!phoneNo || typeof phoneNo !== "string" || !phoneNo.trim()) {
      console.error("Validation failed: Phone number is required", { phoneNo, type: typeof phoneNo });
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize classId - convert empty string to null
    const classId = classIdInput && typeof classIdInput === "string" && classIdInput.trim() 
      ? classIdInput.trim() 
      : null;

    // Validate and parse totalFee
    let totalFee: number;
    if (typeof totalFeeInput === "number") {
      totalFee = totalFeeInput;
    } else if (typeof totalFeeInput === "string" && totalFeeInput.trim()) {
      totalFee = Number(totalFeeInput);
    } else if (totalFeeInput === null || totalFeeInput === undefined || totalFeeInput === "") {
      console.error("Validation failed: totalFee is required", { totalFeeInput, type: typeof totalFeeInput });
      return NextResponse.json(
        { message: "totalFee is required and must be a number" },
        { status: 400 }
      );
    } else {
      totalFee = Number(totalFeeInput);
    }
    if (Number.isNaN(totalFee) || totalFee <= 0) {
      console.error("Validation failed: totalFee must be a positive number", { totalFee, totalFeeInput });
      return NextResponse.json(
        { message: "totalFee must be a positive number" },
        { status: 400 }
      );
    }

    // Validate and parse discountPercent
    let safeDiscount: number;
    if (typeof discountPercentInput === "number") {
      safeDiscount = discountPercentInput;
    } else if (typeof discountPercentInput === "string" && discountPercentInput.trim()) {
      safeDiscount = Number(discountPercentInput);
    } else {
      safeDiscount = 0;
    }
    if (Number.isNaN(safeDiscount) || safeDiscount < 0 || safeDiscount > 100) {
      return NextResponse.json(
        { message: "discountPercent must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate DOB is a valid date
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      console.error("Validation failed: Invalid date of birth format");
      return NextResponse.json(
        { message: "Invalid date of birth format" },
        { status: 400 }
      );
    }

    // Validate classId if provided
    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, schoolId: true },
      });
      if (!classExists) {
        console.error("Validation failed: Class not found", classId);
        return NextResponse.json(
          { message: "Class not found" },
          { status: 400 }
        );
      }
      if (classExists.schoolId !== schoolId) {
        console.error("Validation failed: Class does not belong to school");
        return NextResponse.json(
          { message: "Class does not belong to your school" },
          { status: 400 }
        );
      }
    }

    const password = dobDate.toISOString().split("T")[0].replace(/-/g, "");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check for duplicate aadhaar number before transaction
    const aadhaarTrimmed = String(aadhaarNo).trim();
    // Remove any spaces or dashes from aadhaar number for validation
    const aadhaarCleaned = aadhaarTrimmed.replace(/[\s-]/g, "");
    if (aadhaarCleaned.length < 12) {
      console.error("Validation failed: Aadhaar number must be at least 12 digits", { length: aadhaarCleaned.length });
      return NextResponse.json(
        { message: "Aadhaar number must be at least 12 digits" },
        { status: 400 }
      );
    }
    const existingAadhaar = await prisma.student.findUnique({
      where: { aadhaarNo: aadhaarCleaned },
      select: { id: true },
    });
    if (existingAadhaar) {
      console.error("Validation failed: Aadhaar number already exists");
      return NextResponse.json(
        { message: "Aadhaar number already exists" },
        { status: 400 }
      );
    }

    const student = await prisma.$transaction(
      async (tx) => {
        const year = new Date().getFullYear();
        let settings = await tx.schoolSettings.findUnique({ where: { schoolId } });
        if (!settings) {
          settings = await tx.schoolSettings.create({
            data: { schoolId, admissionPrefix: "ADM", rollNoPrefix: "", admissionCounter: 0 },
          });
        }
        const nextNum = settings.admissionCounter + 1;
        const admissionNumber =
          `${settings.admissionPrefix}/${year}/${String(nextNum).padStart(3, "0")}`;
        
        // Check if admission number already exists (race condition protection)
        const existingAdmission = await tx.student.findUnique({
          where: { admissionNumber },
          select: { id: true },
        });
        if (existingAdmission) {
          throw new Error("Admission number conflict. Please try again.");
        }

        await tx.schoolSettings.update({
          where: { schoolId },
          data: { admissionCounter: nextNum },
        });

        const rollNoPrefix = settings.rollNoPrefix || "";
        const finalRollNo =
          typeof rollNo === "string" && rollNo.trim()
            ? rollNo.trim()
            : rollNoPrefix
              ? `${rollNoPrefix}${nextNum}`
              : String(nextNum);

        const emailTrimmed =
          typeof emailInput === "string" && emailInput.trim().length > 0
            ? emailInput.trim()
            : null;
        let userEmail =
          emailTrimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
            ? emailTrimmed
            : `${admissionNumber.replaceAll("/", "")}@${String(settings.admissionPrefix).toLowerCase()}.in`;

        // Check if email already exists and generate alternative if needed
        let existingUser = await tx.user.findUnique({
          where: { email: userEmail },
          select: { id: true },
        });
        if (existingUser) {
          // Generate alternative email if conflict
          let counter = 1;
          do {
            userEmail = `${admissionNumber.replaceAll("/", "")}_${counter}@${String(settings.admissionPrefix).toLowerCase()}.in`;
            existingUser = await tx.user.findUnique({
              where: { email: userEmail },
              select: { id: true },
            });
            counter++;
            if (counter > 1000) {
              throw new Error("Unable to generate unique email. Please try again.");
            }
          } while (existingUser);
        }

        const user = await tx.user.create({
          data: {
            name,
            email: userEmail,
            password: hashedPassword,
            role: Role.STUDENT,
            schoolId,
          },
        });

        const address =
          typeof addressInput === "string" && addressInput.trim()
            ? addressInput.trim()
            : null;
        const gender =
          typeof genderInput === "string" && genderInput.trim()
            ? genderInput.trim()
            : null;
        const previousSchool =
          typeof previousSchoolInput === "string" && previousSchoolInput.trim()
            ? previousSchoolInput.trim()
            : null;

        const studentRecord = await tx.student.create({
          data: {
            userId: user.id,
            schoolId,
            admissionNumber,
            classId: classId ?? null,
            dob: dobDate,
            address,
            gender,
            previousSchool,
            fatherName: String(fatherName).trim(),
            aadhaarNo: aadhaarCleaned,
            phoneNo: String(phoneNo).trim(),
            rollNo: finalRollNo,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            class: true,
          },
        });

        const finalFee = totalFee * (1 - safeDiscount / 100);
        await tx.studentFee.create({
          data: {
            studentId: studentRecord.id,
            totalFee,
            discountPercent: safeDiscount,
            finalFee,
            amountPaid: 0,
            remainingFee: finalFee,
            installments: 3,
          },
        });

        return studentRecord;
      },
      {
        maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
        timeout: 20000, // Maximum time the transaction can run (20 seconds)
      }
    );

    console.log("Student created successfully:", {
      id: student.id,
      name: student.user?.name,
      admissionNumber: student.admissionNumber,
      classId: student.classId,
      className: student.class ? `${student.class.name}${student.class.section ? ` • ${student.class.section}` : ""}` : "Not assigned",
    });

    return NextResponse.json(
      { message: "Student created under your school", student },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Student creation error:", error);
    
    const err = error as { code?: string; message?: string; meta?: { target?: string[] } };
    // Handle transaction timeout errors
    if (err?.code === "P1008" || err?.message?.includes("transaction") || err?.message?.includes("timeout")) {
      return NextResponse.json(
        { message: "Transaction timeout. Please try again." },
        { status: 408 }
      );
    }

    // Handle Prisma unique constraint violations
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      const field = Array.isArray(target) ? target[0] : undefined;
      if (field === "email") {
        return NextResponse.json(
          { message: "Email already exists. Please use a different email or leave it blank to auto-generate." },
          { status: 400 }
        );
      }
      if (field === "admissionNumber") {
        return NextResponse.json(
          { message: "Admission number conflict. Please try again." },
          { status: 400 }
        );
      }
      if (field === "aadhaarNo") {
        return NextResponse.json(
          { message: "Aadhaar number already exists. Please check the Aadhaar number." },
          { status: 400 }
        );
      }
      if (field === "userId") {
        return NextResponse.json(
          { message: "User already exists for this student." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { message: `Duplicate entry: ${field || "unknown field"}. Please check your input.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
