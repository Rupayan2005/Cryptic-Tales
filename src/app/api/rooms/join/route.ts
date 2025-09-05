import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/ids";
import type { Player, Room } from "../../../../../types";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code)
    return new Response(JSON.stringify({ error: "Room code required" }), {
      status: 400,
    });

  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const username = cookieStore.get("username")?.value;

  if (!userId || !username) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), {
      status: 401,
    });
  }

  const playerName = username;

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const playersCol = db.collection<Player>("players");

  const room = await roomsCol.findOne({ code });
  if (!room)
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
    });

  const existingPlayer = room.players.find((p) => p.name === playerName);
  if (existingPlayer) {
    // User is already in room, just set their playerId cookie and return
    cookieStore.set("playerId", existingPlayer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return Response.json({
      code,
      playerId: existingPlayer.id,
      isAdmin: existingPlayer.id === room.adminId,
    });
  }

  const playerId = generateId("p_");
  const player: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    joinedAt: new Date().toISOString(),
    correctGuesses: [],
  };
  await playersCol.insertOne(player);

  await roomsCol.updateOne({ code }, { $push: { players: player } });

  cookieStore.set("playerId", playerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({ code, playerId, isAdmin: playerId === room.adminId });
}
