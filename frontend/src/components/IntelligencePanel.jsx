import { useEffect, useState } from "react";
import { TailSpin } from "react-loader-spinner";

export default function IntelligencePanel({ isOpen, onClose, roomId }) {
    const token = localStorage.getItem("jwtToken");
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !roomId) return;

        const fetchIntelligence = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/intelligence/${roomId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const parsedData = await res.json();
                    setData(parsedData);
                }
            } catch (err) {
                console.error("Failed to fetch AI data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIntelligence();
    }, [isOpen, roomId, token]);

    if (!isOpen) return null;

    return (
        <div className="w-[320px] lg:w-[350px] flex-shrink-0 bg-[#161618] border-l border-[#2c2c2f] flex flex-col h-full animate-in slide-in-from-right duration-200 z-40">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2c2c2f]">
                <div className="flex items-center gap-2 text-[#e1e1e3]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8444f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
                    </svg>
                    <h2 className="text-[15px] font-semibold">Intelligence</h2>
                </div>
                <button onClick={onClose} className="text-[#8f8f96] hover:text-[#e1e1e3] transition-colors p-1.5 rounded-md hover:bg-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-[#8f8f96]">
                        <TailSpin visible={true} height="35" width="35" color="#8444f6" radius="1" />
                        <p className="text-[13px] font-medium animate-pulse">Analyzing conversation...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* 1. Summary Section */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[12px] font-semibold text-[#8f8f96] uppercase tracking-wider flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                AI Summary
                            </h3>
                            <div className="bg-white/5 border border-[#2c2c2f] rounded-xl p-4 text-[13.5px] text-[#e1e1e3] leading-relaxed shadow-inner">
                                {data.summary}
                            </div>
                        </div>

                        {/* 2. Extracted Tasks */}
                        {data.tasks && data.tasks.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[12px] font-semibold text-[#8f8f96] uppercase tracking-wider flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                                        Extracted Tasks
                                    </div>
                                    <span className="bg-[#2c2c2f] text-white text-[10px] px-2 py-0.5 rounded-full">{data.tasks.length}</span>
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {data.tasks.map((task, i) => (
                                        <div key={i} className="bg-white/5 border border-[#2c2c2f] rounded-xl p-3.5 flex items-start gap-3 hover:border-[#8444f6]/50 transition-colors group">
                                            <input type="checkbox" className="mt-1 accent-[#8444f6] w-4 h-4 rounded border-[#2c2c2f] bg-[#0a0a0a] cursor-pointer" />
                                            <div className="flex flex-col gap-1.5 mt-0.5">
                                                <span className="text-[13px] text-[#e1e1e3] font-medium leading-snug">{task.title}</span>
                                                {task.dueDate && task.dueDate !== 'No date' && (
                                                    <span className="text-[11px] font-medium text-[#8f8f96] flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                        {task.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Important Links */}
                        {data.links && data.links.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[12px] font-semibold text-[#8f8f96] uppercase tracking-wider flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                        Important Links
                                    </div>
                                    <span className="bg-[#2c2c2f] text-white text-[10px] px-2 py-0.5 rounded-full">{data.links.length}</span>
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {data.links.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-[#2c2c2f] rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors group">
                                            <div className="w-9 h-9 rounded-lg bg-[#2c2c2f] flex items-center justify-center text-[#8f8f96] group-hover:text-[#8444f6] group-hover:bg-[#8444f6]/10 transition-colors flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-[13.5px] text-[#e1e1e3] font-medium truncate">{link.title}</span>
                                                <span className="text-[11px] text-[#8f8f96] truncate mt-0.5">
                                                    {(() => {
                                                        try { return new URL(link.url).hostname } 
                                                        catch(e) { return link.url }
                                                    })()}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[13px] text-[#8f8f96] text-center px-4">
                        Send some messages to generate AI intelligence.
                    </div>
                )}
            </div>
        </div>
    );
}