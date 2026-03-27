import { Wallpaper, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import img from "../assets/smartboy.jpg"
 
const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();
  const {authUser} = useAuthStore();
   if(selectedUser._id == authUser._id ) return;
  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex-1 flex items-center justify-between ">
        <div className="flex-1 flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || img} alt={selectedUser.fullName} className="relative" />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className=" text-base-content/70 text-1xl ">
              {onlineUsers.includes(selectedUser._id) ? "online" : "offline"}
            </p>
          </div>
        </div> 
        <div className="flex gap-4">
          <button onClick = {()=>{navigate('/showwallpaper')} } className="cursor-pointer tooltip tooltip-left bg-base-200 p-2 hover:bg-base-300 hover-transition-colors rounded-2xl " data-tip = "set Background">{<Wallpaper/>}</button>
          <button onClick = {() => navigate('/whiteboard-invite')} className="bg-base-200 p-2 rounded-2xl tooltip tooltip-bottom" data-tip = 'enter whiteboard'>🎨</button>
        <button onClick={() => setSelectedUser(null)} className="hover:transform hover:bg-amber-100  hover:text-amber-800 hover:transition-all hover:rounded-full cursor-pointer">
          <X />
        </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;