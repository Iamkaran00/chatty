import raceManage from "./raceManage.js";
import { generateRaceSentence } from "./sentenceGenrator.js";
import User from "../../models/user.model.js";
import { Message } from "../../models/message.model.js";
export default function setupRaceHandlers(io, socket, getReceiverSocketId) {

socket.on("sendGameInvite", async ({ senderId, receiverId }) => {

  try {

    const roomId = `race_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newInviteMsg = new Message({
      senderId,
      receiverId,
      text: "🏎️ Typing Race Challenge!",
      gameRoomId: roomId
    });

    await newInviteMsg.save();

    raceManage.createRoom(roomId, senderId);

    socket.join(roomId);

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newInviteMsg);
    }

    socket.emit("newMessage", newInviteMsg);

    // 🔥 important: tell sender to open race
    socket.emit("raceCreated", { roomId });

  } catch (error) {
    console.log("Invite Error:", error);
  }

});
    socket.on("joinRaceRoom", async ({ roomId, userId }) => {

        const room = await raceManage.joinRoom(roomId, userId);

        if (room.error) {
            socket.emit("gameError", room.error);
            return;
        }

        socket.join(roomId);

        if (Object.keys(room.players).length === 2) {

            const sentence = await generateRaceSentence();

            raceManage.setSentence(roomId, sentence);

            io.to(roomId).emit("raceReady", {
                sentence,
                players: Object.keys(room.players)
            });

            let count = 3;

            const interval = setInterval(() => {

                if (count > 0) {
                    io.to(roomId).emit("countdown", count);
                    count--;
                } else {

                    clearInterval(interval);

                    const r = raceManage.getRoom(roomId);
                    r.status = "playing";
                    r.startTime = Date.now();

                    io.to(roomId).emit("raceStart");
                }

            }, 1000);
        }
    });

    socket.on("typingProgress", async ({ roomId, userId, progress }) => {

        const result = raceManage.updateProgress(roomId, userId, { progress });

        if (!result) return;

        io.to(roomId).emit("raceUpdate", { userId, progress });

        if (result.finished) {

            io.to(roomId).emit("raceFinish", {
                winnerId: result.winnerId
            });

            try {

                const [player1, player2] = result.players;

                await User.updateMany(
                    { _id: { $in: [player1, player2] } },
                    { $inc: { "gameStat.racesPlayed": 1 } }
                );

                await User.findByIdAndUpdate(
                    result.winnerId,
                    { $inc: { "gameStat.racesWon": 1 } }
                );

            } catch (error) {
                console.error("DB Stats Error:", error);
            }
        }
    });

    socket.on("rematchRequest", async ({ roomId, userId }) => {

        const shouldRestart = raceManage.handleRematch(roomId, userId);

        if (!shouldRestart) return;

        const room = raceManage.getRoom(roomId);

        const sentence = await generateRaceSentence();

        raceManage.setSentence(roomId, sentence);

        io.to(roomId).emit("raceReady", {
            sentence,
            players: Object.keys(room.players)
        });

        let count = 3;

        const interval = setInterval(() => {

            if (count > 0) {

                io.to(roomId).emit("countdown", count);
                count--;

            } else {

                clearInterval(interval);

                room.status = "playing";
                room.startTime = Date.now();

                io.to(roomId).emit("raceStart");
            }

        }, 1000);
    });
socket.on("leaveRace",async ({ roomId, userId }) => {

  const room = raceManage.getRoom(roomId);
  if (!room) return;
 await Message.updateOne (
    {gameRoomId : roomId},
    {$set : {gamePlayed : true}}
 )
 io.to(roomId).emit("racePlayed",{roomId});
  raceManage.removePlayer(roomId, userId);

  socket.leave(roomId);

  socket.to(roomId).emit("opponentLeft");

});
 
    socket.on("disconnect", () => {

        raceManage.rooms.forEach((room, roomId) => {

            if (room.players[socket.userId]) {

                raceManage.removePlayer(roomId, socket.userId);

                io.to(roomId).emit("playerLeft");
            }

        });
    });
}