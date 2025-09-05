import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { User } from "../../../../../types";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (
    !username ||
    !password ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return new Response(
      JSON.stringify({ error: "Username and password required" }),
      { status: 400 }
    );
  }

  const db = await getDb();
  const usersCol = db.collection<User>("users");

  // Find user
  const user = await usersCol.findOne({ username });

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  if (!user.passwordHash) {
    return new Response(JSON.stringify({ error: "User has no password set" }), {
      status: 400,
    });
  }

  // Check password
  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
    });
  }

  // Update last active
  await usersCol.updateOne(
    { id: user.id },
    { $set: { lastActiveAt: new Date().toISOString() } }
  );

  // Set cookies
  const cookieStore = await cookies();
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("username", user.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({
    success: true,
    userId: user.id,
    username: user.username,
  });
}
