import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"
import { useState, useEffect } from "react"
import { socket } from "../socket"

let globalRoomsCache = null;

export default function ChatPage({user, setUser}) {
    const token = localStorage.getItem("jwtToken");
    const [activeRoom, setActiveRoom] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTrigger, setSearchTrigger] = useState(0);

    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if(rooms.length > 0) {
            globalRoomsCache = rooms;
        }
    }, [rooms]);

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
                if (!exists) {
                    const newRoom = {
                        ...data.roomData,
                        messages: data.message ? [data.message] : data.roomData.messages || []
                    }

                    return [newRoom, ...prevRooms]
                }
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

        const handleParticipantRemoved = (data) => {
            setRooms(prevRooms => prevRooms.map(room => {
                if (String(room.id) === String(data.roomId)) {
                    return {
                        ...room,
                        participants: room.participants?.filter(p => String(p.user.id) !== String(data.userId))
                    };
                }
                return room;
            }));

            setActiveRoom(prevActive => {
                if (prevActive && String(prevActive.id) === String(data.roomId)) {
                    return {
                        ...prevActive,
                        participants: prevActive.participants?.filter(p => String(p.user.id) !== String(data.userId))
                    };
                }
                return prevActive;
            });
        };

        const handleUserProfileUpdated = (updatedUser) => {
            setRooms(prevRooms => prevRooms.map(room => {
                const hasUser = room.participants?.some(p => String(p.user.id) === String(updatedUser.id));
                if (!hasUser) return room;

                return {
                    ...room,
                    participants: room.participants.map(p => 
                        String(p.user.id) === String(updatedUser.id) 
                            ? { ...p, user: updatedUser }
                            : p
                    )
                };
            }));

            setActiveRoom(prevActive => {
                if (!prevActive) return prevActive;
                
                const hasUser = prevActive.participants?.some(p => String(p.user.id) === String(updatedUser.id));
                if (!hasUser) return prevActive;

                return {
                    ...prevActive,
                    participants: prevActive.participants.map(p => 
                        String(p.user.id) === String(updatedUser.id) 
                            ? { ...p, user: updatedUser } 
                            : p
                    )
                };
            });
        };

        const handleGetOnlineUsers = (userIds) => {
            setOnlineUsers(userIds);
        };

        const handleUserStatusChanged = ({ userId, isOnline }) => {
            setOnlineUsers(prev => {
                if (isOnline) {
                    return prev.includes(userId) ? prev : [...prev, userId];
                } else {
                    return prev.filter(id => id !== userId);
                }
            });
        };

        socket.on("receiveMessage", handleGlobalMessage);
        socket.on("addedToGroup", handleAddedToGroup);
        socket.on("kickedFromGroup", handleKickedFromGroup);
        socket.on("participantRemoved", handleParticipantRemoved);
        socket.on("userProfileUpdated", handleUserProfileUpdated);
        socket.on("getOnlineUsers", handleGetOnlineUsers);
        socket.on("userStatusChanged", handleUserStatusChanged);

        return () => {
            socket.off("connect", handleSetup);
            socket.off("receiveMessage", handleGlobalMessage);
            socket.off("addedToGroup", handleAddedToGroup);
            socket.off("kickedFromGroup", handleKickedFromGroup);
            socket.off("participantRemoved", handleParticipantRemoved);
            socket.off("userProfileUpdated", handleUserProfileUpdated);
            socket.off("getOnlineUsers", handleGetOnlineUsers);
            socket.off("userStatusChanged", handleUserStatusChanged);
        };
    }, [user, setRooms, activeRoom]);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                if (globalRoomsCache) {
                    setRooms(globalRoomsCache);
                    setIsLoading(false); 
                } else {
                    setIsLoading(true); 
                }

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
                globalRoomsCache = data.rooms
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
                isLoading={isLoading}
                onlineUsers={onlineUsers}
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
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setSearchTrigger={setSearchTrigger}
                            onlineUsers={onlineUsers}
                        />
                        
                        {/* Chat Messages */}
                        <ChatMessages
                            user={user} 
                            setActiveRoom={setActiveRoom}
                            activeRoom={activeRoom}
                            roomId={activeRoom.id}
                            isDrawerOpen={isDrawerOpen}
                            setIsDrawerOpen={setIsDrawerOpen}
                            setRooms={setRooms}
                            searchQuery={searchQuery}
                            searchTrigger={searchTrigger}
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