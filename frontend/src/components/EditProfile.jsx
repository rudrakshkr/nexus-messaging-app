import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { TailSpin } from "react-loader-spinner";

export default function EditProfile({user, setUser}) {
    const token = localStorage.getItem("jwtToken");

    const [fullname, setFullName] = useState(user?.fullname || "");
    const [email, setEmail] = useState(user?.email || "");

    const [avatarPreview, setAvatarPreview] = useState(user?.avatar);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({text: "", type: ""});

        try {
            const formData = new FormData();
            formData.append("fullname", fullname);
            formData.append("email", email);
            if(selectedFile) {
                formData.append("avatar", selectedFile);
            }

            const res = await fetch('/api/editProfile', {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if(res.ok) {
                setAvatarPreview(data.user.avatar);

                setUser((prev) => ({
                    ...prev,
                    fullname: data.user.fullname,
                    email: data.user.email,
                    avatar: data.user.avatar
                }));
                
                setMessage({ text: "Profile updated successfully!", type: "success" });
                setSelectedFile(null);
            }
            else {
                setMessage({text: data.message || "Failed to update profile", type: "fail"});
            }
        }
        catch(err){
            console.error("Network error during upload", err);
            setMessage({text: "Network error occurred", type: "fail"});
        }
        finally {
            setIsLoading(false);
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
    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white font-sans flex flex-col items-center py-10 px-4">    
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <Link 
                        to="/"
                        className="p-2 mr-4 rounded-full hover:bg-white/5 text-[#8f8f96] hover:text-[#e1e1e3] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-[#e1e1e3]">Edit Profile</h1>
                </div>

                <div className="bg-[#161618] border border-[#2c2c2f] rounded-2xl p-6 shadow-2xl">
                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        
                        {/* 1. Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                {avatarPreview ? (
                                    <img 
                                        src={avatarPreview} 
                                        alt="Profile Preview" 
                                        className="w-28 h-28 rounded-full object-cover border-4 border-[#2c2c2f] group-hover:opacity-50 transition-opacity"
                                    />
                                ) : (
                                    <div className={`w-28 h-28 rounded-full border-4 border-[#2c2c2f] flex items-center justify-center text-white font-bold text-4xl shadow-inner group-hover:opacity-50 transition-opacity ${getAvatarColor(fullname)}`}>
                                        {fullname ? fullname.charAt(0).toUpperCase() : '#'}
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                            </div>
                            
                            <input 
                                name="avatar"
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                            <p className="text-[13px] text-[#8f8f96]">Click to update picture</p>
                        </div>

                        {/* 2. Text Inputs */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[13px] font-medium text-[#8f8f96] mb-1.5 block">Full Name</label>
                                <input 
                                    type="text" 
                                    value={fullname}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2c2c2f] rounded-lg px-4 py-2.5 text-[#e1e1e3] text-[14px] outline-none focus:border-[#8444f6] transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-medium text-[#8f8f96] mb-1.5 block">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2c2c2f] rounded-lg px-4 py-2.5 text-[#e1e1e3] text-[14px] outline-none focus:border-[#8444f6] transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Status Message */}
                        {message.text && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-[#00d97e]/10 text-[#00d97e] border border-[#00d97e]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {message.text}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 bg-[#8444f6] text-white font-medium py-3 rounded-lg hover:bg-[#7133d4] transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <TailSpin
                                        visible={true}
                                        height="20"
                                        width="20"
                                        color="#ffffff"
                                        ariaLabel="tail-spin-loading"
                                        radius="1"
                                    />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}