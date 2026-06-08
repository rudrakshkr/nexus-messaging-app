import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function NewChatModal({isOpen, onClose, token, addMember, currentUser, onRoomCreated, activeRoom, onSelectRoom}) {
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    // Filter Users
    const filteredUsers = users.filter(u => 
        u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Toast notification
    const showToast = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification("");
        }, 3000);
    };

    // Fetch users when modal opens
    useEffect(() => {
        if(!isOpen) return;

        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${API_URL}/api/getUsers`, {
                    headers: {"Authorization": `Bearer ${token}`}
                });
                if(res.ok) {
                    const data = await res.json();
                    setUsers(data.users.filter(u => u.email !== currentUser.email));
                }
            }
            catch(err) {
                console.error("Failed to fetch users", err);
            }
            finally{
                setIsLoading(false);
            }
        }

        fetchUsers();
    }, [isOpen, token, currentUser]);

    // Handle checkbox toggle
    const toggleUser = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId)
                ? prev.filter(id => id !== userId) // Remove if already present
                : [...prev, userId] // Add if not present ;)
        );
    }
    const isGroup = selectedUserIds.length > 1;

    const handleSubmit = async () => {
        if(selectedUserIds.length === 0) return;
        
        setIsLoading(true);
        
        try {
            // -------------------------------------
            // ADDING MEMBERS TO EXISTING GROUP
            // -------------------------------------
            if (addMember && activeRoom) {
                const res = await fetch(`${API_URL}/api/addGroupUser`, {
                    method: "POST", 
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        roomId: activeRoom.id,
                        participantIds: selectedUserIds
                    })
                });

                if(res.ok) {
                    const updatedRoom = await res.json();
                    showToast("User added to group!");
                    onRoomCreated(updatedRoom)
                    
                    setSelectedUserIds([]);
                    
                } else {
                    console.error("Failed to add members");
                }
            } 
            // --------------------------------
            // CREATING A BRAND NEW CHAT/GROUP
            // --------------------------------
            else {
                if(selectedUserIds.length > 1 && !groupName.trim()) {
                    setIsLoading(false);
                    return alert("Please enter a group name!");
                }

                const res = await fetch(`${API_URL}/api/createRoom`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        participantIds: selectedUserIds,
                        isGroup: isGroup,
                        subject: isGroup ? groupName : null
                    })
                });

                if(res.ok) {
                    const data = await res.json();
                    onRoomCreated(data);
                    onClose();
                } else {
                    console.error("Failed to create room");
                }
            }
        } catch (error) {
            console.error("Network error:", error);
        } finally {
            setIsLoading(false);
        }
    };

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

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-4">
            {/* TOAST NOTIFICATION  */}
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
            <div className="bg-[#161618] border border-[#2c2c2f] w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#2c2c2f]">
                    <h2 className="text-lg font-bold text-[#e1e1e3]">
                        {addMember ? "Add People To Group": isGroup ? "Create New Group" : "New Conversation"}
                    </h2>
                    <button onClick={onClose} className="text-[#8f8f96] hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                    {(isGroup & !addMember) ? (
                        <div className="animate-in slide-in-from-top-2 fade-in">
                            <label className="text-[13px] font-medium text-[#8f8f96] mb-1.5 block">Group Name</label>
                            <input 
                                type="text" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="E.g. Weekend Trip"
                                className="w-full bg-[#0a0a0a] border border-[#2c2c2f] rounded-lg px-4 py-2.5 text-[#e1e1e3] text-[14px] outline-none focus:border-[#8444f6] transition-colors"
                            />
                        </div>
                    ): (
                        <div className="mb-4">
                            <p className="text-[12px] font-bold text-[#8f8f96] uppercase tracking-wider mb-1">
                                Add New Members
                            </p>
                            <div className="w-full h-[2px] bg-[#2c2c2f] rounded-full"></div>
                        </div>
                    )}

                    <div>
                        <label className="text-[13px] font-medium text-[#8f8f96] mb-2 block">Select Participants</label>

                        {/* Search Bar */}
                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#52525b]">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#2c2c2f] rounded-lg pl-9 pr-4 py-2 text-[#e1e1e3] text-[13px] outline-none focus:border-[#8444f6] transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="flex items-center p-2 gap-3 w-full">
                                        <div className="w-10 h-10 rounded-full skeleton shrink-0"></div>
                                        
                                        <div className="flex-1 flex flex-col gap-2.5">
                                            <div className={`h-3.5 skeleton rounded-md ${index % 2 === 0 ? 'w-32' : 'w-24'}`}></div>
                                            <div className="h-3 skeleton rounded-md w-40 opacity-60"></div>
                                        </div>
                                        
                                        <div className="w-5 h-5 rounded-[4px] skeleton shrink-0 border border-[#2c2c2f]"></div>
                                    </div>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-6 text-[#8f8f96] text-[13px]">
                                    No users found matching {searchTerm}
                                </div>
                            ) : (
                                filteredUsers.map(u => {
                                    const isAlreadyMember = addMember && activeRoom?.participants?.some(p => p.user.id === u.id);
                                    return (
                                        <div 
                                            key={u.id}
                                            onClick={() => !isAlreadyMember && toggleUser(u.id)}
                                            className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                                isAlreadyMember 
                                                    ? 'opacity-40 cursor-not-allowed bg-[#161618]'
                                                    : selectedUserIds.includes(u.id) 
                                                        ? 'bg-[#8444f6]/10 border border-[#8444f6]/30 cursor-pointer' 
                                                        : 'hover:bg-white/5 border border-transparent cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {u.avatar ? (
                                                    <img 
                                                        src={u.avatar} 
                                                        alt={u.fullname} 
                                                        className="w-9 h-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[14px] shadow-inner ${getAvatarColor(u.fullname)}`}>
                                                        {u.fullname ? u.fullname.charAt(0).toUpperCase() : '#'}
                                                    </div>
                                                )}
                                                <span className="text-[14px] font-medium text-[#e1e1e3]">{u.fullname}</span>
                                            </div>
                                            
                                            {isAlreadyMember ? (
                                                <span className="text-[11px] font-bold text-[#8f8f96] uppercase tracking-wide px-2">Joined</span>
                                            ) : (
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                                    selectedUserIds.includes(u.id) ? 'bg-[#8444f6] border-[#8444f6]' : 'border-[#2c2c2f] bg-[#0a0a0a]'
                                                }`}>
                                                    {selectedUserIds.includes(u.id) && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-5 border-t border-[#2c2c2f] bg-[#161618] flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#8f8f96] hover:text-[#e1e1e3] hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={selectedUserIds.length === 0 || isLoading}
                        className="px-4 py-2 rounded-lg text-[14px] font-medium bg-[#8444f6] text-white hover:bg-[#7133d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {(isLoading & !addMember) ? "Creating..." : (isLoading & addMember) ? "Adding..." : addMember ? "Add members" : (isGroup ? "Create Group" : "Start Chat" )}
                    </button>
                </div>

            </div>
        </div>
    )
}