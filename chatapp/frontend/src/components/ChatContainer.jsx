
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWallpaperStore } from "../store/useWallpaper";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeleton/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import img from "../assets/smartboy.jpg";
import toast from "react-hot-toast";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useNavigate } from "react-router-dom";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    markMessageSeen,
    listenSeen,
    unlistenSeen,
    selectedUser,
    listenMessage,
    unlistenMessage,
    deleteMessage,
    listenDeleteMessage,
    unlistenDeleteMessage,
    isTyping,
    listenTyping,
    unlistenTyping,
    reactToMessage,
    listenReaction,
    unlistenReaction,
  } = useChatStore();

  const navigate = useNavigate();
  const { authUser, socket } = useAuthStore();
  const { wallpaper } = useWallpaperStore();

  const messageRef = useRef(null);
  const [openReaction, setOpenReaction] = useState(null);

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);

    listenSeen();
    listenMessage();
    listenDeleteMessage();
    listenTyping();
    listenReaction();

    markMessageSeen(selectedUser._id);

    return () => {
      unlistenMessage();
      unlistenSeen();
      unlistenDeleteMessage();
      unlistenTyping();
      unlistenReaction();
    };
  }, [selectedUser?._id]);

  const handleJoinRace = (roomId) => {
    if (!socket || !authUser) return;
    navigate(`/race/${roomId}`);
  };
useEffect(() =>{
  if(!socket) return;

  socket.on("racePlayed",({roomId}) => {
    useChatStore.setState(state => ({
      messages: state.messages.map(msg =>
        msg.gameRoomId === roomId
          ? { ...msg, gamePlayed: true }
          : msg
      )
    }));
  });

  return () => socket.off("racePlayed");

},[socket]);
  useEffect(() => {
    if (messageRef.current && messages) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const bgStyle =
    wallpaper?.id === selectedUser?._id && wallpaper?.src
      ? {
          backgroundImage: `url(${wallpaper.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Download failed");
    }
  };
 
  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader />

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={bgStyle}
      >
        {messages.length === 0 ? (
          <p className="text-center text-gray-400">
            No messages yet. Say hi 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === authUser?._id;

            return (
              <div
                ref={messageRef}
                key={m._id}
                className={`chat ${mine ? "chat-end" : "chat-start"}`}
              >

                {/* Avatar */}
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        mine
                          ? authUser.profilePic || img
                          : selectedUser.profilePic || img
                      }
                      alt="avatar"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(m.createdAt)}
                  </time>
                </div>

                {/* Message Bubble */}
                <div className="chat-bubble relative group flex flex-col w-fit">

                  {/* 🏎 RACE INVITE CARD */}
                {m.gameRoomId && !m.isDeleted && (
  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg text-white w-72 my-2">

    <div className="flex flex-col items-center gap-2">

      <div className="text-5xl">🏎️</div>

      <h2 className="font-bold text-lg">
        Typing Race Challenge
      </h2>

      {m.gamePlayed ? (
        <div className="badge badge-success p-3 text-black font-semibold">
          Played ✔
        </div>
      ) : (
        <button
          onClick={() => handleJoinRace(m.gameRoomId)}
          className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:scale-105 transition"
        >
          Join Race
        </button>
      )}

    </div>

  </div>
)}

                  {/* Reaction Menu Button */}
                  {!m.isDeleted && (
                    <button
                      onClick={() =>
                        setOpenReaction(openReaction === m._id ? null : m._id)
                      }
                      className="absolute top-1 cursor-pointer right-2 opacity-0 group-hover:opacity-100 text-gray-300"
                    >
                      ⋮
                    </button>
                  )}

                  {/* Reaction Picker */}
                  {openReaction === m._id && (
                    <div className="cursor-pointer absolute -top-10 right-0 left-1 bg-gray-800 w-fit px-2 py-1 rounded flex gap-2 shadow-lg z-10">
                      {["😂", "😔", "🔥", "❤️", "👍"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            reactToMessage(m._id, emoji);
                            setOpenReaction(null);
                          }}
                          className="hover:scale-125 transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* IMAGE */}
                  {m.image && !m.isDeleted && (
                    <div className="relative inline-block">
                      <Zoom>
                        <img
                          src={m.image}
                          className="sm:max-w-[200px] rounded-md mb-2"
                          alt="attachment"
                        />
                      </Zoom>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() =>
                            handleDownload(m.image, "chat-image.jpg")
                          }
                          className="bg-black/60 text-white px-2 py-1 text-xs rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIDEO */}
                  {m.video && !m.isDeleted && (
                    <video
                      src={m.video}
                      controls
                      className="sm:max-w-[300px] rounded-md mb-2"
                    />
                  )}

                  {/* AUDIO */}
                  {m.audio && !m.isDeleted && (
                    <div className="mt-2 mb-1">
                      <audio
                        src={m.audio}
                        controls
                        className="h-10 sm:w-[250px] w-[200px]"
                      />
                    </div>
                  )}

                  {/* GIF */}
                  {m.gif && !m.isDeleted && (
                    <img
                      src={m.gif}
                      className="sm:max-w-[220px] rounded-md mb-2"
                      alt="gif"
                    />
                  )}

                  {/* TEXT */}
                  {m.isDeleted ? (
                    <p className="italic">This message was deleted</p>
                  ) : (
                    m.text && <p>{m.text}</p>
                  )}

                  {/* REACTIONS */}
                  {m.reactions && m.reactions.length > 0 && !m.isDeleted && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {m.reactions.map((r, i) => (
                        <span
                          key={i}
                          className="bg-gray-700 text-xs px-2 py-1 rounded-full text-white"
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* DELETE BUTTON */}
                  {mine && !m.isDeleted && (
                    <button
                      onClick={() => deleteMessage(m._id)}
                      className="text-xs mt-2 self-end cursor-pointer p-1 rounded-full bg-red-500 text-white px-3"
                    >
                      Delete
                    </button>
                  )}

                  {/* SEEN / DELIVERED */}
                  {mine && (
                    <span className="text-[11px] text-gray-300 mt-1 self-end">
                      {m.isSeen ? "Seen 👀" : "Delivered"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isTyping && (
        <div className="px-4 pb-2 text-gray-400 italic flex items-center gap-1 absolute bottom-16">
          <span className="animate-bounce">🐵</span>
          <span className="animate-bounce delay-150">🙈</span>
          <span className="animate-bounce delay-300">🙊</span>
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;

