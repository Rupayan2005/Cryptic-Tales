import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/ids";
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

  if (username.length < 3 || username.length > 20) {
    return new Response(
      JSON.stringify({ error: "Username must be 3-20 characters" }),
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return new Response(
      JSON.stringify({ error: "Password must be at least 6 characters" }),
      { status: 400 }
    );
  }

  const db = await getDb();
  const usersCol = db.collection<User>("users");

  // Check if user already exists
  const existingUser = await usersCol.findOne({ username });

  if (existingUser) {
    if (existingUser.passwordHash) {
      return new Response(
        JSON.stringify({
          error: "Username already exists. Please try a different username.",
        }),
        { status: 409 }
      );
    } else {
      // User exists but no password - update with password
      const passwordHash = hashPassword(password);
      await usersCol.updateOne(
        { id: existingUser.id },
        {
          $set: {
            passwordHash,
            lastActiveAt: new Date().toISOString(),
          },
        }
      );

      // Set cookies
      const cookieStore = await cookies();
      cookieStore.set("userId", existingUser.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      cookieStore.set("username", existingUser.username, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return Response.json({
        success: true,
        userId: existingUser.id,
        username: existingUser.username,
      });
    }
  }

  // Create new user
  const userId = generateId("u_");
  const passwordHash = hashPassword(password);

  const newUser: User = {
    id: userId,
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  await usersCol.insertOne(newUser);

  // Set cookies
  const cookieStore = await cookies();
  cookieStore.set("userId", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("username", username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({
    success: true,
    userId,
    username,
  });
}
