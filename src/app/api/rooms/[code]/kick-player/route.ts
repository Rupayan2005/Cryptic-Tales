import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room } from "../../../../../../types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerIdToKick } = await req.json();

  if (!playerIdToKick) {
    return new Response(JSON.stringify({ error: "Player ID required" }), {
      status: 400,
    });
  }

  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;
  if (!playerId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const room = await roomsCol.findOne({ code });

  if (!room) {
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
    });
  }

  // Check if requester is admin
  if (room.adminId !== playerId) {
    return new Response(
      JSON.stringify({ error: "Only admin can kick players" }),
      { status: 403 }
    );
  }

  // Can't kick yourself
  if (playerIdToKick === playerId) {
    return new Response(JSON.stringify({ error: "Cannot kick yourself" }), {
      status: 400,
    });
  }

  // Remove player from room
  const updatedPlayers = room.players.filter((p) => p.id !== playerIdToKick);
  await roomsCol.updateOne({ code }, { $set: { players: updatedPlayers } });

  // Notify via socket
  const g = global as Record<string, unknown>;
  const io = g._io;
  if (io && typeof io === "object" && "to" in io) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).to(code).emit("player:kicked", { playerId: playerIdToKick });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).to(code).emit("player:activity", {
      type: "kick",
      playerId: playerIdToKick,
    });
  }

  return Response.json({ success: true });
}
