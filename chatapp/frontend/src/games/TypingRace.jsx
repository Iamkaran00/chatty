import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import RaceTrack from "./RaceTrack";

const TypingRace = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, authUser } = useAuthStore();
  const userId = authUser?._id;

  const [sentence, setSentence] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [status, setStatus] = useState("waiting");
  const [countdown, setCountdown] = useState(3);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [stats, setStats] = useState(null);

  const startTimeRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket || !userId) return;

    socket.emit("joinRaceRoom", { roomId, userId });

    socket.on("raceReady", ({ sentence, players: playerIds }) => {
      setSentence(sentence);
      setPlayers(playerIds.map((id) => ({ id, progress: 0 })));
      setInputVal("");
      setStatus("countdown");
      setWinner(null);
      setStats(null);
    });

    socket.on("countdown", (count) => setCountdown(count));

    socket.on("raceStart", () => {
      setStatus("playing");
      startTimeRef.current = Date.now();

      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    });

    socket.on("raceUpdate", ({ userId: updatedUserId, progress }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === updatedUserId ? { ...p, progress } : p
        )
      );
    });

    socket.on("raceFinish", ({ winnerId }) => {
      setStatus("finished");
      setWinner(winnerId);
    });

    socket.on("opponentLeft", () => {
      setStatus("finished");
      setWinner(null);
      alert("Opponent left the race 🏁");
      navigate("/");
    });

    return () => {
      socket.off("raceReady");
      socket.off("countdown");
      socket.off("raceStart");
      socket.off("raceUpdate");
      socket.off("raceFinish");
      socket.off("opponentLeft");
    };
  }, [socket, roomId, userId]);

  const handleInputChange = (e) => {
    if (status !== "playing") return;

    const typed = e.target.value;
    if (typed.length < inputVal.length) return;

    const currentIndex = inputVal.length;
    const expectedChar = sentence[currentIndex];

    if (typed[currentIndex] === expectedChar) {
      const newProgress = typed.length / sentence.length;
      setInputVal(typed);

      socket.emit("typingProgress", {
        roomId,
        userId,
        progress: newProgress,
      });

      if (newProgress >= 1) {
        const timeTakenMinutes =
          (Date.now() - startTimeRef.current) / 60000;

        const wpm = Math.round((typed.length / 5) / timeTakenMinutes);

        setStats({
          wpm,
          time: Math.round(timeTakenMinutes * 60),
        });
      }
    }
  };

  const handleRematch = () => {
    socket.emit("rematchRequest", { roomId, userId });
    setStatus("waiting");
  };

  const renderText = () => {
    return sentence.split("").map((char, index) => {
      let styles =
        "text-base-content/30 font-medium transition-all duration-150";

      if (index < inputVal.length) {
        styles = "text-success font-bold";
      } else if (index === inputVal.length && status === "playing") {
        styles =
          "text-primary bg-primary/10 border-b-4 border-primary animate-pulse pb-1 font-extrabold";
      }

      return (
        <span
          key={index}
          className={`font-mono text-2xl md:text-3xl leading-loose tracking-wide ${styles}`}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-base-300 flex flex-col px-4 py-3 md:px-6 md:py-4">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-base-100/80 backdrop-blur-md rounded-xl shadow-lg border border-base-content/10 px-4 py-2 mb-3 m-14">
        <h2 className="text-xl md:text-2xl font-black italic flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          <span className="text-2xl not-italic">🏎️</span> NITRO RACE
        </h2>

        <button
          className="btn btn-outline btn-error btn-xs rounded-full font-bold"
          onClick={() => {
            socket.emit("leaveRace", { roomId, userId });
            navigate("/");
          }}
        >
          Leave Match
        </button>
      </div>

      <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-3">

        {/* RACE TRACK */}
        <div className="w-full bg-base-100/60 backdrop-blur-sm rounded-2xl shadow-lg border border-base-content/5 p-4">
          <RaceTrack players={players} currentUserId={userId} />
        </div>

        {/* STATUS (only takes space when needed) */}
        {(status === "waiting" || status === "countdown") && (
          <div className="flex items-center justify-center py-2">

            {status === "waiting" && (
              <div className="flex flex-col items-center gap-2">
                <span className="loading loading-ring loading-md text-primary"></span>
                <div className="text-lg font-semibold text-base-content/60 uppercase">
                  Awaiting Challenger...
                </div>
              </div>
            )}

            {status === "countdown" && (
              <span className="countdown font-mono text-7xl text-primary animate-pulse">
                <span style={{ "--value": countdown > 0 ? countdown : 0 }}></span>
              </span>
            )}

          </div>
        )}

        {/* TYPING AREA */}
        <div className="card w-full bg-base-100/80 backdrop-blur-xl shadow-xl border border-primary/20 rounded-2xl overflow-hidden">

          <div className="card-body p-5 md:p-6 items-center text-center gap-4">

            <div className="w-full p-4 bg-base-200/50 rounded-xl shadow-inner border border-base-300 select-none">
              {renderText()}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              disabled={status !== "playing"}
              className={`input input-bordered h-11 w-full max-w-xl font-mono text-lg text-center shadow-inner rounded-xl
                ${
                  status === "playing"
                    ? "input-primary focus:ring-4 ring-primary/40"
                    : "bg-base-200/50 opacity-50 cursor-not-allowed"
                }`}
              placeholder={
                status === "waiting"
                  ? "Engines idling..."
                  : status === "countdown"
                  ? "Revving up..."
                  : "TYPE TO ACCELERATE!"
              }
              onPaste={(e) => e.preventDefault()}
              autoComplete="off"
              spellCheck="false"
            />

          </div>
        </div>

      </div>

      {/* FINISH MODAL */}
      {status === "finished" && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50">

          <div
            className={`p-8 rounded-2xl shadow-2xl border-2 flex flex-col items-center gap-4 w-full max-w-lg
            ${
              winner === userId
                ? "bg-success/10 border-success/50"
                : "bg-error/10 border-error/50"
            }`}
          >
            <h3
              className={`text-4xl font-black ${
                winner === userId ? "text-success" : "text-error"
              }`}
            >
              {winner === userId ? "🏆 DOMINATION!" : "💀 WIPEOUT!"}
            </h3>

            {stats && (
              <div className="flex gap-5 mt-3">

                <div className="flex flex-col items-center bg-base-100 px-5 py-2 rounded-xl">
                  <span className="text-xs uppercase font-bold text-base-content/50">
                    Speed
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {stats.wpm} WPM
                  </span>
                </div>

                <div className="flex flex-col items-center bg-base-100 px-5 py-2 rounded-xl">
                  <span className="text-xs uppercase font-bold text-base-content/50">
                    Time
                  </span>
                  <span className="text-2xl font-black text-secondary">
                    {stats.time} SEC
                  </span>
                </div>

              </div>
            )}

            <button
              onClick={handleRematch}
              className={`btn btn-md w-full mt-3 rounded-xl text-md font-bold
              ${winner === userId ? "btn-success" : "btn-error"}`}
            >
              REQUEST REMATCH 🔄
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default TypingRace;