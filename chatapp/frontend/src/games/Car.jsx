import React from "react";

const Car = ({ name, progress, isCurrentPlayer, carEmoji }) => {
  // Calculates position between 0 and 100
  const position = Math.min(Math.max(progress * 100, 0), 100);

  return (
    <div className="relative w-full h-16 border-b-2 border-dashed border-gray-400 mb-6 flex items-end">
      
      {/* THE UPGRADE: 
        Changed "120ms linear" to "400ms ease-out". 
        This makes the car accelerate and smoothly brake into its new position 
        instead of teleporting rigidly.
      */}
      <div
        className="absolute bottom-1 flex flex-col items-center z-10"
        style={{
          left: `${position}%`,
          transform: "translateX(-50%)",
          transition: "left 400ms cubic-bezier(0.25, 1, 0.5, 1)" 
        }}
      >

        {/* Player Name */}
        <span 
          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm mb-1 ${
            isCurrentPlayer ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          {name}
        </span>

        <div className="relative flex items-center justify-center">
          
          {/* Exhaust Flame: Only shows up when the car is off the starting line */}
          {position > 0 && position < 100 && (
            <span className="absolute -left-5 bottom-0 text-xl opacity-80 animate-pulse">
              💨
            </span>
          )}

          {/* THE FIX: 
            Added `transform scale-x-[-1]` to mirror the emoji so it faces right.
            Separated it from the parent div so it doesn't conflict with your inline translateX.
          */}
          <span className="text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] transform scale-x-[-1]">
            {carEmoji}
          </span>
          
        </div>

      </div>

    </div>
  );
};

export default Car;