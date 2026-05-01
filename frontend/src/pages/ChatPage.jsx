import Sidebar from "../components/Sidebar"
import ChatHeader from "../components/ChatHeader"
import ChatMessages from "../components/ChatMessages"

export default function ChatPage({user, setUser}) {
    return (
        <main className="w-full min-h-screen flex bg-[#0f0f0f] text-white font-sans">
            {/* Chat Sidebar  */}
            <Sidebar user={user} setUser={setUser} />
            {/* Chat section  */}
            <section className="flex flex-col flex-[5] border-l border-[#2c2c2f]">
                {/* CHAT HEADER  */}
                <ChatHeader />
                
                {/* Chat Messages */}
                <ChatMessages />
            </section>
        </main>
    )
}