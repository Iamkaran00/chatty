import { Wallpaper, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import img from "../assets/smartboy.jpg";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const navigate = useNavigate();

  if (selectedUser._id === authUser._id) return null;

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full">
              <img
                src={selectedUser.profilePic || img}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-base-content">
              {selectedUser.fullName}
            </h3>
            <p className="text-sm text-base-content/60">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/showwallpaper")}
            className="btn btn-ghost btn-sm btn-circle tooltip tooltip-left"
            data-tip="Set Background"
          >
            <Wallpaper className="size-5" />
          </button>

          <button
            onClick={() => navigate("/whiteboard-invite")}
            className="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom"
            data-tip="Enter Whiteboard"
          >
            🎨
          </button>

          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
