import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"
import { useState } from "react"

export default function ChatPage({user, setUser}) {
    const [activeRoom, setActiveRoom] = useState(null);

    return (
        <main className="w-full h-screen overflow-hidden flex bg-[#0f0f0f] text-white font-sans">
            {/* Chat Sidebar  */}
            <Sidebar 
                user={user} 
                setUser={setUser} 
                onSelectRoom={setActiveRoom}
                activeRoom={activeRoom} 
            />
            {/* Chat section  */}
            <section className="flex flex-col flex-[5] border-l border-[#2c2c2f]">
                {activeRoom ? (
                    <>
                        {/* CHAT HEADER  */}
                        <ChatHeader 
                            user={user}
                            activeRoom={activeRoom}
                        />
                        
                        {/* Chat Messages */}
                        <ChatMessages
                            user={user} 
                            activeRoom={activeRoom}
                            roomId={activeRoom.id}
                        />
                    </>
                ): (
                    <div className="flex-1 flex items-center justify-center text-[#8f8f96]">
                        Select a conversation to start chatting
                    </div>
                )}
            </section>
        </main>
    )
}