import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {io} from 'socket.io-client'
import { useNavigate } from "react-router-dom";
const backend_url = 'https://chatty-0yi1.onrender.com';
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
   set({ authUser: { ...currentUser, profilePic: res.data?.profilePic || currentUser.profilePic } });
 } catch (error) {
   console.log("error in update the profile",error);
   toast.error(error.response?.data?.message || "Profile update failed");
 } finally{
   set({isUpdatingProfile : false});
 }
  },

  connectSocket : async ()=>{
    const {authUser} = get();
    if(authUser == null || get().socket?.connected) return ;
    const socket = io(backend_url,   {
      query:{
      userId : authUser._id,
        },
      
    });
  socket.connect();
      set({socket:socket});
   
    socket.on("getOnlineUsers",(userIds)=>{
  set({onlineUsers : userIds})
    })
  },
    disconnectSocket : async ()=>{
    
  if(get().socket?.connected) get().socket?.disconnect();
    
  },
}));
