import { useEffect, useState, useRef } from "react"
import { io } from "socket.io-client";

const backend_url = import.meta.VITE_API_BASE_URL || "http://localhost:3000"
const socket = io(backend_url);

export default function ChatMessages({receiver}) {
    const token = localStorage.getItem("jwtToken");

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [errors, setErrors] = useState("");

    // Create referance
    const messagesEndRef = useRef(null);

    // Scroll to bottom smoothly
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages])

    // Get user identity
    const storedData = localStorage.getItem("userData");
    const myMail = storedData ? JSON.parse(storedData).email : null;
    const myId = storedData ? JSON.parse(storedData).id : null;

    // Tell socket server logged in user id
    useEffect(() => {
        if(!myId) return;
        
        const handleSetup = () => {
            socket.emit("setup", myId);
        }
        if(socket.connected) {
            handleSetup();
        }

        socket.on("connect", handleSetup);

        return () => {
            socket.off("connect", handleSetup);
        }
    }, [myId]);

    // FETCH CHAT HISTORY
    useEffect(() => {
        if(!receiver) return;
        setMessages([]);

        const fetchMessageHistory = async () => {
            try {
                const res = await fetch(`/api/messages/${receiver.id}`, {
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
    }, [receiver]);


    // Handle LIVE Messages
    useEffect(() => {
        const handleIncomingMessage = (msg) => {
            setMessages((prev) => [...prev, msg])
        }

        socket.on("receiveMessage", handleIncomingMessage);

        return () => socket.off("receiveMessage", handleIncomingMessage);
    }, []);


    // Handle Sending
    const sendMessage = () => {
        if(!inputText.trim() || !receiver) return;

        // Send text and email to sendMessage
        socket.emit("sendMessage", {
            text: inputText,
            senderMail: myMail,
            receiverId: receiver.id
        });
        setInputText("");
    }

    // Allow sending with enter key
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

                {/* CHAT MESSAGE BOX */}
                <div className="flex flex-col w-full gap-6">
                    {messages.map((msg, index) => {
                        const isMyMessage = msg.senderEmail === myMail;
                        return (
                            <div 
                                key={index} 
                                className={`flex w-full ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-2xl ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                    
                                    {/* User avatar */}
                                    <img 
                                        src={msg.avatar}
                                        alt={isMyMessage ? "You" : receiver.fullname} 
                                        className="w-8 h-8 rounded-full object-cover mt-1"
                                    />
                                    
                                    {/* Message Content */}
                                    <div className={`flex flex-col gap-1 ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                        {/* Name & Time */}
                                        <div className={`flex items-baseline gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[13px] font-semibold text-[#e1e1e3]">
                                                {isMyMessage ? 'You' : receiver.fullname}
                                            </span>
                                            <span className="text-[11px] text-[#8f8f96]">{msg.time}</span>
                                        </div>
                                        
                                        {/* Message Bubble */}
                                        <div className={`p-3 w-fit ${
                                            isMyMessage 
                                                ? 'bg-[#8444f6] text-white rounded-2xl rounded-tr-sm' 
                                                : 'bg-[#161618] border border-[#2c2c2f] text-[#e1e1e3] rounded-2xl rounded-tl-sm'
                                        }`}>
                                            <p className="text-[14px] mb-2">
                                                {msg.text} 
                                            </p>
                                            
                                            {/* Link Badge/Button */}
                                            {!isMyMessage && (
                                                <button className="bg-[#2563eb]/20 text-[#60a5fa] border border-[#3b82f6]/30 text-[10px] font-semibold px-2 py-0.5 rounded transition-colors hover:bg-[#2563eb]/30">
                                                    LINK
                                                </button>
                                            )}
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef}/>
                </div>
            </div>
            
            {/* Input section  */}
            <div className="p-6 pt-2 shrink-0">
                <div className="border-t border-[#2c2c2f] pt-4">
                    <div className="bg-[#161618] border border-[#2c2c2f] rounded-xl flex items-center px-4 py-3 focus-within:border-[#8444f6] transition-colors">
                        {/* Attachment Icon */}
                        <button className="text-[#8f8f96] hover:text-[#e1e1e3] transition-colors flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </button>

                        {/* Text Input */}
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message ${receiver.fullname ? receiver.fullname.split(' ')[0] : '...'}`}
                            className="flex-1 bg-transparent border-none outline-none text-[#e1e1e3] text-[14px] placeholder-[#8f8f96] px-3"
                        />

                        {/* Right Side Icons */}
                        <div className="flex items-center gap-3 flex-shrink-0 text-[#8f8f96]">
                            {/* Emoji Icon */}
                            <button className="hover:text-[#e1e1e3] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                </svg>
                            </button>
                            
                            {/* Mic Icon */}
                            <button className="hover:text-[#e1e1e3] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            </button>
                            
                            {/* Send Icon */}
                            <button className="hover:text-[#8444f6] transition-colors" onClick={sendMessage}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Helper Text (Keyboard Shortcuts) */}
                    <div className="flex justify-center mt-3 text-[#52525b] text-[10px]">
                        <p>
                            Press <kbd className="bg-[#161618] border border-[#2c2c2f] rounded px-1.5 py-0.5 mx-0.5 text-[#8f8f96] font-sans">Enter</kbd> to send, <kbd className="bg-[#161618] border border-[#2c2c2f] rounded px-1.5 py-0.5 mx-0.5 text-[#8f8f96] font-sans">Shift + Enter</kbd> for new line
                        </p>
                    </div>

                </div>
            </div>
        </div>
    )
}