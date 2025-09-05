import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room, RoomSettings } from "../../../../../../types"; ////  ../../../../../../types

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = (await req.json()) as Partial<RoomSettings>;

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const room = await roomsCol.findOne({ code });
  if (!room)
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
    });

  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;
  if (playerId !== room.adminId)
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });

  const newSettings: RoomSettings = { ...room.settings, ...body };
  await roomsCol.updateOne({ code }, { $set: { settings: newSettings } });

  const g = global as Record<string, unknown>;
  const io = g._io;
  if (io && typeof io === "object" && "to" in io) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).to(code).emit("settings:update", newSettings);
  }

  return Response.json({ ok: true });
}
