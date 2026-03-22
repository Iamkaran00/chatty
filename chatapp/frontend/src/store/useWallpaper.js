import {create} from "zustand";
export const useWallpaperStore = create(set=>(
    {   wallpaper : JSON.parse((localStorage.getItem('wallpaperdata')))||"",
        setWallpaper : ({src,id}) => {
        localStorage.setItem('wallpaperdata',JSON.stringify({src,id}));
        set({wallpaper:{src,id}});
        }
    }
))