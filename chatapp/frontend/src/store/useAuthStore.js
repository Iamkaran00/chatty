import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {useGroupStore} from './useGroupStore';
import {io} from 'socket.io-client'
import { useNavigate } from "react-router-dom";
const backend_url = 'http://localhost:5001/api/v1';
export const useAuthStore = create((set,get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers : [],
  socket : null,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/checkUser");
      set({ authUser: res.data.user });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data.user });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      console.log("problem in signup", err.message);
    } finally {
      set({ isSigningUp: false });
    }
  },
  login : async(data)=>{
set({isLoggingIn:true});
try {
    const res = await axiosInstance.post('/auth/login',data);
    set({authUser : res.data.user});
    toast.success("Logged In Successfully");
  get().connectSocket();

} catch (error) {
    toast.error(error.message);
    console.log("An error occured in login");
} finally{
    set({isLoggingIn : false});
}
  },
  logout: async ()=>{
    try {
        await axiosInstance.post('/auth/logout');
        set({authUser:null});
        toast.success("User logged out");
        get().disconnectSocket();
        
    } catch (error) {
        console.log("An error Occured !!!");
    }
    
  },
  updateProfile : async(data)=>{
    console.log(data,'reading data in authstore');
 set({isUpdatingProfile : true});
 try {
   const res = await axiosInstance.put("/auth/update-profile",data);
   toast.success("profile updated successfully");
   const currentUser = get().authUser;
  set({ authUser: { ...currentUser, profilePic: res.data?.user?.profilePic || currentUser.profilePic } })
 } catch (error) {
   console.log("error in update the profile",error);
   toast.error(error.response?.data?.message || "Profile update failed");
 } finally{
   set({isUpdatingProfile : false});
 }
  },

connectSocket: () => {
  const { authUser } = get();
  if (!authUser || get().socket?.connected) return;

  const socket = io("http://localhost:5001", {
    query: { userId: authUser._id },
    transports: ["websocket"],   // skip long-polling probe entirely
    reconnectionDelay: 1000,
  });

  set({ socket });

  socket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });

  // Reconnect group listeners when socket reconnects
  socket.on("connect", () => {
    set({ onlineUsers: [] });
    // Re-run group event listeners after reconnect so events are not lost
    useGroupStore.getState().listenGroupEvents();
  });
},
    disconnectSocket : async ()=>{
    useGroupStore.getState().unlistenGroupEvents();
  if(get().socket?.connected) get().socket?.disconnect();
    
  },
}));
