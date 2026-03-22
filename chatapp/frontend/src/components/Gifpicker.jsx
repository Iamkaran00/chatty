import React, { useState } from "react";

const API_KEY = "Q8r3rm8BagTWNZoVZ8lJzP3M4bwES4xB";

const Gifpicker = ({ onSelect, onClose }) => {

  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchGif = async () => {

    if (!query.trim()) return;

    try {

      setLoading(true);

      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${query}&limit=30`
      );

      const data = await res.json();

      setGifs(data.data);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <div className="bg-base-100 w-[650px] max-h-[80vh] rounded-2xl shadow-xl p-5 flex flex-col">

        {/* Header */}

        <div className="flex justify-between items-center mb-3">

          <h2 className="text-lg font-bold">Search GIF</h2>

          <button
            onClick={onClose}
            className="btn btn-circle btn-sm"
          >
            ✕
          </button>

        </div>

        {/* Search */}

        <div className="flex gap-2 mb-3">

          <input
            type="text"
            placeholder="Search funny gifs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-bordered w-full"
          />

          <button
            onClick={searchGif}
            className={`btn btn-primary ${loading && "loading"}`}
          >
            Search
          </button>

        </div>

        {/* GIF GRID */}

        <div className="grid grid-cols-4 gap-3 overflow-y-auto">

          {gifs.map((gif) => (

            <img
              key={gif.id}
              src={gif.images.fixed_height.url}
              className="rounded-lg cursor-pointer hover:scale-105 transition"
              onClick={() => onSelect(gif.images.original.url)}
            />

          ))}

        </div>

      </div>

    </div>

  );
};

export default Gifpicker;