import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"
import { useState, useEffect } from "react"
import { socket } from "../socket"

export default function ChatPage({user, setUser}) {
    const token = localStorage.getItem("jwtToken");
    const [activeRoom, setActiveRoom] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return;

        const handleSetup = () => socket.emit("setup", user.id);
        if (socket.connected) handleSetup();
        socket.on("connect", handleSetup);

        const handleGlobalMessage = (msg) => {
            setRooms(prevRooms => {
                const roomIndex = prevRooms.findIndex(room => String(room.id) === String(msg.roomId));

                if (roomIndex !== -1) {
                    const isCurrentlyViewing = activeRoom && String(activeRoom.id) === String(msg.roomId);
                    
                    const updatedRoom = {
                        ...prevRooms[roomIndex],
                        unreadCount: !isCurrentlyViewing ? (prevRooms[roomIndex].unreadCount || 0) + 1 : 0,
                        messages: [msg]
                    };

                    const newRooms = [...prevRooms];
                    
                    newRooms.splice(roomIndex, 1);
                    newRooms.unshift(updatedRoom);

                    return newRooms;
                }
                
                return prevRooms;
            });
        };

        const handleAddedToGroup = (data) => {
            socket.emit("joinRoom", data.roomId);
            
            setRooms((prevRooms) => {
                const exists = prevRooms.find(r => String(r.id) === String(data.roomData.id));
                if (!exists) return [data.roomData, ...prevRooms];
                return prevRooms;
            });
        };

        const handleKickedFromGroup = (data) => {
            setRooms((prevRooms) => prevRooms.filter(r => String(r.id) !== String(data.roomId)));
            
            setActiveRoom(prevActive => {
                if (prevActive && String(prevActive.id) === String(data.roomId)) {
                    setIsDrawerOpen(false);
                    return null;
                }
                return prevActive;
            });
        };

        socket.on("receiveMessage", handleGlobalMessage);
        socket.on("addedToGroup", handleAddedToGroup);
        socket.on("kickedFromGroup", handleKickedFromGroup);

        return () => {
            socket.off("connect", handleSetup);
            socket.off("receiveMessage", handleGlobalMessage);
            socket.off("addedToGroup", handleAddedToGroup);
            socket.off("kickedFromGroup", handleKickedFromGroup);
        };
    }, [user, setRooms, activeRoom]);

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

    const handleRoomSelect = (room) => {
        setActiveRoom(room);

        setRooms(prevRooms => 
            prevRooms.map(r => r.id === room.id ? {...r, unreadCount: 0} : r)
        );

        if (room.unreadCount > 0) {
            fetch('/api/markRoomRead', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roomId: room.id })
            }).catch(err => console.error("Failed to mark as read:", err));
        }
    }

    return (
        <main className="w-full h-screen overflow-hidden flex bg-[#0f0f0f] text-white font-sans">
            {/* Chat Sidebar  */}
            <Sidebar 
                user={user} 
                setUser={setUser} 
                onSelectRoom={handleRoomSelect}
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
                            setRooms={setRooms}
                            onSelectRoom={setActiveRoom}
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