import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room} from "../../../../../../types";
import { decryptJsonWithKey } from "@/lib/crypto";
import { extractImportantWords } from "@/lib/word-extractor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { guess } = await req.json();
  if (!guess || typeof guess !== "string")
    return new Response(JSON.stringify({ error: "Guess required" }), {
      status: 400,
    });

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

  // Get player's current correct guesses
  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return new Response(JSON.stringify({ error: "Player not found" }), {
      status: 404,
    });
  }

  const currentCorrectGuesses = player.correctGuesses || [];

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

  // Extract important words from the original secret for matching
  const importantWords = extractImportantWords(originalSecret);
  const normalizedGuess = guess.trim().toLowerCase();

  // Check if the guess matches any important word in the secret
  const matchedWord = importantWords.find(
    (word) =>
      word === normalizedGuess ||
      word.includes(normalizedGuess) ||
      normalizedGuess.includes(word)
  );

  if (!matchedWord) {
    return Response.json({
      correct: false,
      message: "Wrong! Try a different word.",
    });
  }

  // Check if already guessed this word
  if (currentCorrectGuesses.includes(matchedWord)) {
    return Response.json({
      correct: false,
      message: "You already guessed that word!",
    });
  }

  // Calculate points based on time elapsed
  const elapsedSec =
    (Date.now() - new Date(room.currentClue.createdAt).getTime()) / 1000;
  const ticks = Math.floor(elapsedSec / Math.max(1, room.settings.decayRate));
  const points = Math.max(1, room.currentClue.basePoints - ticks);

  // Update player with new correct guess and points
  const updatedCorrectGuesses = [...currentCorrectGuesses, matchedWord];
  const updatedPlayers = room.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          score: p.score + points,
          correctGuesses: updatedCorrectGuesses,
        }
      : p
  );

  // Check if all important words have been guessed
  const allWordsGuessed = importantWords.every((word) =>
    updatedCorrectGuesses.some(
      (guess) => guess === word || guess.includes(word) || word.includes(guess)
    )
  );

  // Mark clue as completed if all words guessed
  let updatedClue = room.currentClue;
  if (allWordsGuessed && !room.currentClue.isCompleted) {
    updatedClue = { ...room.currentClue, isCompleted: true };
  }

  await roomsCol.updateOne(
    {
      code,
    },
    {
      $set: {
        players: updatedPlayers,
        currentClue: updatedClue,
      },
    }
  );

  // Create the sentence with filled words
  const sentenceWithBlanks = createSentenceWithBlanks(
    originalSecret,
    updatedCorrectGuesses
  );

  const g = global as Record<string, unknown>;
  const io = g._io;
  if (io && typeof io === "object" && "to" in io) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).to(code).emit("score:update", {
      playerId,
      points,
      players: updatedPlayers.map(({ id, name, score }) => ({
        id,
        name,
        score,
      })),
    });

    // Emit guess result to the specific player
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).to(code).emit("guess:result", {
      playerId,
      correct: true,
      matchedWord,
      points,
      sentenceWithBlanks,
    });

    // If clue completed and no time limit, advance immediately
    if (allWordsGuessed && room.settings.noTimeLimit) {
      // Auto-advance to next clue
      setTimeout(async () => {
        try {
          await fetch(`http://localhost:3000/api/rooms/${code}/next-clue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Failed to auto-advance clue:", error);
        }
      }, 2000); // Small delay to let players see the completion
    }
  }

  return Response.json({
    correct: true,
    message: allWordsGuessed
      ? "Congratulations! You've solved this story!"
      : "Correct!",
    matchedWord,
    points,
    sentenceWithBlanks,
    clueCompleted: allWordsGuessed,
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
