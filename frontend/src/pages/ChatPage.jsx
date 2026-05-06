import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"
import { useState } from "react"

export default function ChatPage({user, setUser}) {
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <main className="w-full min-h-screen flex bg-[#0f0f0f] text-white font-sans">
            {/* Chat Sidebar  */}
            <Sidebar 
                user={user} 
                setUser={setUser} 
                onSelectUser={setSelectedUser}
                activeUser={selectedUser} 
            />
            {/* Chat section  */}
            <section className="flex flex-col flex-[5] border-l border-[#2c2c2f]">
                {selectedUser ? (
                    <>
                        {/* CHAT HEADER  */}
                        <ChatHeader activeUser={selectedUser}/>
                        
                        {/* Chat Messages */}
                        <ChatMessages receiver={selectedUser}/>
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