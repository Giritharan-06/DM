import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { db, users, accounts, userRoles, auditLogs } from "@zyroz/database";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorize, checkOrigin, limitMutation, ApiError } from "@/lib/server";
import { listRecords } from "@/lib/list-records";
export async function GET(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, "team");
    const query = req.nextUrl.searchParams;
    const page = Math.floor(
      Math.max(1, Math.min(10000, Number(query.get("page")) || 1)),
    );
    const limit = Math.floor(
      Math.max(1, Math.min(100, Number(query.get("limit")) || 25)),
    );
    return NextResponse.json(
      await listRecords("team", actor, query, page, limit),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, "team");
    checkOrigin(req);
    await limitMutation(actor);
    const value = z
      .object({
        name: z.string().trim().min(2).max(200),
        email: z.email().transform((v) => v.toLowerCase()),
        password: z.string().min(12).max(200),
        role: z.enum(["sales", "marketing", "finance"]),
      })
      .parse(await req.json());
    const password = await hashPassword(value.password);
    const id = crypto.randomUUID();
    await db().transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(users)
        .where(eq(users.email, value.email));
      if (existing)
        throw new ApiError(409, "An account with this email already exists.");
      await tx.insert(users).values({
        id,
        name: value.name,
        email: value.email,
        emailVerified: false,
      });
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: id,
        accountId: id,
        providerId: "credential",
        password,
      });
      await tx.insert(userRoles).values({ userId: id, role: value.role });
      await tx.insert(auditLogs).values({
        actorId: actor.id,
        action: "provision",
        entity: "user",
        entityId: id,
      });
    });
    return NextResponse.json(
      { id, name: value.name, email: value.email, role: value.role },
      { status: 201 },
    );
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : error instanceof z.ZodError
            ? "Check employee details. Passwords need at least 12 characters."
            : "Team operation unavailable.",
    },
    {
      status:
        error instanceof ApiError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 503,
    },
  );
}
