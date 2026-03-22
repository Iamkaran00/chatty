import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { wallpapers } from "../assets/wallpaperfolder";
import { useWallpaperStore } from "../store/useWallpaper";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import toast from "react-hot-toast";
Navigate
const Wallpaper = () => {
  const { authUser } = useAuthStore();
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
//destructuring the functions and variable  from usewallpaper store
 const {wallpaper,setWallpaper} = useWallpaperStore();
 const navigate = useNavigate();
  const{selectedUser} = useChatStore();
  const handleSelect = (wp) => {
    setSelectedWallpaper(wp);
    setWallpaper({src : wp,id : selectedUser._id});
     toast.success('background applied');
     navigate('/')
  };
 
  return (
    <div className="min-h-screen bg-base-200 p-6 flex flex-col items-center space-y-8  pt-30">
      
      <h2 className="text-3xl font-semibold  text-center">
        Choose Your Favorite 💗 Wallpaper
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full max-w-6xl">
        {wallpapers.map((src, i) => (
          <div
            key={i}
            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105
              ${selectedWallpaper === src ? "ring-2 ring-blue-300" : "hover:scale-105 hover:shadow-lg"}
            `}
            onClick={() => handleSelect(src)}
          >
            <img
              src={src}
              alt={`Wallpaper ${i}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-20 transition-opacity rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Preview of selected wallpaper */}
      {selectedWallpaper && (
        <div className="w-full max-w-4xl h-150 rounded-lg overflow-hidden mt-6">
          <p className="text-white font-semibold mb-2">Preview:</p>
          <div
            className="w-full h-full rounded-lg bg-center bg-cover border"
            style={{ backgroundImage: `url(${selectedWallpaper})` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Wallpaper;
