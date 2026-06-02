import { useEffect, useState } from "react"
import NewChatModal from "./NewChatModal";
import { Link } from "react-router";

export default function Sidebar({ user, setUser, onSelectRoom, activeRoom, rooms, setRooms, isLoading, onlineUsers=[]}) {
    const token = localStorage.getItem("jwtToken");
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [filter, setFilter] = useState("all")

    const [errors, setErrors] = useState("");

    const handleLogout = async (e) => {
        e.preventDefault(e)
        localStorage.removeItem('jwtToken');
        setUser({auth: false, name: ''})
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

    const displayedRooms = filter === "unread"
        ? rooms.filter(r => r.unreadCount > 0)
        : rooms;

    return (
        <section className="flex flex-col flex-1 bg-[#161618] border-r border-[#2c2c2f]">
            <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#8444f6] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(132,68,246,0.4)] flex-shrink-0">
                        N
                    </div>
                    <h2 className="text-lg font-bold text-[#e1e1e3] tracking-tight">Nexus</h2>
                </div>
                
                {/* NEW CHAT BUTTON */}
                <button 
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="text-[#8f8f96] hover:text-[#e1e1e3] transition-colors p-1 hover:bg-white/5 rounded-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                </button>
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2 px-4 pb-3 text-[13px] font-medium border-b border-[#2c2c2f]">
                <button 
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        filter === "all" 
                            ? 'bg-[#8444f6]/15 text-[#b488f8]' 
                            : 'text-[#8f8f96] hover:bg-white/5 hover:text-[#e1e1e3]'
                    }`}
                >
                    All
                </button>
                
                <button 
                    onClick={() => setFilter("unread")}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        filter === "unread" 
                            ? 'bg-[#8444f6]/15 text-[#b488f8]' 
                            : 'text-[#8f8f96] hover:bg-white/5 hover:text-[#e1e1e3]'
                    }`}
                >
                    Unread
                </button>
            </div>

            <div className="flex flex-col w-full h-full max-h-screen overflow-hidden">
                {/* Contact Info Cards */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 w-full">
                                <div className="w-11 h-11 rounded-full skeleton shrink-0"></div>

                                <div className="flex-1 flex flex-col gap-2.5 justify-center mt-0.5">
                                    <div className="flex justify-between items-center">
                                        <div className={`h-3.5 skeleton rounded-md ${index % 2 === 0 ? 'w-28' : 'w-36'}`}></div>
                                        <div className="h-2.5 skeleton rounded-md w-8 opacity-40"></div>
                                    </div>
                                    <div className="h-3 skeleton rounded-md w-3/4 opacity-60"></div>
                                </div>
                            </div>
                        ))
                    ) : displayedRooms.length === 0 ? (
                        <div className="p-6 text-center flex flex-col items-center gap-3 mt-4 opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#8f8f96]">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="text-[#8f8f96] text-[13px] font-medium">No conversations yet. Click the + icon on top right to start a conversation ;)</span>
                        </div>
                        
                    ) : (
                        displayedRooms.map((room) => {
                            const isGroup = room.type === 'GROUP';

                            // Find the other person in 1-on-1 chat
                            const otherParticipant = !isGroup
                                ? room.participants.find(p => p.user.email !== user.email)?.user
                                : null;

                            const isOnline = !isGroup && otherParticipant && onlineUsers.includes(otherParticipant.id);
                            const displayName = isGroup ? room.subject : otherParticipant?.fullname;
                            const displayAvatar = isGroup ? room.avatar : otherParticipant?.avatar;

                            const lastMsgObj = room.messages?.[0];

                            const lastMessage = lastMsgObj
                                ? (lastMsgObj.text?.trim().length !== 0 ? lastMsgObj.text.trim().slice(0,35) : "📎 Attachment")
                                : "No messages yet";
                            
                            const displayTime = lastMsgObj
                                ? new Date(lastMsgObj.createdAt || lastMsgObj.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                : "";
                            return (
                                <div 
                                    className={`relative flex items-center gap-3 p-3 w-full rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
                                        activeRoom?.id === room.id 
                                            ? 'bg-[#2a2a2e] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-1.5 before:bg-[#8444f6] before:rounded-r-md' 
                                            : 'hover:bg-white/5'
                                    }`}
                                    key={room.id}
                                    onClick={() => onSelectRoom(room)}
                                >
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

                                        {!isGroup && isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d97e] border-2 border-[#161618] rounded-full"></span>
                                        )}
                                        
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="text-[15px] font-semibold text-[#e1e1e3] truncate pr-2">
                                                {displayName}
                                            </h3>
                                            <span className="text-xs text-[#8f8f96] flex-shrink-0">
                                                {displayTime}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-[13px] font-medium text-[#c0c0c8] truncate pr-4">
                                                {lastMessage}
                                            </p>

                                            {room.unreadCount > 0 && (
                                                <div className="flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-[#8444f6] text-white text-[11px] font-bold px-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(132,68,246,0.4)] animate-in zoom-in duration-200">
                                                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* User Info Card  */}
                <div className="relative mt-auto w-full flex-none shrink-0 border-t border-[#2c2c2f] bg-[#161212] z-10">
                
                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <div 
                            className={`absolute bottom-full left-0 w-full mb-2 bg-[#161618] border border-[#2c2c2f] rounded-xl p-2 shadow-2xl z-50 origin-bottom transition-all duration-150 ease-out
                            ${isUserMenuOpen 
                                ? 'opacity-100 translate-y-0 pointer-events-auto' 
                                : 'opacity-0 translate-y-3 pointer-events-none'
                            }`}
                        >
                            {/* Profile Option */}
                            <Link 
                                className="flex items-center gap-3 w-full p-2.5 hover:bg-white/5 rounded-lg text-[#e1e1e3] text-[14px] font-medium transition-colors"
                                to="/profile"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Profile
                            </Link>
                            
                            {/* Divider */}
                            <div className="my-1.5 border-t border-[#2c2c2f]"></div>
                            
                            {/* Log Out Option */}
                            <button 
                                className="flex items-center gap-3 w-full p-2.5 hover:bg-[#332222] rounded-lg text-red-400 text-[14px] font-medium transition-colors"
                                onClick={handleLogout}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Log out
                            </button>
                        </div>
                    )}

                    {/* User Info  */}
                    <div 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex justify-between items-center gap-3 p-3 w-full hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                                {user.avatar ? (
                                    <img 
                                        src={user.avatar}
                                        alt={user.fullname} 
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ): (
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[17px] shadow-inner ${getAvatarColor(user.fullname)}`}>
                                        {user.fullname ? user.fullname.charAt(0).toUpperCase() : '#'}
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d97e] border-2 border-[#0a0a0a] rounded-full"></span>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h3 className="text-[15px] font-semibold text-[#e1e1e3] truncate">
                                    {user.fullname}
                                </h3>
                                <p className="text-[13px] font-medium text-[#8f8f96] truncate">
                                    Online
                                </p>
                            </div>
                        </div>

                        {/* Dropdown Icon */}
                        <div className="flex-shrink-0 text-gray-500">
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className={`transition-transform duration-150 ease-out ${isUserMenuOpen ? 'rotate-180' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                </div>
            </div>
            <NewChatModal 
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                token={token}
                currentUser={user}
                onRoomCreated={handleRoomCreated}
            />
        </section>
    )
}