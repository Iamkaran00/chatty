import React, { useEffect, useState } from "react";
import Car from "./Car";

const RaceTrack = ({ players, currentUserId }) => {
  const [winner, setWinner] = useState(null);

  useEffect(() => {

    // detect winner
    const winningPlayer = players.find((p) => p.progress >= 1);

    if (winningPlayer) {
      setWinner(winningPlayer);
    }

    // reset winner when race resets
    const raceReset = players.every((p) => p.progress === 0);

    if (raceReset) {
      setWinner(null);
    }

  }, [players]);

  return (
    <div className="w-full my-6 relative rounded-2xl overflow-hidden shadow-xl border-4 border-slate-800 bg-slate-900 h-56 flex flex-col justify-center">

      {/* Road animation */}
      <style>
        {`
          @keyframes scroll-road {
            0% { background-position: 0 0; }
            100% { background-position: -200px 0; }
          }

          .animate-fast-road {
            background-image: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              rgba(255,255,255,0.4) 50px,
              rgba(255,255,255,0.4) 100px
            );
            background-size: 200px 4px;
            animation: scroll-road 0.4s linear infinite;
          }

          .finish-line {
            background-image:
              repeating-linear-gradient(45deg,#000 25%,transparent 25%,transparent 75%,#000 75%,#000),
              repeating-linear-gradient(45deg,#000 25%,#fff 25%,#fff 75%,#000 75%,#000);
            background-position: 0 0, 10px 10px;
            background-size: 20px 20px;
          }
        `}
      </style>

      {/* Asphalt */}
      <div className="absolute inset-0 bg-[#1a1c23] opacity-90"></div>

      {/* Moving center road */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 animate-fast-road z-0"></div>

      {/* Start line */}
      <div className="absolute inset-y-0 left-12 w-1 bg-green-500/80 z-10 shadow-[0_0_10px_#22c55e]"></div>

      {/* Finish line */}
      <div className="absolute inset-y-0 right-8 w-8 finish-line z-10 border-l-[3px] border-yellow-400"></div>

      {/* Labels */}
      <div className="absolute top-2 w-full flex justify-between px-6 z-20 text-xs font-black uppercase tracking-wider">
        <span className="text-green-400">Start</span>
        <span className="text-yellow-400 pr-8">Finish</span>
      </div>

      {/* Cars */}
      <div className="relative w-full px-12 z-20 flex flex-col gap-5">

        {players.length === 0 && (
          <div className="text-center text-gray-400">
            Waiting for racers...
          </div>
        )}

        {players.map((player, idx) => (
          <div
            key={player.id}
            className="relative w-full border-b border-white/10 pb-1"
          >
            <Car
              name={player.id === currentUserId ? "You" : "Opponent"}
              progress={player.progress}
              isCurrentPlayer={player.id === currentUserId}
              carEmoji={idx === 0 ? "🏎️" : "🚙"}
            />
          </div>
        ))}

      </div>

      {/* Winner overlay */}
      {winner && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30">

          <div className="text-5xl mb-2 animate-bounce">
            🏁
          </div>

          <h2 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">

            {winner.id === currentUserId ? "🏆 Victory!" : "Defeat"}

          </h2>

        </div>
      )}

    </div>
  );
};

export default RaceTrack;