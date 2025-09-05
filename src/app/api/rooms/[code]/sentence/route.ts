import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room } from "../../../../../../types";
import { decryptJsonWithKey } from "@/lib/crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const room = await roomsCol.findOne({ code });
  if (!room || !room.currentClue)
    return new Response(JSON.stringify({ error: "No active clue" }), {
      status: 400,
    });

  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;
  if (!playerId)
    return new Response(JSON.stringify({ error: "No player" }), {
      status: 401,
    });

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return new Response(JSON.stringify({ error: "Player not found" }), {
      status: 404,
    });
  }

  // Decrypt the original secret
  let originalSecret: string;
  try {
    if (room.currentClue.originalSecretEncrypted) {
      originalSecret = decryptJsonWithKey<string>(
        room.currentClue.originalSecretEncrypted,
        room.roomKey
      );
    } else {
      // Fallback for older clues without encrypted secret
      return new Response(
        JSON.stringify({
          error: "Original secret not available for this clue",
        }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to decrypt original secret:", error);
    return new Response(JSON.stringify({ error: "Failed to decrypt secret" }), {
      status: 500,
    });
  }

  if (!originalSecret) {
    return new Response(JSON.stringify({ error: "Original secret is empty" }), {
      status: 400,
    });
  }

  const currentCorrectGuesses = player.correctGuesses || [];
  const sentenceWithBlanks = createSentenceWithBlanks(
    originalSecret,
    currentCorrectGuesses
  );

  return Response.json({
    originalSecret,
    sentenceWithBlanks,
    correctGuesses: currentCorrectGuesses,
    totalWords: originalSecret.split(/\s+/).filter((word) => word.length > 2)
      .length,
  });
}

function createSentenceWithBlanks(
  originalSecret: string,
  correctGuesses: string[]
): string {
  if (!originalSecret) {
    return "";
  }

  const words = originalSecret.split(/(\s+)/); // Preserve spaces

  return words
    .map((word) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
      if (cleanWord.length <= 2) return word; // Keep short words as is

      // Check if this word or part of it was guessed correctly
      const wasGuessed = correctGuesses.some(
        (guess) =>
          cleanWord === guess ||
          cleanWord.includes(guess) ||
          guess.includes(cleanWord)
      );

      if (wasGuessed) {
        return word; // Show the word
      } else {
        // Replace with blanks but preserve punctuation
        const punctuation = word.replace(/\w/g, "");
        const blanks = "_".repeat(cleanWord.length);
        return blanks + punctuation;
      }
    })
    .join("");
}
