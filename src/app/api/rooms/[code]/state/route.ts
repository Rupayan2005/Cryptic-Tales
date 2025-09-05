import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { Room } from "../../../../../../types";
import type { Collection, WithId } from "mongodb";

// Migration function to add missing fields to existing rooms
async function migrateRoomIfNeeded(
  room: WithId<Room>,
  roomsCol: Collection<Room>
): Promise<WithId<Room>> {
  let needsUpdate = false;
  const updates: Partial<Room> & Record<string, unknown> = {};

  // Add missing fields for backward compatibility
  if (!room.clueQueue) {
    updates.clueQueue = [];
    needsUpdate = true;
  }

  if (room.currentClueIndex === undefined) {
    updates.currentClueIndex = 0;
    needsUpdate = true;
  }

  if (room.settings.noTimeLimit === undefined) {
    updates["settings.noTimeLimit"] = false;
    needsUpdate = true;
  }

  // Add missing fields to current clue if it exists
  if (room.currentClue) {
    if (room.currentClue.isCompleted === undefined) {
      updates["currentClue.isCompleted"] = false;
      needsUpdate = true;
    }
    if (!room.currentClue.timerStartedAt) {
      updates["currentClue.timerStartedAt"] = room.currentClue.createdAt;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    await roomsCol.updateOne({ code: room.code }, { $set: updates });

    // Return updated room object
    return {
      ...room,
      clueQueue: updates.clueQueue || room.clueQueue || [],
      currentClueIndex:
        updates.currentClueIndex !== undefined
          ? updates.currentClueIndex
          : room.currentClueIndex || 0,
      settings: {
        ...room.settings,
        noTimeLimit:
          updates["settings.noTimeLimit"] !== undefined
            ? updates["settings.noTimeLimit"]
            : room.settings.noTimeLimit || false,
      },
      currentClue: room.currentClue
        ? {
            ...room.currentClue,
            isCompleted:
              updates["currentClue.isCompleted"] !== undefined
                ? updates["currentClue.isCompleted"]
                : room.currentClue.isCompleted || false,
            timerStartedAt:
              updates["currentClue.timerStartedAt"] ||
              room.currentClue.timerStartedAt ||
              room.currentClue.createdAt,
          }
        : room.currentClue,
    } as WithId<Room>;
  }

  return room;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const db = await getDb();
  const roomsCol = db.collection<Room>("rooms");
  let room = await roomsCol.findOne({ code }, { projection: { roomKey: 0 } });
  if (!room)
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });

  // Migrate room if needed for backward compatibility
  room = await migrateRoomIfNeeded(room, roomsCol);

  return Response.json(room);
}
