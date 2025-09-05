import type { NextRequest } from "next/server"
import { getDb } from "@/lib/db"
import type { User } from "../../../../../types"

export async function POST(req: NextRequest) {
  const { username } = await req.json()

  if (!username || typeof username !== "string") {
    return new Response(JSON.stringify({ error: "Username required" }), { status: 400 })
  }

  // Validate username format
  const trimmed = username.trim()
  if (trimmed.length < 2) {
    return new Response(JSON.stringify({ error: "Username must be at least 2 characters" }), { status: 400 })
  }

  if (trimmed.length > 20) {
    return new Response(JSON.stringify({ error: "Username must be less than 20 characters" }), { status: 400 })
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return new Response(
      JSON.stringify({ error: "Username can only contain letters, numbers, hyphens, and underscores" }),
      { status: 400 },
    )
  }

  const db = await getDb()
  const usersCol = db.collection<User>("users")

  // Check if username already exists (case-insensitive)
  const existingUser = await usersCol.findOne({
    username: { $regex: new RegExp(`^${trimmed}$`, "i") },
  })

  if (existingUser) {
    return new Response(JSON.stringify({ error: "Username taken, try a different username" }), { status: 409 })
  }

  return Response.json({ available: true })
}
