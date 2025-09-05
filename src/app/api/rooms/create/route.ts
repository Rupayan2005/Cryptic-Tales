import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { generateId, generateRoomCode } from "@/lib/ids";
import { generateRoomKey } from "@/lib/crypto";
import type { Player, Room, RoomSettings } from "../../../../../types";

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return new Response(JSON.stringify({ error: "Name required" }), {
      status: 400,
    });
  }

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
  const playersCol = db.collection<Player>("players");
  const roomsCol = db.collection<Room>("rooms");

  const playerId = generateId("p_");
  const player: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    joinedAt: new Date().toISOString(),
    correctGuesses: [],
  };
  await playersCol.insertOne(player);

  const settings: RoomSettings = {
    timerSeconds: 60,
    decayRate: 1,
    difficulty: "medium",
    allowSuggestions: true,
    noTimeLimit: false,
  };

  const room: Room = {
    code: generateRoomCode(),
    adminId: playerId,
    roomKey: generateRoomKey(),
    players: [player],
    status: "lobby",
    settings,
    createdAt: new Date().toISOString(),
    currentClue: null,
    clueQueue: [],
    currentClueIndex: 0,
  };
  await roomsCol.insertOne(room);

  cookieStore.set("playerId", playerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({ code: room.code, playerId, isAdmin: true });
}
