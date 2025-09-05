import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room } from "../../../../../../types";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { secret } = await req.json();
  if (!secret || typeof secret !== "string") {
    return new Response(JSON.stringify({ error: "Secret required" }), {
      status: 400,
    });
  }

  const trimmedSecret = secret.trim();
  if (trimmedSecret.length < 3 || trimmedSecret.length > 200) {
    return new Response(
      JSON.stringify({ error: "Secret must be 3-200 characters" }),
      { status: 400 }
    );
  }

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const room = await roomsCol.findOne({ code });
  if (!room)
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
    });

  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;
  if (!playerId || room.adminId !== playerId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  try {
    const model = google("gemini-1.5-flash");
    const prompt = `
Generate a preview of how the secret "${trimmedSecret}" would be transformed into a fantasy story.
Return only a brief 2-3 sentence preview showing the style and tone, not the full story.
Difficulty: ${room.settings.difficulty}
Use mystical, fantasy language but keep it short for preview purposes.
`;

    const { text } = await generateText({ model, prompt });

    return Response.json({
      preview: text.trim(),
      difficulty: room.settings.difficulty,
      estimatedWords: Math.floor(trimmedSecret.split(" ").length * 15), // Rough estimate
    });
  } catch (error) {
    console.error(`[v0] Preview generation failed:`, error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate preview",
      }),
      { status: 500 }
    );
  }
}
