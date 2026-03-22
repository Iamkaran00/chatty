import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Mic, Send, Square, Image as ImageIcon, Film, X } from "lucide-react";
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
const {setIsGameActive} = useChatStore();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const [showGif, setShowGif] = useState(false);

  // IMAGE

  const handleImageChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => setImagePreview(reader.result);
  };

  // VIDEO

  const handleVideoChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      return toast.error("Please select a video file");
    }

    if (file.size > 10 * 1024 * 1024) {
      return toast.error("Video must be less than 10MB");
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => setVideoPreview(reader.result);
  };

  const removeMedia = () => {

    setImagePreview(null);
    setVideoPreview(null);

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // AUDIO RECORDING

  const startRecording = async () => {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {

        if (audioChunksRef.current.length === 0) {
          toast.error("Audio recording failed");
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start(200);

      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {

      console.error(error);
      toast.error("Microphone permission denied");

    }
  };

  const stopRecording = () => {

    if (mediaRecorderRef.current && isRecording) {

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelAudio = () => {

    setAudioPreview(null);
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const blobToBase64 = (blob) => {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.readAsDataURL(blob);

      reader.onloadend = () => resolve(reader.result);

      reader.onerror = reject;
    });
  };

  // SEND MESSAGE

  const handleSendMessage = async (e) => {

    e?.preventDefault();

    if (isSending) return;

    if (!text.trim() && !imagePreview && !videoPreview && !audioBlob && !gif)
      return;

    try {

      setIsSending(true);

      let audioBase64 = null;

      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
      }

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        video: videoPreview,
        audio: audioBase64,
        gif: gif
      });

      setText("");
      removeMedia();
      cancelAudio();
      setGif(null);

    } catch (error) {

      console.error("Send message error:", error);

    } finally {

      setIsSending(false);

    }
  };

  useEffect(() => {

    return () => clearInterval(timerIntervalRef.current);

  }, []);

  const formatTime = (seconds) => {

    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");

    return `${m}:${s}`;
  };

  const hasMediaStaged = imagePreview || videoPreview || gif;
  const hasAudioStaged = audioPreview;
  const socket = useAuthStore.getState().socket
 const selectedUser = useChatStore.getState().selectedUser;
 const authUser = useAuthStore.getState().authUser;
 const navigate = useNavigate();
 

useEffect(() => {

  if (!socket) return;

  socket.on("raceCreated", ({ roomId }) => {
    navigate(`/race/${roomId}`);
  });

  return () => {
    socket.off("raceCreated");
  };

}, [socket]);
const handleSendGameInvite = () => {

  if (!socket || !selectedUser || !authUser) return;

  socket.emit("sendGameInvite", {
    senderId: authUser._id,
    receiverId: selectedUser._id
  });

  toast.success("Race Created 🏎️ Waiting for opponent...");

};
  return (

    <div className="p-4 bg-base-100 border-t border-base-300 w-full">

      {/* MEDIA PREVIEW */}

      {hasMediaStaged && (
        <div className="mb-4 flex items-center gap-2">

          <div className="relative bg-base-200 p-3 rounded-xl border border-base-300">

            {imagePreview && (
              <img src={imagePreview} className="h-24 rounded-lg"/>
            )}

            {videoPreview && (
              <video src={videoPreview} controls className="h-24 rounded-lg"/>
            )}

            {gif && (
              <img src={gif} className="h-24 rounded-lg"/>
            )}

            <button
              onClick={() => {
                removeMedia();
                setGif(null);
              }}
              className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error"
            >
              <X size={14}/>
            </button>

          </div>

        </div>
      )}

      {/* AUDIO PREVIEW */}

      {hasAudioStaged && (
        <div className="mb-3 flex items-center gap-3 bg-base-200 px-4 py-2 rounded-full border">

          <span className="text-red-500 animate-pulse">●</span>

          <audio src={audioPreview} controls className="flex-1"/>

          <button
            onClick={cancelAudio}
            className="btn btn-circle btn-sm btn-error"
          >
            <X size={14}/>
          </button>

        </div>
      )}

      {/* INPUT */}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">

        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageChange}
          hidden
        />

        <input
          type="file"
          accept="video/*"
          ref={videoInputRef}
          onChange={handleVideoChange}
          hidden
        />

        <div className="flex-1 flex items-center bg-base-200 rounded-full pr-2">

          <input
            type="text"
            placeholder="Type a message..."
            className="input input-ghost flex-1"
            value={text}
            onChange={(e)=>setText(e.target.value)}
            disabled={hasMediaStaged || hasAudioStaged}
          />

          {!hasMediaStaged && !hasAudioStaged && (
            <div className="flex gap-1">

              <button
                type="button"
                onClick={()=>imageInputRef.current.click()}
                className="btn btn-circle btn-sm btn-ghost"
              >
                <ImageIcon size={20}/>
              </button>

              <button
                type="button"
                onClick={()=>videoInputRef.current.click()}
                className="btn btn-circle btn-sm btn-ghost"
              >
                <Film size={20}/>
              </button>

              <button
                type="button"
                onClick={()=>setShowGif(!showGif)}
                className="btn btn-circle btn-sm btn-ghost text-xs font-bold"
              >
                GIF
              </button>
 <div className="tooltip tooltip-top" data-tip = 'challenge to a Race'>
<button type = 'button' onClick={handleSendGameInvite} className="btn btn-circle btn-sm btn-ghost text-lg">🏎️</button>

</div>



              {showGif && (
                <Gifpicker
                  onSelect={(gifUrl)=>{
                    setGif(gifUrl);
                    setShowGif(false);
                  }}
                />
              )}

            </div>
          )}

        </div>

        <button
          type="submit"
          disabled={isSending || (!text.trim() && !hasMediaStaged && !hasAudioStaged)}
          className="btn btn-circle btn-primary"
        >

          {isSending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Send size={18}/>
          )}

        </button>

      </form>

    </div>
  );
};

export default MessageInput;