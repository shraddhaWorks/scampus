import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

type FeedRow = { id: string; likes: number };
type LikeRow = { id: string };

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: newsFeedId } = await params;
    const userId = session.user.id;

    let feed: FeedRow | null = null;
    let existingLike: LikeRow | null = null;

    try {
      feed = await prisma.newsFeed.findUnique({
        where: { id: newsFeedId },
        select: { id: true, likes: true },
      });
      if (feed) {
        const like = await prisma.newsFeedLike.findUnique({
          where: { userId_newsFeedId: { userId, newsFeedId } },
          select: { id: true },
        });
        existingLike = like;
      }
    } catch {
      const rows = await prisma.$queryRawUnsafe<FeedRow[]>(
        `SELECT id, likes FROM "NewsFeed" WHERE id = $1`,
        newsFeedId
      );
      feed = rows[0] ?? null;
      if (feed) {
        const likeRows = await prisma.$queryRawUnsafe<LikeRow[]>(
          `SELECT id FROM "NewsFeedLike" WHERE "userId" = $1 AND "newsFeedId" = $2`,
          userId,
          newsFeedId
        );
        existingLike = likeRows[0] ?? null;
      }
    }

    if (!feed) {
      return NextResponse.json({ message: "News feed not found" }, { status: 404 });
    }

    const likes = feed.likes ?? 0;

    if (existingLike) {
      try {
        await prisma.newsFeedLike.delete({ where: { id: existingLike.id } });
        await prisma.newsFeed.update({
          where: { id: newsFeedId },
          data: { likes: Math.max(0, likes - 1) },
        });
      } catch {
        await prisma.$executeRawUnsafe(
          `DELETE FROM "NewsFeedLike" WHERE id = $1`,
          existingLike.id
        );
        await prisma.$executeRawUnsafe(
          `UPDATE "NewsFeed" SET likes = GREATEST(0, likes - 1), "updatedAt" = NOW() WHERE id = $1`,
          newsFeedId
        );
      }
      return NextResponse.json({ liked: false, likes: Math.max(0, likes - 1) }, { status: 200 });
    }

    const { randomBytes } = await import("crypto");
    const likeId = `c${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;
    const now = new Date().toISOString();

    try {
      await prisma.newsFeedLike.create({
        data: { id: likeId, userId, newsFeedId },
      });
      await prisma.newsFeed.update({
        where: { id: newsFeedId },
        data: { likes: likes + 1 },
      });
    } catch {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "NewsFeedLike" (id, "userId", "newsFeedId", "createdAt") VALUES ($1, $2, $3, $4::timestamptz)`,
        likeId,
        userId,
        newsFeedId,
        now
      );
      await prisma.$executeRawUnsafe(
        `UPDATE "NewsFeed" SET likes = likes + 1, "updatedAt" = NOW() WHERE id = $1`,
        newsFeedId
      );
    }
    return NextResponse.json({ liked: true, likes: likes + 1 }, { status: 200 });
  } catch (e: unknown) {
    console.error("News feed like error:", e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
