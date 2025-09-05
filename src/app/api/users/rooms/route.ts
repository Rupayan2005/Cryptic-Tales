import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room, User } from "../../../../../types";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const username = cookieStore.get("username")?.value;

  if (!userId || !username) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const usersCol = db.collection<User>("users");

  // Update user's last active time
  await usersCol.updateOne(
    { id: userId },
    { $set: { lastActiveAt: new Date().toISOString() } }
  );

  // Find rooms where user is a player (by matching username in players array)
  const userRooms = await roomsCol
    .find({ "players.name": username }, { projection: { roomKey: 0 } }) ///as any
    .sort({ createdAt: -1 })
    .toArray();

  // Add admin status and player info for each room
  const roomsWithStatus = userRooms.map((room) => {
    const userPlayer = room.players.find((p) => p.name === username);
    const isAdmin = userPlayer ? room.adminId === userPlayer.id : false;

    return {
      ...room,
      isAdmin,
      playerCount: room.players.length,
      userScore: userPlayer?.score || 0,
    };
  });

  return Response.json({
    rooms: roomsWithStatus,
    username,
    userId,
  });
}
