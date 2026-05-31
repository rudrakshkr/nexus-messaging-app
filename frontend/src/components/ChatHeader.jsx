import { useEffect, useRef, useState } from "react";
import NewChatModal from "./NewChatModal";
import ConfirmModal from "./ConfirmModal";

export default function ChatHeader({user, activeRoom, setIsDrawerOpen, setRooms, onSelectRoom, searchQuery, setSearchQuery, setSearchTrigger}) {
    const token = localStorage.getItem("jwtToken");
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef(null);
    
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const optionsMenuRef = useRef(null);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "",
        action: null
    });
    
    const closeConfirmModal = () => setConfirmConfig({ ...confirmConfig, isOpen: false });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setIsOptionsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if(isSearching && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearching]);

    const handleCloseSearch = () => {
        setIsSearching(false);
        setSearchQuery("");
    }

    const handleRoomCreated = (response) => {
        if(response.isNew) {
            setRooms((prevRooms) => [response.room, ...prevRooms]);
        } else {
            setRooms((prevRooms) => prevRooms.map(r => 
                String(r.id) === String(response.room.id) ? response.room : r
            ));
        }

        onSelectRoom(response.room);
    }

    const handleLeaveRoom = async () => {
        setIsOptionsMenuOpen(true);

        setConfirmConfig({
            isOpen: true,
            title: isGroup ? "Leave Group" : "Delete Chat",
            message: isGroup 
                ? "Are you sure you want to leave this group? You will no longer receive messages from these participants." 
                : "Are you sure you want to permanently delete this conversation from your inbox?",
            confirmText: isGroup ? "Leave Group" : "Delete Chat",
            action: async () => {
                try {
                    const res = await fetch('/api/leaveRoom', {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ roomId: activeRoom.id })
                    });
                    if (!res.ok) console.error("Failed to leave room");
                } catch(err) {
                    console.error("Network error while leaving room:", err);
                }
            }
        });
    }

    const handleDeleteRoom = () => {
        setIsOptionsMenuOpen(false);
        
        setConfirmConfig({
            isOpen: true,
            title: "Delete Group",
            message: "Are you sure you want to permanently delete this group? This will erase the chat for EVERYONE and cannot be undone.",
            confirmText: "Delete Everywhere",
            action: async () => {
                try {
                    const res = await fetch('/api/deleteRoom', {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ roomId: activeRoom.id })
                    });
                    if (!res.ok) console.error("Failed to delete room");
                } catch(err) {
                    console.error("Network error while deleting room:", err);
                }
            }
        });
    }

    const getAvatarColor = (name) => {
        if(!name) return 'bg-[#8444f6]';

        const colors = [
            'bg-[#ff5630]', 'bg-[#36b37e]', 'bg-[#00b8d9]', 
            'bg-[#ffab00]', 'bg-[#0052cc]', 'bg-[#e34935]',
            'bg-[#17a2b8]', 'bg-[#e83e8c]', 'bg-[#f6c23e]'
        ];

        let hash = 0;
        for(let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }

    if(!activeRoom) return null;

    const isGroup = activeRoom.type === 'GROUP';

    const myParticipantData = activeRoom.participants?.find(p => p.user.email === user.email);
    const iAmAdmin = myParticipantData?.role === 'ADMIN';

    const otherParticipant = !isGroup
        ? activeRoom.participants?.find(p => p.user.email !== user.email)?.user
        : null;

    const displayName = isGroup ? activeRoom.subject : otherParticipant?.fullname;
    const displayAvatar = isGroup ? activeRoom.avatar : otherParticipant?.avatar;
    
    const subtitle = isGroup
        ? `${activeRoom.participants?.length} members`
        : "Active now";

    return (
        <section className="w-full flex items-center justify-between px-6 py-4 border-b border-[#2c2c2f] bg-[#0a0a0a]">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => {
                if(activeRoom.type === 'GROUP') {
                    setIsDrawerOpen(true);
                }
            }}>
                <div className="relative flex-shrink-0">
                    {!displayAvatar ? (
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[17px] shadow-inner ${getAvatarColor(displayName)}`}>
                            {displayName ? displayName.charAt(0).toUpperCase() : '#'}
                        </div>
                    ) : (
                        <img 
                            src={displayAvatar} 
                            alt={displayName} 
                            className="w-11 h-11 rounded-full object-cover"
                        />
                    )}

                    {!isGroup && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d97e] border-2 border-[#161618] rounded-full"></span>
                    )}
                    
                </div>
                
                <div className="flex flex-col">
                    <h2 className="text-[15px] font-semibold text-[#e1e1e3]">{displayName}</h2>
                    <p className="text-[13px] font-medium text-[#8f8f96] mt-0.5">{subtitle}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-5 text-[#8f8f96]">
                {isSearching ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <input 
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setSearchTrigger(0)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setSearchTrigger(prev => prev + 1);
                                }
                            }}
                            placeholder="Search in chat..."
                            className="w-[150px] sm:w-[220px] bg-[#161618] border border-[#2c2c2f] rounded-lg px-3 py-1.5 text-[#e1e1e3] text-[13px] outline-none focus:border-[#8444f6] transition-colors"
                        />

                        <button 
                            className="bg-[#8444f6] hover:bg-[#7133d4] text-white text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            onClick={() => setSearchTrigger(prev => prev + 1)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <span className="hidden sm:inline">Search</span>
                        </button>
                        
                        <button 
                            onClick={handleCloseSearch}
                            className="text-[#8f8f96] hover:text-[#e1e1e3] text-[13px] font-medium transition-colors px-1"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <>
                        {isGroup && (
                            <button 
                                className="text-[#8e8e95] hover:text-[#e1e1e3] transition-colors" title="Add members"
                                onClick={() => setIsNewChatModalOpen(true)}
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                >
                                    <g id="SVGRepo_iconCarrier"> 
                                        <path d="M3 19C3.69137 16.6928 5.46998 16 9.5 16C13.53 16 15.3086 16.6928 16 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path> 
                                        <path d="M13 9.5C13 11.433 11.433 13 9.5 13C7.567 13 6 11.433 6 9.5C6 7.567 7.567 6 9.5 6C11.433 6 13 7.567 13 9.5Z" stroke="currentColor" strokeWidth="2"></path> 
                                        <path d="M15 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
                                        <path d="M18 3L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
                                    </g>
                                </svg>
                            </button>
                        )}
                        {/* Phone Icon */}
                        <a className="hover:text-[#e1e1e3] transition-colors" href="tel:+1555555555">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </a>

                        {/* Video Icon  */}
                        <button className="hover:text-[#e1e1e3] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                        </button>

                        <div className="w-[1px] h-5 bg-[#2c2c2f] mx-1"></div>

                        {/* Search Icon */}
                        <button 
                            onClick={() => setIsSearching(true)}
                            className="hover:text-[#e1e1e3] transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>

                        {/* Sidebar/Layout Icon */}
                        <button className="hover:text-[#e1e1e3] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="15" y1="3" x2="15" y2="21"></line>
                            </svg>
                        </button>

                        {/* More Options*/}
                        <div className="relative ml-1" ref={optionsMenuRef}>
                            <button 
                                onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                                className={`transition-colors p-1.5 rounded-lg ${isOptionsMenuOpen ? 'bg-white/10 text-[#e1e1e3]' : 'hover:text-[#e1e1e3] hover:bg-white/5'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>

                            {isOptionsMenuOpen && (
                                <div className="absolute right-0 top-[120%] w-48 bg-[#161618] border border-[#2c2c2f] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button 
                                        onClick={handleLeaveRoom}
                                        className="w-full text-left px-4 py-3 text-[#e1e1e3] hover:bg-white/5 transition-colors text-[13px] font-medium flex items-center gap-2.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        {isGroup ? "Leave Group" : "Delete Chat"}
                                    </button>

                                    {isGroup && iAmAdmin && (
                                        <>
                                            <div className="w-full h-[1px] bg-[#2c2c2f]"></div>
                                            <button 
                                                onClick={handleDeleteRoom}
                                                className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-[13px] font-medium flex items-center gap-2.5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                                Delete Group
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <NewChatModal 
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                token={token}
                currentUser={user}
                addMember={true}
                onRoomCreated={handleRoomCreated}
                activeRoom={activeRoom}
            />
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirmModal}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                onConfirm={confirmConfig.action}
                isDestructive={true} 
            />
        </section>
    )
}