export default function ChatHeader({activeUser}) {
    return (
        <div className="w-full flex items-center justify-between px-6 py-4 border-b border-[#2c2c2f] bg-[#0a0a0a]">
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    <img 
                        src={activeUser.avatar} 
                        alt={activeUser.fullname} 
                        className="w-11 h-11 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00d97e] border-2 border-[#0a0a0a] rounded-full"></span>
                </div>
                {/* <div className="w-11 h-11 rounded-full bg-[#1e1e1e] flex items-center justify-center text-[#8f8f96]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="9" x2="20" y2="9"></line>
                        <line x1="4" y1="15" x2="20" y2="15"></line>
                        <line x1="10" y1="3" x2="8" y2="21"></line>
                        <line x1="16" y1="3" x2="14" y2="21"></line>
                    </svg>
                </div> */}
                <div className="flex flex-col">
                    <h2 className="text-[15px] font-semibold text-[#e1e1e3]">{activeUser.fullname}</h2>
                    <p className="text-[13px] font-medium text-[#8f8f96] mt-0.5">Active now</p>
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