import { useEffect, useState, useRef } from "react";
import { TailSpin } from "react-loader-spinner";

export default function GroupInfoDrawer({isOpen, onClose, room, currentUser, onUpdateRoomInfo}) {
    const token = localStorage.getItem("jwtToken");
    if(!room) return null;

    const [avatarPreview, setAvatarPreview] = useState(room?.avatar || null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempGroupName, setTempGroupName] = useState(room?.subject || "");
    const [isLoadingName, setIsLoadingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [notification, setNotification] = useState("");

    const nameInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const myParticipantData = room.participants?.find(p => p.user.email === currentUser.email);
    const iAmAdmin = myParticipantData?.role === 'ADMIN';

    useEffect(() => {
        setAvatarPreview(room?.avatar || null);
    }, [room]);
    useEffect(() => {
        setTempGroupName(room?.subject || "");
    }, [room]);

    // Toast notification
    const showToast = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification("");
        }, 3000);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => setAvatarPreview(reader.result);
            reader.readAsDataURL(file);

            setIsUploadingAvatar(true);

            try {
                const formData = new FormData();
                formData.append("groupAvatar", file);
                formData.append("roomId", room.id);

                const res = await fetch(`/api/updateGroupAvatar`, {
                    method: "PUT",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                })

                if(res.ok) {
                    const data = await res.json();
                    setAvatarPreview(data.imageUrl);
                    showToast("Avatar updated successfully!");

                    if(onUpdateRoomInfo) {
                        onUpdateRoomInfo(room.id, {avatar: data.imageUrl})
                    }
                } else {
                    console.error("Upload failed!");
                    return;
                }
            } catch(err) {
                console.error("Network error during upload", err);
                return;
            }
            finally{
                setIsUploadingAvatar(false);
            }
        }
    };

    const handleSaveName = async (e) => {
        if(tempGroupName === room.subject || isLoadingName) {
            setIsEditingName(false);
            return;
        }

        if(!tempGroupName.trim()) {
            alert("Group name cannot be empty!");
            setTempGroupName(room.subject);
            setIsEditingName(false);
            return;
        }

        setIsLoadingName(true);
        setIsEditingName(false);
        try {
            const res = await fetch('/api/updateGroupName', {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    roomId: room.id,
                    subject: tempGroupName
                })
            })

            if(res.ok) {
                showToast("Group name updated!");

                if(onUpdateRoomInfo) {
                    onUpdateRoomInfo(room.id, {subject: tempGroupName})
                } else {
                    console.error("Failed to update group name.");
                }
            }
        }
        catch(err) {
            console.error("Network error while saving name:", err);
            showToast("Failed to update name");
            setTempGroupName(room.subject);
        } finally{
            setIsLoadingName(false);
        }
    }

    const handleRoleChange = async (targetUserId, newRole) => {
        setUpdatingUserId(targetUserId);
        try {
            const res = await fetch('/api/updateGroupAdmin', {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    roomId: room.id,
                    userId: targetUserId,
                    role: newRole
                })
            });

            if(res.ok) {
                showToast(newRole === 'ADMIN' ? "Promoted to Admin!" : "Admin rights removed");

                const updatedParticipants = room.participants.map(p => 
                    p.user.id === targetUserId ? { ...p, role: newRole } : p
                );

                if(onUpdateRoomInfo) {
                    onUpdateRoomInfo(room.id, { participants: updatedParticipants });
                }
            } else {
                console.error("Failed to update role");
                showToast("Failed to update role");
            }
        } catch(err) {
            console.error("Network error while updating role:", err);
            showToast("Network error occurred");
        }
        finally{
            setUpdatingUserId(null);
        }
    };

    const handleUserKick = async (targetUserId) => {
        const isConfirmed = window.confirm("Are you sure you want to kick this user");
        if(!isConfirmed) return;

        try {
            const res = await fetch('/api/kickGroupUser', {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    roomId: room.id,
                    userId: targetUserId
                })
            })

            if(res.ok) {
                showToast("Kicked out user from the group!");

                const updatedParticipants = room.participants.filter(p => 
                    p.user.id !== targetUserId
                )

                if(onUpdateRoomInfo) {
                    onUpdateRoomInfo(room.id, { participants: updatedParticipants });
                }
            } 
            else {
                console.error("Failed to kick the user");
                showToast("Failed to kick the user");
            }
        } catch(err) {
            console.error("Network error while kicking out the user:", err);
            showToast("Network error occurred");
        }
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


    useEffect(() => {
        const handleEsc = (e) => {
            if(e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <>
            <div 
                onClick={onClose}
                className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            />
            {/* TOAST NOTIFICATION  */}
            <div 
                className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 bg-[#00d97e]/15 border border-[#00d97e]/30 backdrop-blur-md text-[#00d97e] px-4 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,217,126,0.15)] transition-all duration-300 ease-out
                ${notification 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-6 pointer-events-none' 
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span className="text-[14px] font-semibold tracking-wide">
                    {notification}
                </span>
            </div>
            <div 
                className={`fixed top-0 right-0 h-full w-[350px] bg-[#161618] border-l border-[#2c2c2f] z-[100] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-5 border-b border-[#2c2c2f]">
                    <h2 className="text-lg font-bold text-[#e1e1e3]">Group Info</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-[#8f8f96] hover:bg-white/5 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center p-6 border-b border-[#2c2c2f]">
                    {/* Avatar & Name */}
                    <div className="flex flex-col items-center gap-2">
                        <style>{`
                            @keyframes sweep {
                                0% { left: -150%; }
                                100% { left: 150%; }
                            }
                            .animate-sweep {
                                animation: sweep 1.5s ease-in-out infinite;
                            }
                        `}</style>

                        <div 
                            className={`relative w-20 h-20 rounded-full overflow-hidden ${iAmAdmin && !isUploadingAvatar ? 'cursor-pointer group' : ''}`}
                            onClick={() => iAmAdmin && !isUploadingAvatar && fileInputRef.current?.click()}
                        >
                            {/* Avatar */}
                            {avatarPreview ? (
                                <img 
                                    src={avatarPreview} 
                                    alt="Group Avatar" 
                                    className={`w-full h-full rounded-full object-cover border-4 border-[#2c2c2f] transition-all duration-700 ease-in-out ${
                                        isUploadingAvatar ? 'blur-[6px] brightness-[0.25] scale-110' : 'group-hover:opacity-50'
                                    }`}
                                />
                            ) : (
                                <div className={`w-full h-full rounded-full border-4 border-[#2c2c2f] flex items-center justify-center text-white font-bold text-3xl shadow-inner transition-all duration-700 ease-in-out ${
                                    isUploadingAvatar ? 'blur-[6px] brightness-[0.25] scale-110' : 'group-hover:opacity-50'
                                } ${getAvatarColor(room.subject)}`}>
                                    {room.subject ? room.subject.charAt(0).toUpperCase() : '#'}
                                </div>
                            )}

                            {isUploadingAvatar && (
                                <>
                                    <div 
                                        className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-sweep z-10" 
                                        style={{ filter: 'blur(4px)' }}
                                    ></div>
                                    
                                    <div className="absolute inset-0 rounded-full border-[4px] border-[#8444f6] animate-pulse z-20 shadow-[0_0_15px_#8444f6]"></div>
                                </>
                            )}

                            {iAmAdmin && !isUploadingAvatar && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Hidden File Input */}
                        {iAmAdmin && (
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                        )}
                    </div>

                    <div className={`mt-3 w-full text-center ${iAmAdmin ? 'group px-6' : ''}`}>
                        {isEditingName && iAmAdmin ? (
                            <input 
                                ref={nameInputRef}
                                type="text"
                                value={tempGroupName}
                                onChange={(e) => setTempGroupName(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') {
                                        setTempGroupName(room.subject);
                                        setIsEditingName(false);
                                    }
                                }}
                                disabled={isLoadingName}
                                className={`text-xl font-bold text-[#e1e1e3] bg-[#0a0a0a] border border-[#2c2c2f] rounded-lg px-2 py-1 w-full text-center outline-none focus:border-[#8444f6] ${isLoadingName ? 'opacity-60' : ''}`}
                            />
                        ) : (
                            <div className="relative inline-flex items-center gap-2 group max-w-full">
                                {isLoadingName && (
                                    <div className="flex-shrink-0">
                                        <TailSpin
                                            visible={true}
                                            height="18"
                                            width="18"
                                            color="#8444f6"
                                            ariaLabel="tail-spin-loading"
                                            radius="1"
                                        />
                                    </div>
                                )}
                                
                                <h3 className={`text-xl font-bold text-[#e1e1e3] truncate ${isLoadingName ? 'opacity-50' : ''}`}>
                                    {isLoadingName ? "Saving..." : tempGroupName}
                                </h3>

                                {iAmAdmin && !isLoadingName && (
                                    <button 
                                        onClick={() => setIsEditingName(true)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white/5 text-[#8f8f96] hover:text-[#e1e1e3]"
                                        title="Edit Group Name"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-[13px] font-medium text-[#8f8f96] mt-1">
                        {room.participants?.length || 0} Participants
                    </p>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto p-2">
                    <h4 className="px-3 py-2 text-[12px] font-bold text-[#8f8f96] uppercase tracking-wider mb-1">Members</h4>
                    
                    <div className="flex flex-col gap-1">
                        {room.participants?.map((participant) => {
                            const member = participant.user;
                            const isAdmin = participant.role === 'ADMIN';
                            const isMe = member.email === currentUser.email;

                            return (
                                <div key={member.id} className="group relative flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                    
                                    {/* Member Info */}
                                    <div className="flex items-center gap-3">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.fullname} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[15px] ${getAvatarColor(member.fullname)}`}>
                                                {member.fullname.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[14px] font-medium text-[#e1e1e3]">
                                                    {member.fullname} {isMe && "(You)"}
                                                </span>
                                                {isAdmin && (
                                                    <span className="text-[9px] bg-[#8444f6]/20 text-[#b488f8] px-2 py-0.5 rounded-full font-bold tracking-wide border border-[#8444f6]/30">
                                                        ADMIN
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[12px] text-[#8f8f96]">{member.email}</span>
                                        </div>
                                    </div>

                                    {/* Admin Action Buttons  */}
                                    {iAmAdmin && !isMe && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#161618] shadow-[-10px_0_10px_#161618] absolute right-2">
                                            <button 
                                                onClick={() => handleRoleChange(member.id, isAdmin ? 'MEMBER' : 'ADMIN')}
                                                disabled={updatingUserId === member.id}
                                                title={isAdmin ? "Remove Admin" : "Make Admin"}
                                                className={`p-2 flex items-center justify-center rounded-lg transition-colors ${
                                                    isAdmin 
                                                        ? 'text-[#b488f8] hover:text-[#e1e1e3] hover:bg-white/10' // Admin styling
                                                        : 'text-[#8f8f96] hover:text-[#00d97e] hover:bg-[#00d97e]/10' // Normal styling
                                                } ${updatingUserId === member.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {updatingUserId === member.id ? (
                                                    <div className="flex-shrink-0">
                                                        <TailSpin
                                                            visible={true}
                                                            height="18"
                                                            width="18"
                                                            color="#8444f6"
                                                            ariaLabel="tail-spin-loading"
                                                            radius="1"
                                                        />
                                                    </div>
                                                ) : isAdmin ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                        <line x1="9" y1="12" x2="15" y2="12"></line>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Kick User Button */}
                                            <button 
                                                title="Remove User"
                                                className="p-2 text-[#8f8f96] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                onClick={() => handleUserKick(member.id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path>
                                                    <circle cx="8.5" cy="7" r="4"></circle>
                                                    <line x1="18" y1="8" x2="23" y2="13"></line>
                                                    <line x1="23" y1="8" x2="18" y2="13"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}