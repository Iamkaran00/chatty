import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CreateGroupModal from "./CreateGroupModal";

const STYLES = `
  .nav-root {
    background: rgba(14,15,20,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .nav-link {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 500; color: #B8B8CC;
    transition: background 0.15s, color 0.15s;
  }
  .nav-link:hover { background: rgba(255,255,255,0.06); color: #E2E2EE; }
  .nav-link.danger:hover { background: rgba(239,68,68,0.12); color: #F87171; }
  .nav-icon-btn {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #B8B8CC; background: transparent; border: none; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .nav-icon-btn:hover { background: rgba(255,255,255,0.06); color: #E2E2EE; }
`;

export const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="nav-root fixed w-full top-0 z-40" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{STYLES}</style>
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div
              className="size-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#5B6AF5 0%,#8B5CF6 100%)" }}
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold" style={{ color: "#E2E2EE" }}>Chatty</h1>
          </Link>

          <div className="flex items-center gap-1">
            <Link to="/settings" className="nav-link">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <button
                className="nav-icon-btn"
                onClick={() => setShowGroupModal(true)}
                title="Create a group"
              >
                {/* Fixed: was <User /> (single), should be <Users /> for "create group" */}
                <Users className="size-5" />
              </button>
            )}
            {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} />}

            {authUser && (
              <>
                <Link to="/profile" className="nav-link">
                  <User className="size-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <button
                  className="nav-link danger"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};