import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { socket } from "../socket"
import IntelligencePanel from "../components/IntelligencePanel"
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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

    const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const [notification, setNotification] = useState("");

    useEffect(() => {
        if (location.state?.successMessage) {
            setNotification(location.state.successMessage);
            
            navigate(location.pathname, { replace: true, state: {} });

            setTimeout(() => {
                setNotification("");
            }, 4000);
        }
    }, [location.state, navigate]);

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

                    if (isCurrentlyViewing) {
                        socket.emit("markAsRead", { roomId: msg.roomId, userId: user.id });
                    }

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

        const handleRoleUpdate = (data) => {
            const {userId, newRole} = data;
            console.log(activeRoom);

            setActiveRoom((prevRoom) => {
                if(!prevRoom || !prevRoom.participants) return prevRoom;

                return {
                    ...prevRoom,
                    participants: prevRoom.participants.map((participant) => 
                        participant.userId === userId
                        ? {...participant, role: newRole}
                        : participant
                    )
                };
            });
        };

        const handleGroupNameUpdate = (data) => {
            const { roomId, subject } = data;

            setActiveRoom((prevRoom) => {
                if(prevRoom && String(prevRoom.id) === String(roomId)) {
                    return {...prevRoom, subject: subject}
                }

                return prevRoom;
            });

            // Update sidebar 
            setRooms((prevRooms) => prevRooms.map(room => 
                String(room.id) === String(roomId) ? { ...room, subject: subject } : room
            ));
        };

        const handleGroupAvatarUpdate = (data) => {
            const { roomId, avatar } = data;

            setActiveRoom((prevRoom) => {
                if (prevRoom && String(prevRoom.id) === String(roomId)) {
                    return { ...prevRoom, avatar: avatar };
                }
                return prevRoom;
            });

            setRooms((prevRooms) => prevRooms.map(room => 
                String(room.id) === String(roomId) ? { ...room, avatar: avatar } : room
            ));
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
        socket.on("roleUpdated", handleRoleUpdate);
        socket.on("groupNameUpdated", handleGroupNameUpdate);
        socket.on("groupAvatarUpdated", handleGroupAvatarUpdate);

        return () => {
            socket.off("connect", handleSetup);
            socket.off("receiveMessage", handleGlobalMessage);
            socket.off("addedToGroup", handleAddedToGroup);
            socket.off("kickedFromGroup", handleKickedFromGroup);
            socket.off("participantRemoved", handleParticipantRemoved);
            socket.off("userProfileUpdated", handleUserProfileUpdated);
            socket.off("getOnlineUsers", handleGetOnlineUsers);
            socket.off("userStatusChanged", handleUserStatusChanged);
            socket.off("roleUpdated", handleRoleUpdate);
            socket.off("groupNameUpdated", handleGroupNameUpdate);
            socket.off("groupAvatarUpdated", handleGroupAvatarUpdate);
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

                const res = await fetch(`${API_URL}/api/getRooms`, {
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
        setIsIntelligenceOpen(false);

        setRooms(prevRooms => 
            prevRooms.map(r => r.id === room.id ? {...r, unreadCount: 0} : r)
        );

        if (room.unreadCount > 0) {
            socket.emit("markAsRead", { roomId: room.id, userId: user.id });
        }
    }

    return (
        <main className="w-full h-[100dvh] overflow-hidden flex bg-[#0f0f0f] text-white font-sans relative">

            {/* Toast Notification  */}
            <div 
                className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-start sm:items-center gap-3 w-[90vw] sm:w-max max-w-md bg-[#ffab00]/15 border border-[#ffab00]/30 backdrop-blur-md text-[#ffab00] px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(255,171,0,0.15)] transition-all duration-300 ease-out
                ${notification 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-6 pointer-events-none' 
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 sm:mt-0">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                
                <span className="text-[14px] font-semibold tracking-wide leading-snug break-words">
                    {notification}
                </span>
            </div>
            
            {/* LEFT: Chat Sidebar  */}
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
            
            {/* MIDDLE: Chat Area */}
            <section className={`flex-col flex-1 min-w-0 border-l border-[#2c2c2f] ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
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
                            isIntelligenceOpen={isIntelligenceOpen}
                            setIsIntelligenceOpen={setIsIntelligenceOpen}
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

            {/* RIGHT: AI Intelligence Panel */}
            <IntelligencePanel 
                isOpen={isIntelligenceOpen} 
                onClose={() => setIsIntelligenceOpen(false)}
                roomId={activeRoom?.id}
            />
            
        </main>
    )
}