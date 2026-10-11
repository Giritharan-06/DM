import { NextRequest, NextResponse } from "next/server";
import { db, systemSettings, auditLogs } from "@zyroz/database";
import { eq } from "drizzle-orm";
import { agencyProfileSchema } from "@zyroz/validation";
import { authorize, checkOrigin, limitMutation, ApiError } from "@/lib/server";
import { z } from "zod";
async function handle(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, "settings");
    if (req.method === "GET") {
      const [row] = await db()
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "agency"));
      const profile = agencyProfileSchema.safeParse(row?.value);
      return NextResponse.json({
        profile: profile.success
          ? profile.data
          : agencyProfileSchema.parse({ name: "ZYROZ Agency" }),
        updatedAt: row?.updatedAt || null,
      });
    }
    checkOrigin(req);
    await limitMutation(actor);
    const raw = await req.text();
    if (raw.length > 6000) throw new ApiError(413, "Profile is too large.");
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "Invalid JSON.");
    }
    const value = agencyProfileSchema.parse(input);
    await db().transaction(async (tx) => {
      await tx
        .insert(systemSettings)
        .values({ key: "agency", value })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value, updatedAt: new Date() },
        });
      await tx
        .insert(auditLogs)
        .values({
          actorId: actor.id,
          action: "agency_profile_updated",
          entity: "settings",
          entityId: "agency",
        });
    });
    return NextResponse.json({ profile: value });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0]?.message
            : error instanceof ApiError
              ? error.message
              : "Agency settings unavailable.",
      },
      {
        status:
          error instanceof z.ZodError
            ? 400
            : error instanceof ApiError
              ? error.status
              : 503,
      },
    );
  }
}
export const GET = handle;
export const PATCH = handle;
