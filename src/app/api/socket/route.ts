import { Server as IOServer } from "socket.io";

interface GlobalWithIO {
  _io?: IOServer;
}

const g = global as GlobalWithIO;
let io: IOServer | undefined = g._io;

export const GET = async () => {
  // Initialize a Socket.io server once
  if (!io) {
    io = new IOServer({ path: "/api/socket", addTrailingSlash: false });
    g._io = io;

    io.on("connection", (socket) => {
      socket.on("room:join", (code: string) => {
        socket.join(code);
        io?.to(code).emit("player:activity", { type: "join" });
      });
      socket.on("room:leave", (code: string) => {
        socket.leave(code);
        io?.to(code).emit("player:activity", { type: "leave" });
      });
    });
  }
  // Health response
  return new Response("ok", { status: 200 });
};
