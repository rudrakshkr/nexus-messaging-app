export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = true }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#161618] border border-[#2c2c2f] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                
                <h3 className="text-[17px] font-semibold text-[#e1e1e3] mb-2">
                    {title}
                </h3>
                
                <p className="text-[14px] text-[#8f8f96] mb-6 leading-relaxed">
                    {message}
                </p>
                
                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#e1e1e3] bg-[#2c2c2f] hover:bg-[#3a3a3e] transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                            isDestructive 
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                                : 'bg-[#8444f6] text-white hover:bg-[#7133d4]'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}