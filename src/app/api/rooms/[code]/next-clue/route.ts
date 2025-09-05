import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Room, Player } from "../../../../../../types";

function isAdmin(room: Room, playerId?: string) {
  return !!playerId && room.adminId === playerId;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  const room = await roomsCol.findOne({ code });

  if (!room) {
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
    });
  }

  const playerId = (await cookies()).get("playerId")?.value;

  // Check if clue is completed or timer has expired
  const currentClue = room.currentClue;
  if (!currentClue) {
    return new Response(JSON.stringify({ error: "No current clue" }), {
      status: 400,
    });
  }

  const now = new Date();
  const timerStartedAt = currentClue.timerStartedAt
    ? new Date(currentClue.timerStartedAt)
    : null;
  const timerExpired =
    timerStartedAt &&
    !room.settings.noTimeLimit &&
    now.getTime() - timerStartedAt.getTime() >=
      room.settings.timerSeconds * 1000;

  // Only admin can manually advance, or timer must have expired, or clue must be completed
  if (!isAdmin(room, playerId) && !timerExpired && !currentClue.isCompleted) {
    return new Response(JSON.stringify({ error: "Cannot advance clue yet" }), {
      status: 403,
    });
  }

  // Check if there are more clues in queue
  if (!room.clueQueue || room.clueQueue.length === 0) {
    // No more clues - mark game as ended or show completion message
    await roomsCol.updateOne(
      { code },
      {
        $set: {
          currentClue: null,
          status: "ended",
        },
      }
    );

    const g = global as Record<string, unknown>;
    const io = g._io;
    if (io && typeof io === "object" && "to" in io) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (io as any).to(code).emit("game:completed", {
        message:
          "No more messages for now. If there are new stories, we will update you!",
      });
    }

    return Response.json({
      ok: true,
      gameCompleted: true,
      message:
        "No more messages for now. If there are new stories, we will update you!",
    });
  }

  // Move to next clue
  const nextClue = room.clueQueue[0];
  const remainingQueue = room.clueQueue.slice(1);
  const newClueIndex = (room.currentClueIndex || 0) + 1;

  // Start timer for next clue
  nextClue.timerStartedAt = new Date().toISOString();

  // Reset all players' correct guesses for the new clue
  const updatedPlayers = room.players.map((p: Player) => ({
    ...p,
    correctGuesses: [],
  }));

  await roomsCol.updateOne(
    { code },
    {
      $set: {
        currentClue: nextClue,
        clueQueue: remainingQueue,
        currentClueIndex: newClueIndex,
        players: updatedPlayers,
      },
    }
  );

  const g = global as Record<string, unknown>;
  const io = g._io;
  if (io && typeof io === "object" && "to" in io) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).to(code).emit("clue:new", {
      story: nextClue.story,
      createdAt: nextClue.createdAt,
      basePoints: nextClue.basePoints,
      difficulty: room.settings.difficulty,
      clueIndex: newClueIndex,
      totalClues: newClueIndex + remainingQueue.length + 1,
      timerStartedAt: nextClue.timerStartedAt,
    });
  }

  return Response.json({
    ok: true,
    story: nextClue.story,
    clueIndex: newClueIndex,
    totalClues: newClueIndex + remainingQueue.length + 1,
  });
}
