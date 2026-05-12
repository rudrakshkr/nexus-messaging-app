import { useState, useEffect } from "react";

export default function NewChatModal({isOpen, onClose, token, currentUser, onRoomCreated}) {
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Fetch users when modal opens
    useEffect(() => {
        if(!isOpen) return;

        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/getUsers', {
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
        if(selectedUserIds.length > 1 && !groupName.trim()) {
            return alert("Please enter a group name!");
        }

        setIsLoading(true);
        
        try {
            const res = await fetch('/api/createRoom', {
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
        } catch (error) {
            console.error("Network error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-4">
            <div className="bg-[#161618] border border-[#2c2c2f] w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#2c2c2f]">
                    <h2 className="text-lg font-bold text-[#e1e1e3]">
                        {isGroup ? "Create New Group" : "New Conversation"}
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
                    {isGroup && (
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
                    )}

                    <div>
                        <label className="text-[13px] font-medium text-[#8f8f96] mb-2 block">Select Participants</label>
                        <div className="flex flex-col gap-1">
                            {users.map(u => (
                                <div 
                                    key={u.id}
                                    onClick={() => toggleUser(u.id)}
                                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                                        selectedUserIds.includes(u.id) ? 'bg-[#8444f6]/10 border border-[#8444f6]/30' : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={u.avatar || `https://i.pravatar.cc/150?u=${u.email}`} 
                                            alt={u.fullname} 
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                        <span className="text-[14px] font-medium text-[#e1e1e3]">{u.fullname}</span>
                                    </div>
                                    
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                        selectedUserIds.includes(u.id) ? 'bg-[#8444f6] border-[#8444f6]' : 'border-[#2c2c2f] bg-[#0a0a0a]'
                                    }`}>
                                        {selectedUserIds.includes(u.id) && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                        {isLoading ? "Creating..." : (isGroup ? "Create Group" : "Start Chat")}
                    </button>
                </div>

            </div>
        </div>
    )
}