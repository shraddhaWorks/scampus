import { Server } from "socket.io";

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
  });

socket.on(
  "send-message",
  ({ roomId, message }: { roomId: string; message: any }) => {
    io.to(roomId).emit("receive-message", message);
  }
);

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

console.log("Socket server running on :3001");
