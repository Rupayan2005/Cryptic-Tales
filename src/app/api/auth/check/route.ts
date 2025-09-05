import { getDb } from "@/lib/db";
import type { User } from "../../../../../types";

export async function POST(req: Request) {
  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return new Response(JSON.stringify({ error: "Username required" }), {
      status: 400,
    });
  }

  const db = await getDb();
  const usersCol = db.collection<User>("users");

  // Check if user exists
  const existingUser = await usersCol.findOne({ username });

  if (existingUser) {
    // User exists - check if they have a password
    return Response.json({
      exists: true,
      hasPassword: !!existingUser.passwordHash,
      userId: existingUser.id,
    });
  } else {
    // New user
    return Response.json({
      exists: false,
      hasPassword: false,
      userId: null,
    });
  }
}
