import {Server} from "socket.io";
import http from 'http' ;
import racehandler from '../src/game/game1/racehandler.js'
import setupRaceHandlers from "../src/game/game1/racehandler.js";
import express from 'express';
import { Message } from "../src/models/message.model.js";
const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors : {
        origin : ['http://localhost:5173'],
        credentials:true,
    }
});
export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}
const userSocketMap = {}; //{userId , socketId};

 export function lastlogin (id) {
    return lastseen;
 }
 let lastseen ;
 io.on("connection",socket =>{
    console.log("user got connected",socket.id);
    const userId = socket.handshake.query.userId;
    socket.userId = userId;
    if(!userId) {
        console.warn("socket connect without ") ;
        return;
    }
if(userId) {
    userSocketMap[userId] = socket.id;

}
   io.emit("getOnlineUsers",Object.keys(userSocketMap))
    
setupRaceHandlers(io,socket,getReceiverSocketId);
    socket.on('disconnect',()=>{
         
        console.log("user got disconnected",socket.id);
         lastseen = Date.now();
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })
    socket.on("markAsSeen",async({senderId,receiverId})=>{
    try {
           await Message.updateMany(
            {senderId,receiverId,isSeen:false},
            {$set : {isSeen : true}}
           ) 
           const senderSocketId = userSocketMap[senderId];
           const receiverSocketId = userSocketMap[receiverId];
           if(senderSocketId){
            // yahaan sender samne walla hai jisne message seen kar liya
            io.to(senderSocketId).emit("messagesSeen",{senderId,receiverId});
           }
           if(receiverSocketId) {
            io.to(receiverSocketId).emit("messagesSeen",{senderId,receiverId});
           }
    } catch (error) {
        console.log("error occured",error);
    }
})







    socket.on("typing",({senderId,receiverId}) => {
   const receiverSocketId = userSocketMap[receiverId];
   if(receiverSocketId) {
    io.to(receiverSocketId).emit("userTyping",senderId);
   }


    });
   socket.on('stopTyping',({senderId,receiverId}) =>{
    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId) io.to(receiverSocketId).emit('userStopTyping',senderId);
   })


 socket.on("reactMessage", async ({ messageId, emoji, userId }) => {
  try {

    const message = await Message.findById(messageId);

    if (!message) return;

    const existing = message.reactions.find(
      (rxn) => rxn.userId.toString() === userId
    );

    if (existing) {
      existing.emoji = emoji;
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const senderSocketId = userSocketMap[message.senderId];
    const receiverSocketId = userSocketMap[message.receiverId];

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReactionUpdate", {
        messageId: message._id,
        reactions: message.reactions,
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReactionUpdate", {
        messageId: message._id,
        reactions: message.reactions,
      });
    }

  } catch (error) {
    console.log("reaction error", error);
  }
});



})


export {io,app,server};