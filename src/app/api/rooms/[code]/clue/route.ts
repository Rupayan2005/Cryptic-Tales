import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room, Clue } from "../../../../../../types";
import { encryptJsonWithKey } from "@/lib/crypto";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  extractImportantWords,
  createImportantWordsMapping,
} from "@/lib/word-extractor";

type GeminiOutput = { story: string; mapping: Record<string, string> };

function isAdmin(room: Room, playerId?: string) {
  return !!playerId && room.adminId === playerId;
}

function generatePrompt(secret: string, difficulty: string): string {
  const importantWords = extractImportantWords(secret);

  const difficultyInstructions = {
    easy: "Use simple, direct language. Make the hidden words relatively obvious through context clues and synonyms.",
    medium:
      "Use moderate complexity. Hide words through metaphors and allegories, but keep some clear connections.",
    hard: "Use complex, layered storytelling. Hide words through abstract concepts, multiple layers of meaning, and subtle wordplay.",
  };

  const basePrompt = `
Transform the secret message into an immersive fantasy-themed story clue.
Return strictly a JSON object with keys "story" and "mapping".

DIFFICULTY: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}

CRITICAL REQUIREMENTS:
- "story": EXACTLY 200-400 characters (not words), rich mystical atmosphere
- Use fantasy elements: magic, ancient realms, mystical creatures, enchanted objects
- Create an engaging narrative that feels like a complete mini-adventure
- "mapping": JSON object mapping ONLY the most important words from the secret to fantasy-themed masked tokens
- Focus on these important words: ${importantWords.join(", ")}
- Ignore articles, prepositions, and common words like "the", "at", "and", "is", etc.
- Use creative fantasy substitutions (e.g., "meeting" → "gathering-of-the-circle", "urgent" → "flame-touched")

STORY GUIDELINES:
- Set in a mystical realm with atmospheric details
- Include sensory descriptions (sounds, sights, magical aura)
- Create intrigue and mystery while embedding the hidden meanings
- Use archaic/mystical language style ("thee", "thou", "ancient", "whispered")
- DO NOT directly reveal the original secret words
- Make the story engaging enough to read multiple times for clues
- KEEP IT CONCISE: 200-400 characters total

SECRET MESSAGE: "${secret}"
FOCUS ON IMPORTANT WORDS: ${importantWords.join(", ")}

Return ONLY valid JSON with no additional text or formatting.`;

  return basePrompt;
}

async function generateStoryWithRetry(
  secret: string,
  difficulty: string,
  maxRetries = 3
): Promise<GeminiOutput> {
  const model = google("gemini-1.5-flash");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = generatePrompt(secret, difficulty);
      const { text } = await generateText({
        model,
        prompt,
        temperature: 0.8, // Add some creativity
      });

      // Clean the response - remove any markdown formatting or extra text
      const cleanedText = text
        .trim()
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");

      const parsed = JSON.parse(cleanedText) as GeminiOutput;

      // Validate the response structure
      if (
        !parsed.story ||
        !parsed.mapping ||
        typeof parsed.story !== "string" ||
        typeof parsed.mapping !== "object"
      ) {
        throw new Error("Invalid response structure");
      }

      // Validate story length - be more flexible with length requirements
      if (parsed.story.length < 50 || parsed.story.length > 800) {
        throw new Error(
          `Story length out of bounds: ${parsed.story.length} characters (need 50-800)`
        );
      }

      // Validate mapping has content
      if (Object.keys(parsed.mapping).length === 0) {
        throw new Error("Empty mapping");
      }

      // Filter mapping to only include important words
      const filteredMapping = createImportantWordsMapping(parsed.mapping);

      return {
        story: parsed.story,
        mapping: filteredMapping,
      };
    } catch (error) {
      console.error(`[v0] Gemini generation attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to generate story after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw new Error("Unexpected error in story generation");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { secrets } = await req.json();

  // Support both single secret (legacy) and multiple secrets
  const secretsArray = Array.isArray(secrets) ? secrets : [secrets];

  if (!secretsArray || secretsArray.length === 0) {
    return new Response(
      JSON.stringify({ error: "At least one secret required" }),
      {
        status: 400,
      }
    );
  }

  // Validate all secrets
  for (const secret of secretsArray) {
    if (!secret || typeof secret !== "string") {
      return new Response(
        JSON.stringify({ error: "All secrets must be valid strings" }),
        {
          status: 400,
        }
      );
    }

    const trimmedSecret = secret.trim();
    if (trimmedSecret.length < 3) {
      return new Response(
        JSON.stringify({
          error: "Each secret must be at least 3 characters long",
        }),
        { status: 400 }
      );
    }

    if (trimmedSecret.length > 200) {
      return new Response(
        JSON.stringify({
          error: "Each secret must be less than 200 characters",
        }),
        { status: 400 }
      );
    }
  }

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const room = await roomsCol.findOne({ code });
  if (!room)
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
    });

  const playerId = (await cookies()).get("playerId")?.value;
  if (!isAdmin(room, playerId))
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });

  try {
    const generatedClues: Clue[] = [];

    // Generate clues for all secrets
    for (const secret of secretsArray) {
      const trimmedSecret = secret.trim();

      console.log(
        `[v0] Generating story for secret: "${trimmedSecret}" with difficulty: ${room.settings.difficulty}`
      );

      const parsed = await generateStoryWithRetry(
        trimmedSecret,
        room.settings.difficulty
      );

      console.log(
        `[v0] Generated story (${parsed.story.length} chars) with ${
          Object.keys(parsed.mapping).length
        } mappings`
      );

      const mappingEncrypted = encryptJsonWithKey(parsed.mapping, room.roomKey);
      const originalSecretEncrypted = encryptJsonWithKey(
        trimmedSecret,
        room.roomKey
      );

      const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
      const complexityBonus = Math.min(Object.keys(parsed.mapping).length, 5); // Max 5 bonus points
      const basePoints = Math.floor(
        10 *
          difficultyMultiplier[
            room.settings.difficulty as keyof typeof difficultyMultiplier
          ] +
          complexityBonus
      );

      const clue: Clue = {
        story: parsed.story,
        mappingEncrypted,
        createdAt: new Date().toISOString(),
        basePoints,
        originalSecretEncrypted,
        isCompleted: false,
        timerStartedAt: undefined,
      };

      generatedClues.push(clue);
    }

    // Reset all players' correct guesses for new clues
    const updatedPlayers = room.players.map((p) => ({
      ...p,
      correctGuesses: [],
    }));

    // Set up clue queue and activate first clue
    const firstClue = generatedClues[0];
    firstClue.timerStartedAt = new Date().toISOString();

    await roomsCol.updateOne(
      { code },
      {
        $set: {
          currentClue: firstClue,
          clueQueue: generatedClues.slice(1), // Remaining clues
          currentClueIndex: 0,
          status: "playing",
          players: updatedPlayers,
        },
      }
    );

    const g = global as Record<string, unknown>;
    const io = g._io;
    if (io && typeof io === "object" && "to" in io) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (io as any).to(code).emit("clue:new", {
        story: firstClue.story,
        createdAt: firstClue.createdAt,
        basePoints: firstClue.basePoints,
        difficulty: room.settings.difficulty,
        clueIndex: 0,
        totalClues: generatedClues.length,
        timerStartedAt: firstClue.timerStartedAt,
      });
    }

    return Response.json({
      ok: true,
      story: firstClue.story,
      basePoints: firstClue.basePoints,
      mappingCount: Object.keys(generatedClues[0]?.mappingEncrypted ? {} : {})
        .length, // Will be updated when we decrypt
      difficulty: room.settings.difficulty,
      totalCluesGenerated: generatedClues.length,
      currentClueIndex: 0,
    });
  } catch (error) {
    console.error(`[v0] Story generation failed:`, error);

    return new Response(
      JSON.stringify({
        error:
          "Failed to generate story. Please try a different secret or try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
