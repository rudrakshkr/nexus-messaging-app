import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"
import { useState, useEffect } from "react"

export default function ChatPage({user, setUser}) {
    const token = localStorage.getItem("jwtToken");
    const [activeRoom, setActiveRoom] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch(`/api/getRooms`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                })

                if(!res.ok) throw new Error("Failed to fetch rooms.");
                const data = await res.json();
                setRooms(data.rooms);
            } catch(err) {
                console.error("Fetch error: ", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRooms();
    }, [token]);

    return (
        <main className="w-full h-screen overflow-hidden flex bg-[#0f0f0f] text-white font-sans">
            {/* Chat Sidebar  */}
            <Sidebar 
                user={user} 
                setUser={setUser} 
                onSelectRoom={setActiveRoom}
                activeRoom={activeRoom} 
                rooms={rooms}
                setRooms={setRooms}
            />
            
            <section className="flex flex-col flex-[5] border-l border-[#2c2c2f]">
                {activeRoom ? (
                    <>
                        {/* CHAT HEADER  */}
                        <ChatHeader 
                            user={user}
                            activeRoom={activeRoom}
                            setIsDrawerOpen={setIsDrawerOpen}
                        />
                        
                        {/* Chat Messages */}
                        <ChatMessages
                            user={user} 
                            setActiveRoom={setActiveRoom}
                            activeRoom={activeRoom}
                            roomId={activeRoom.id}
                            isDrawerOpen={isDrawerOpen}
                            setIsDrawerOpen={setIsDrawerOpen}
                            setRooms={setRooms} // Pass the global setter down
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