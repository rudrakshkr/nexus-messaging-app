import { useEffect, useState } from "react"

export default function Sidebar({user, setUser, onSelectUser, activeUser}) {
    const token = localStorage.getItem("jwtToken");
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [loggedUser, setLoggedUser] = useState([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(true);

    // Errors State
    const [errors, setErrors] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const getUsers = await fetch(`/api/getUsers`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                })

                if(!getUsers.ok) throw new Error("Failed to get post.");
                const usersData = await getUsers.json();

                // Get all users not including the one logged in
                setUsers(usersData.users.filter((getUser) => getUser.email !== user.email))
                // Set logged user state
                setLoggedUser(usersData.users.filter((getUser) => getUser.email === user.email));
            } catch(err) {
                console.error("Fetch error: ", err);
                setErrors("Failed to load page data.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, [token]);

    useEffect(() => {
        if (users.length > 0) {
        }
    }, [users]);

    return (
        <section className="flex flex-col flex-1 bg-[#161618] border-r border-[#2c2c2f]">
            <div className="flex items-center gap-3 px-4 py-4">
                <div className="w-8 h-8 bg-[#8444f6] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(132,68,246,0.4)] flex-shrink-0">
                    N
                </div>
                <h2 className="text-lg font-bold text-[#e1e1e3] tracking-tight">Nexus</h2>
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2 px-4 pb-3 text-[13px] font-medium border-b border-[#2c2c2f]">
                <button className="px-3 py-1.5 rounded-lg bg-[#8444f6]/15 text-[#b488f8] cursor-pointer transition-colors">
                    All
                </button>
                
                <button className="px-3 py-1.5 rounded-lg text-[#8f8f96] hover:bg-white/5 hover:text-[#e1e1e3] cursor-pointer transition-colors">
                    Unread
                </button>
            </div>

            <div className="flex flex-col w-full h-full max-h-screen overflow-hidden">
                {/* Contact Info Cards */}
                <div className="flex-1 overflow-y-auto">
                    {users.map((user) => {
                        return (
                            <div 
                                className={`relative flex items-center gap-3 p-3 w-full rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
                                    activeUser?.id === user.id 
                                        ? 'bg-[#2a2a2e] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-1.5 before:bg-[#8444f6] before:rounded-r-md' 
                                        : 'hover:bg-white/5'
                                }`}
                                key={user.id}
                                onClick={() => onSelectUser(user)}
                            >
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={user.avatar} 
                                        alt={user.fullname} 
                                        className="w-11 h-11 rounded-full object-cover"
                                    />
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00d97e] border-2 border-[#0a0a0a] rounded-full"></span>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="text-[15px] font-semibold text-[#e1e1e3] truncate pr-2">
                                            {user.fullname}
                                        </h3>
                                        <span className="text-xs text-[#8f8f96] flex-shrink-0">
                                            10:42 AM
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-[13px] font-medium text-[#c0c0c8] truncate pr-4">
                                            No rush, whenever you have time
                                        </p>
                                        {/* Notification Count */}
                                        <div className="w-5 h-5 bg-[#8444f6] rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-[0_2px_10px_rgba(132,68,246,0.3)]">
                                            2
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
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
                            <button className="flex items-center gap-3 w-full p-2.5 hover:bg-white/5 rounded-lg text-[#e1e1e3] text-[14px] font-medium transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Profile
                            </button>
                            
                            {/* Divider */}
                            <div className="my-1.5 border-t border-[#2c2c2f]"></div>
                            
                            {/* Log Out Option */}
                            <button className="flex items-center gap-3 w-full p-2.5 hover:bg-[#332222] rounded-lg text-red-400 text-[14px] font-medium transition-colors">
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
                        {loggedUser.length !== 0 && (
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Avatar  */}
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={loggedUser[0].avatar}
                                        alt="Alex Chen" 
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d97e] border-2 border-[#0a0a0a] rounded-full"></span>
                                </div>

                                {/* Name and Status */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="text-[15px] font-semibold text-[#e1e1e3] truncate">
                                        {loggedUser[0].fullname}
                                    </h3>
                                    <p className="text-[13px] font-medium text-[#8f8f96] truncate">
                                        Working
                                    </p>
                                </div>
                            </div>
                        )}

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
        </section>
    )
}