import { messageModel } from "../modules/message/message.model.js";
import mongoose from "mongoose";

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { roomId, userId, content } = data;

        if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) {
          return console.error("Invalid roomId or userId");
        }

        const message = await messageModel.create({
          room: roomId,
          sender: userId,
          content,
        });

        const populatedMessage = await message.populate("sender", "name");

        io.to(roomId).emit("receiveMessage", populatedMessage);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};