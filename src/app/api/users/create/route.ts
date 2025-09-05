import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/ids";
import type { User } from "../../../../../types";

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return new Response(JSON.stringify({ error: "Username required" }), {
      status: 400,
    });
  }

  const trimmed = username.trim();

  const db = await getDb();
  const usersCol = db.collection<User>("users");

  // Double-check username availability
  const existingUser = await usersCol.findOne({
    username: { $regex: new RegExp(`^${trimmed}$`, "i") },
  });

  if (existingUser) {
    return new Response(
      JSON.stringify({ error: "Username taken, try a different username" }),
      { status: 409 }
    );
  }

  const userId = generateId("u_");
  const user: User = {
    id: userId,
    username: trimmed,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  await usersCol.insertOne(user);

  // Set user cookie for session management

  ////await use
  (await cookies()).set("userId", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  (await cookies()).set("username", trimmed, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({ userId, username: trimmed });
}
