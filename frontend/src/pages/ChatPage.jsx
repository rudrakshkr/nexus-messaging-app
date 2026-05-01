import Sidebar from "../components/Sidebar"

export default function ChatPage({user, setUser}) {
    return (
        <main className="w-full min-h-screen flex bg-[#0f0f0f] text-white font-sans">
            {/* Chat Sidebar  */}
            <Sidebar user={user} setUser={setUser} />
            {/* Chat section  */}
            <section className="flex flex-[5]">
                <p>This is a chat sectionnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn</p>
            </section>
        </main>
    )
}