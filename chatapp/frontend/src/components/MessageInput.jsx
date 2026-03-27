import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Mic, Send, Square, Image as ImageIcon, Film, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Gifpicker from "./Gifpicker";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [gif, setGif] = useState(null);

  const [isSending, setIsSending] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [audioPreview, setAudioPreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const { sendMessage } = useChatStore();

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const typingTimeoutRef = useRef(null); // Added for typing indicator

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [showGif, setShowGif] = useState(false);

  const socket = useAuthStore.getState().socket;
  const selectedUser = useChatStore.getState().selectedUser;
  const authUser = useAuthStore.getState().authUser;

  const navigate = useNavigate();
const handleTyping = (e) => {
  setText(e.target.value);

  if (socket && selectedUser && authUser) {
    //senderId added — server needs this to know who is typing
    socket.emit("typing", { senderId: authUser._id, receiverId: selectedUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { senderId: authUser._id, receiverId: selectedUser._id });
    }, 2000);
  }
};

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Select image file");
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      return toast.error("Select video file");
    }

    const reader = new FileReader();
    reader.onload = () => setVideoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setImagePreview(null);
    setVideoPreview(null);
    setGif(null);
  };

  /* ================= AUDIO ================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));

        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((p) => p + 1);
      }, 1000);
    } catch (err) {
      toast.error("Mic permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const cancelAudio = () => {
    setAudioPreview(null);
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const blobToBase64 = (blob) => {
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  /* ================= SEND ================= */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() && !imagePreview && !videoPreview && !audioBlob && !gif) return;

    setIsSending(true);

    // Immediately stop the typing animation for the other user when we send
    if (socket && selectedUser) {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    let audioBase64 = null;
    if (audioBlob) audioBase64 = await blobToBase64(audioBlob);

    await sendMessage({
      text,
      image: imagePreview,
      video: videoPreview,
      audio: audioBase64,
      gif,
    });

    setText("");
    removeMedia();
    cancelAudio();
    setIsSending(false);
  };

  /* ================= GAME ================= */
  useEffect(() => {
    if (!socket) return;

    socket.on("raceCreated", ({ roomId }) => {
      navigate(`/race/${roomId}`);
    });

    return () => socket.off("raceCreated");
  }, [socket, navigate]);

  const handleSendGameInvite = () => {
    if (!socket || !selectedUser || !authUser) return;

    socket.emit("sendGameInvite", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });

    toast.success("Race invite sent 🏎️");
  };

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const hasMedia = imagePreview || videoPreview || gif;
  const hasAudio = audioPreview;

  return (
    <div className="p-4 bg-base-100 border-t border-base-300 w-full relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      
      {/* MEDIA PREVIEW */}
      {hasMedia && (
        <div className="mb-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative group inline-block">
            {imagePreview && <img src={imagePreview} alt="Preview" className="h-28 w-auto rounded-xl object-cover border border-base-300 shadow-sm" />}
            {videoPreview && <video src={videoPreview} controls className="h-28 w-auto rounded-xl border border-base-300 shadow-sm bg-black" />}
            {gif && <img src={gif} alt="GIF Preview" className="h-28 w-auto rounded-xl object-cover border border-base-300 shadow-sm" />}
            <button
              onClick={removeMedia}
              className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* AUDIO PREVIEW */}
      {hasAudio && (
        <div className="mb-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 p-2 bg-base-200/50 rounded-xl border border-base-300 w-fit">
          <audio src={audioPreview} controls className="h-10" />
          <button onClick={cancelAudio} className="btn btn-circle btn-xs btn-error shadow-sm">
            <X size={14} />
          </button>
        </div>
      )}

      {/* INPUT FORM */}
      <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
        <input type="file" accept="image/*" hidden ref={imageInputRef} onChange={handleImageChange} />
        <input type="file" accept="video/*" hidden ref={videoInputRef} onChange={handleVideoChange} />

        <div className="flex-1 flex items-center gap-1 bg-base-200/50 hover:bg-base-200 focus-within:bg-base-200 border border-transparent focus-within:border-primary/20 rounded-3xl px-2 py-1.5 transition-all duration-200">
          <input
            className="flex-1 bg-transparent text-sm md:text-base outline-none px-3 py-2 placeholder:text-base-content/50"
            placeholder="Type a message..."
            value={text}
            onChange={handleTyping} // <-- Now calls the new typing handler
            disabled={isSending}
          />

          {!hasMedia && !hasAudio && (
            <div className="flex items-center gap-1 pr-1 text-base-content/60">
              <button type="button" onClick={() => imageInputRef.current?.click()} className="btn btn-circle btn-sm btn-ghost hover:text-primary hover:bg-base-300">
                <ImageIcon size={20} />
              </button>

              <button type="button" onClick={() => videoInputRef.current?.click()} className="btn btn-circle btn-sm btn-ghost hover:text-primary hover:bg-base-300">
                <Film size={20} />
              </button>

              <button type="button" onClick={() => setShowGif(!showGif)} className={`btn btn-sm btn-ghost rounded-full font-bold text-xs hover:text-primary hover:bg-base-300 ${showGif ? "bg-base-300 text-primary" : ""}`}>
                GIF
              </button>

              <div className="w-[1px] h-6 bg-base-300 mx-1"></div>

              <button type="button" onClick={handleSendGameInvite} className="btn btn-circle btn-sm btn-ghost hover:scale-110 transition-transform text-lg">
                🏎️
              </button>

              {!isRecording ? (
                <button type="button" onClick={startRecording} className="btn btn-circle btn-sm btn-ghost hover:text-primary hover:bg-base-300">
                  <Mic size={20} />
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-error/10 px-3 py-1 rounded-full ml-1">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                  <span className="text-xs font-medium text-error min-w-[36px]">{formatTime(recordingDuration)}</span>
                  <button type="button" onClick={stopRecording} className="text-error hover:text-error/70 transition-colors">
                    <Square size={16} fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSending || (!text.trim() && !hasMedia && !hasAudio && !gif)}
          className="btn btn-primary btn-circle shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 mb-1"
        >
          {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
        </button>
      </form>

      {showGif && (
        <div className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden border border-base-300 animate-in slide-in-from-bottom-2 fade-in">
          <Gifpicker onSelect={(g) => { setGif(g); setShowGif(false); }} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;