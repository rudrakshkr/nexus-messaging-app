export default function ChatHeader({user, activeRoom}) {
    const getAvatarColor = (name) => {
        if(!name) return 'bg[#8444f6]';

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

    const otherParticipant = !isGroup
        ? activeRoom.participants.find(p => p.user.email !== user.email)?.user
        : null;

    const displayName = isGroup ? activeRoom.subject : otherParticipant?.fullname;
    const displayAvatar = isGroup ? activeRoom.avatar : otherParticipant?.avatar;
    
    const subtitle = isGroup
        ? `${activeRoom.participants?.length} members`
        : "Active now";

    return (
        <div className="w-full flex items-center justify-between px-6 py-4 border-b border-[#2c2c2f] bg-[#0a0a0a]">
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    {isGroup && !activeRoom.avatar ? (
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[17px] shadow-inner ${getAvatarColor(displayName)}`}>
                            {displayName ? displayName.charAt(0).toUpperCase() : '#'}
                        </div>
                    ) : (
                        !otherParticipant.avatar ? (
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[17px] shadow-inner ${getAvatarColor(displayName)}`}>
                                {displayName ? displayName.charAt(0).toUpperCase() : '#'}
                            </div>
                        ) :
                        (
                            <img 
                                src={displayAvatar} 
                                alt={displayName} 
                                className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[17px] shadow-inner ${getAvatarColor(displayName)}`}
                            />
                        )
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

            <div className="flex items-center gap-5 text-[#8f8f96]">
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
                <button className="hover:text-[#e1e1e3] transition-colors">
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
                <button className="hover:text-[#e1e1e3] transition-colors ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
        </div>
    )
}