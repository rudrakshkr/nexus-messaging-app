import { useEffect, useState, useRef } from "react"
import { socket } from "../socket";
import EmojiPicker from "emoji-picker-react";
import GroupInfoDrawer from "./GroupInfoDrawer";

export default function ChatMessages({ activeRoom, setActiveRoom, setRooms, roomId, user, isDrawerOpen, setIsDrawerOpen }) {
    const token = localStorage.getItem("jwtToken");

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [typingUsers, setTypingUsers] = useState([]);

    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); 
    const [errors, setErrors] = useState("");

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pickerRef = useRef(null); 
    const buttonRef = useRef(null); 
    const recognitionRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Display logic
    const isGroup = activeRoom?.type === 'GROUP';
    const otherParticipant = !isGroup
        ? activeRoom?.participants?.find(p => p.user.email !== user.email)?.user
        : null;
    const displayName = isGroup ? activeRoom?.subject : otherParticipant?.fullname;

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if(SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setInputText((prev) => prev + transcript + " ");
            };

            recognitionRef.current.onend =() => setIsListening(false);

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
                alert("Please provide mic permissions to proceed")
            }
        } else {
            console.warn("Speech recognition is not supported in this browser");
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages])

    const storedData = localStorage.getItem("userData");
    const myMail = storedData ? JSON.parse(storedData).email : null;
    const myId = storedData ? JSON.parse(storedData).id : null;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showEmojiPicker && 
                pickerRef.current && !pickerRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

    // 2. FETCH HISTORY BY ROOM ID
    useEffect(() => {
        if(!roomId) return;
        setMessages([]);

        const fetchMessageHistory = async () => {
            try {
                const res = await fetch(`/api/messages/${roomId}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                if(res.ok) {
                    const history = await res.json();
                    setMessages(history);
                }
            } catch(err) {
                console.error("Fetch error: ", err);
                setErrors("Failed to load page data.");
            }
        };

        fetchMessageHistory();
    }, [roomId, token]);

    useEffect(() => {
        const handleIncomingMessage = (msg) => {
            if (msg.roomId !== roomId) return; 

            setMessages((prev) => {
                if (msg.id && prev.some(existingMsg => existingMsg.id === msg.id)) {
                    return prev;
                }

                const isOptimisticMessagePending = prev.some(existingMsg => existingMsg.id === msg.tempId);

                if(msg.tempId && isOptimisticMessagePending) {
                    return prev.map(existingMsg => 
                        existingMsg.id === msg.tempId ? msg : existingMsg
                    )
                }
                return [...prev, msg]
            })
        };

        const handleUserTyping = ({fullname}) => {
            setTypingUsers((prev) => {
                if(!prev.includes(fullname)) return [...prev, fullname];
                return prev;
            });
        }

        const handleUserStoppedTyping = ({fullname}) => {
            setTypingUsers((prev) => prev.filter((name) => name !== fullname));
        };

        socket.on("receiveMessage", handleIncomingMessage);
        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);

        return () => {
            socket.off("receiveMessage", handleIncomingMessage);
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
        }
    }, [roomId]);

    const handleUpdateRoomInfo = (roomId, updatedData) => {
        setActiveRoom(prev => {
            if (String(prev?.id) === String(roomId)) {
                return { ...prev, ...updatedData };
            }
            return prev;
        });
        
        setRooms(prevRooms => 
            prevRooms.map(r => String(r.id) === String(roomId) ? { ...r, ...updatedData } : r)
        );
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        const maxSizeInBytes = 25 * 1024 * 1024;

        if(file && file.type.startsWith('image/')) {
            if(file.size > maxSizeInBytes) {
                alert("File size too much (greater than 25MB)");
                setErrors("Image is too large! Please select a file smaller than 25MB.");
                e.target.value = null;
                return;
            }

            setSelectedFile(file);

            const reader = new FileReader();
            reader.onload = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const removeImage = () => {
        setSelectedFile(null);
        setSelectedImage(null);
    }

    const toggleListening = () => {
        if(!recognitionRef.current) return alert("Your browser does not support voice-to-text!");

        if(isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    }

    // Input change handler with timeout
    const handleInputChange = (e) => {
        setInputText(e.target.value);

        if(!roomId || !myMail) return;

        socket.emit("typing", {roomId: roomId, fullname: user.fullname});

        if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", {roomId: roomId, fullname: user.fullname});
        }, 2000);
    }

    const sendMessage = async () => {
        if((!inputText.trim() && !selectedFile) || !roomId) return;

        const textToSend = inputText;
        const fileToUpload = selectedFile;
        const previewImage = selectedImage;

        if(isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        setInputText("");
        removeImage();
        clearTimeout(typingTimeoutRef.current);
        socket.emit("stopTyping", {roomId: roomId, fullname: user.fullname});

        const tempId = Date.now();
        const userData = storedData ? JSON.parse(storedData) : null;
        
        const optimisticMsg = {
            id: tempId,
            tempId: tempId,
            text: textToSend,
            imageUrl: previewImage,
            senderEmail: myMail,
            fullname: displayName,
            avatar: userData?.avatar,
            time: new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}),
            isPending: true,
            roomId: roomId
        }

        setMessages((prev) => [...prev, optimisticMsg]);
        console.log(optimisticMsg)

        let finalImageUrl = null;

        if(fileToUpload) {
            const formData = new FormData();
            formData.append("image", fileToUpload);

            try {
                const res = await fetch(`/api/uploadImage`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                })

                if(res.ok) {
                    const data = await res.json();
                    finalImageUrl = data.imageUrl;
                } else {
                    console.error("Upload failed!");
                    return;
                }
            } catch(err) {
                console.error("Network error during upload", err);
                return;
            }
        }

        socket.emit("sendMessage", {
            text: textToSend,
            imageUrl: finalImageUrl,
            senderEmail: myMail,
            roomId: roomId,
            tempId: tempId
        });
    }

    const onEmojiClick = (emojiObject) => {
        setInputText((prevInput) => prevInput + emojiObject.emoji);
    }

    const handleKeyDown = (e) => {
        if(e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#0a0a0a]">
            {/* Chat Section  */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-h-0">
                <div className="flex justify-center">
                    <span className="bg-[#161618] border border-[#2c2c2f] text-[#8f8f96] text-[11px] font-medium px-3 py-1 rounded-full">
                        Today
                    </span>
                </div>

                <div className="flex flex-col w-full">
                    {messages.map((msg, index) => {
                        const isMyMessage = msg.senderEmail === myMail;
                        
                        const prevMsg = messages[index - 1];
                        const nextMsg = messages[index + 1];
                        
                        const isFirstInGroup = !prevMsg || prevMsg.senderEmail !== msg.senderEmail || prevMsg.time !== msg.time;
                        const isLastInGroup = !nextMsg || nextMsg.senderEmail !== msg.senderEmail || nextMsg.time !== msg.time;

                        if (msg.type === 'SYSTEM') {
                            return (
                                <div key={msg.tempId || msg.id} className="flex flex-col items-center justify-center my-5 animate-message-pop w-full gap-1.5">
                
                                    <span className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
                                        Today at {msg.time}
                                    </span>

                                    <span className="bg-[#161618] border border-[#2c2c2f] text-[#8f8f96] text-[12px] font-medium px-4 py-1.5 rounded-full shadow-sm">
                                        {msg.text}
                                    </span>
                                    
                                </div>
                            )
                        }

                        return (
                            <div 
                                key={msg.tempId || msg.id} 
                                className={`flex w-full animate-message-pop ${isMyMessage ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-6' : 'mb-1'}`}
                            >
                                <div className={`flex gap-3 max-w-2xl ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                    
                                    <div className="w-8 flex-shrink-0 flex items-end">
                                        {isLastInGroup && (
                                            <img 
                                                src={msg.avatar}
                                                alt={isMyMessage ? "You" : "User"} 
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        )}
                                    </div>
                                    
                                    <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                        
                                        {/* Name & Time */}
                                        {isFirstInGroup && (
                                            <div className={`flex items-baseline gap-2 mb-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <span className="text-[13px] font-semibold text-[#e1e1e3]">
                                                    {isMyMessage ? 'You' : msg.fullname}
                                                </span>
                                                <span className="text-[11px] text-[#8f8f96]">{msg.time}</span>
                                            </div>
                                        )}
                                        
                                        <div className={`px-4 py-2 w-fit ${
                                            isMyMessage 
                                                ? 'bg-[#8444f6] text-white' 
                                                : 'bg-[#161618] border border-[#2c2c2f] text-[#e1e1e3]'
                                        } 
                                        ${isMyMessage 
                                            ? `rounded-l-2xl ${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLastInGroup ? 'rounded-br-2xl' : 'rounded-br-md'}`
                                            : `rounded-r-2xl ${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLastInGroup ? 'rounded-bl-2xl' : 'rounded-bl-md'}`
                                        }`}>
                                            {msg.imageUrl && (
                                                <img 
                                                    src={msg.imageUrl} 
                                                    alt="Attachment" 
                                                    onClick={() => setZoomedImage(msg.imageUrl)}
                                                    className="max-w-[200px] sm:max-w-[250px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                />
                                            )}

                                            {msg.text && (
                                                <p className="text-[14px]">
                                                    {msg.text} 
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {typingUsers.length > 0 && (
                        <div className="flex w-full animate-in fade-in slide-in-from-bottom-2 mb-4 justify-start">
                            <div className="flex items-center gap-3 max-w-2xl">
                                
                                <div className="px-4 py-3.5 bg-[#161618] border border-[#2c2c2f] rounded-2xl rounded-bl-md flex items-center gap-1 w-fit h-9">
                                    <span className="w-1.5 h-1.5 bg-[#8f8f96] rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#8f8f96] rounded-full animate-typing-dot" style={{ animationDelay: '200ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#8f8f96] rounded-full animate-typing-dot" style={{ animationDelay: '400ms' }}></span>
                                </div>

                                <span className="text-[12px] font-medium text-[#8f8f96]">
                                    {typingUsers.length === 1 
                                        ? `${typingUsers[0]} is typing...` 
                                        : `${typingUsers.length} people are typing...`
                                    }
                                </span>
                                
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef}/>
                </div>
            </div>
            
            <div className="p-6 pt-2 shrink-0">
                <div className="border-t border-[#2c2c2f] pt-4">
                    
                    {selectedImage && (
                        <div className="mb-3 relative inline-block">
                            <div className="bg-[#161618] border border-[#2c2c2f] rounded-lg p-2 w-fit">
                                <img 
                                    src={selectedImage} 
                                    alt="Preview" 
                                    className="h-24 w-auto rounded object-cover"
                                />
                                <button 
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 bg-[#2a2a2e] border border-[#2c2c2f] hover:bg-red-500 hover:text-white hover:border-red-500 text-[#8f8f96] rounded-full w-6 h-6 flex items-center justify-center transition-colors shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="relative bg-[#161618] border border-[#2c2c2f] rounded-xl flex items-center px-4 py-3 focus-within:border-[#8444f6] transition-colors">
                        {showEmojiPicker && (
                            <div ref={pickerRef} className="absolute bottom-[110%] right-0 z-50 shadow-2xl">
                                <EmojiPicker 
                                    onEmojiClick={onEmojiClick} 
                                    theme="dark"
                                    autoFocusSearch={false}
                                />
                            </div>
                        )}

                        <input 
                            type="file" 
                            name="image"
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageSelect} 
                        />

                        <button 
                            onClick={() => fileInputRef.current.click()} 
                            className="text-[#8f8f96] hover:text-[#e1e1e3] transition-colors flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </button>

                        <input 
                            type="text" 
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message ${displayName?.split(' ')[0] || 'Group'}...`}
                            className="flex-1 bg-transparent border-none outline-none text-[#e1e1e3] text-[14px] placeholder-[#8f8f96] px-3"
                        />

                        <div className="flex items-center gap-3 flex-shrink-0 text-[#8f8f96]">
                            <button 
                                ref={buttonRef}
                                className={`transition-colors ${showEmojiPicker ? 'text-[#8444f6]' : 'hover:text-[#e1e1e3]'}`}
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                </svg>
                            </button>
                            
                            <button 
                                onClick={toggleListening}
                                className={`transition-all duration-200 ${
                                    isListening 
                                        ? 'text-red-500 animate-pulse scale-110'
                                        : 'text-[#8f8f96] hover:text-[#e1e1e3]'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            </button>
                            
                            <button className="hover:text-[#8444f6] transition-colors" onClick={sendMessage}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {zoomedImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
                    onClick={() => setZoomedImage(null)}
                >
                    <button 
                        onClick={() => setZoomedImage(null)}
                        className="absolute top-6 right-6 text-[#8f8f96] hover:text-white bg-[#161618]/50 hover:bg-[#2c2c2f] rounded-full p-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <img 
                        src={zoomedImage} 
                        alt="Zoomed"
                        onClick={(e) => e.stopPropagation()} 
                        className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200"
                    />
                </div>
            )}
            <GroupInfoDrawer 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                room={activeRoom}
                currentUser={user}
                onUpdateRoomInfo={handleUpdateRoomInfo}
            />
        </div>
    )
}