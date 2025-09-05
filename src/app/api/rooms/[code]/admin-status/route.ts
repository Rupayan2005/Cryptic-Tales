import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room } from "../../../../../../types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;
  const userId = cookieStore.get("userId")?.value;
  const username = cookieStore.get("username")?.value;

  if (!playerId || !userId || !username) {
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

  const userPlayer = room.players.find((p) => p.name === username);
  const isAdmin = userPlayer ? room.adminId === userPlayer.id : false;
  const isInRoom = !!userPlayer;

  return Response.json({
    isAdmin,
    isInRoom,
    playerId: userPlayer?.id,
    playerName: username,
    adminId: room.adminId,
  });
}
