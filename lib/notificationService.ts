import prisma from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message },
    });
  } catch (e) {
    console.error("Create notification error:", e);
  }
}

export async function createNotificationsForUserIds(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string
) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, message })),
    });
  } catch (e) {
    console.error("Create notifications error:", e);
  }
}

export async function getSchoolUserIds(schoolId: string): Promise<string[]> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      admins: { select: { id: true } },
      teachers: { select: { id: true } },
      students: { select: { userId: true } },
    },
  });
  if (!school) return [];
  const ids = new Set<string>();
  school.admins.forEach((u) => ids.add(u.id));
  school.teachers.forEach((u) => ids.add(u.id));
  school.students.forEach((s) => ids.add(s.userId));
  return Array.from(ids);
}
