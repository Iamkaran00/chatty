import React from 'react'
import { useChatStore } from '../store/useChatStore'
import Sidebar from '../components/SideBar';
import NoChatSelected from '../components/NoChatSelected';
import ChatContainer from '../components/ChatContainer';
import { useGroupStore } from '../store/useGroupStore';
import GroupChatContainer from '../components/GroupContainer';
export const HomePage = () => {

  const {selectedUser} = useChatStore();
  const {selectedGroup} = useGroupStore();
  const showChat = !!selectedUser;
  const showGroup = !! selectedGroup;
  const showNothing = !showChat && !showGroup;
  return (
    <div className='h-screen bg-base-300'>
      <div className='flex items-center justify-center pt-20 px-4'>
        <div className='bg-base-100 rouned-lg shadow-lg shadow-cl w-full max-w-8xl h-[calc(100vh-6rem)]'>
          <div className='flex h-full rounded-lg overflow-hidden'>
            <Sidebar />
           {showNothing  && <NoChatSelected />}
          {showChat     && <ChatContainer />}
          {showGroup    && <GroupChatContainer />}
          </div>
        </div>
      </div>

    </div>
  )
}
