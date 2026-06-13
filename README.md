# 🌌 Nexus - Real-Time Full-Stack Messaging Platform

Nexus is a high-performance, real-time chat application utilizing a modern JavaScript stack. Features include responsive, dark-themed native UI and advanced messaging capabilities such as optimistic updates, message mutability (editing/deleting), nested replies, read-receipts and integrated AI assistant features.

## ✨ Key Features

### ⚡ Real-Time Engine
* **Instant Messaging:** Bidirectional communication using Socket.io.
* **Live Typing Indicators:** Animated indicators with multi-user typing states.
* **Online/Offline Status:** Real-time connection tracking and broadcasting.

### 💬 Advanced Message Lifecycle
* **State Tracking:** 3-tier delivery system (Pending, Delivered, Read)
* **Message Mutability:** Soft-delete and live-edit functionality with optimistic UI updates.
* **Contextual Replies:** Nested reply system with UI previews and automatic scrolling to reference

### 🤖 AI Copilot & Accessibility
* **Intelligence Panel:** integration with Google's Gemini 3.1 Flash Lite to generate summaries, extract actionable tasks and important URLs
* **Magic Compose:** AI-powered text editing that instantly alters message tone (Professional, Friendly, Grammatically Perfect)
* **Voice-to-Text:** Native Web Speech API integration

### 👥 Group Dynamics & Management
* **Role-Based Access Control:** Admin and Member roles for group chats.
* **Group Management:** Admins can kick users, promote members, and update the group name or avatar.

### 🎨 UI/UX
* **Dark Mode Native:** Custom-designed dark-themed aesthetics and a fully responsive interface.
* **Media Handling:** Image uploads via Cloudinary with a 25MB max size limit, and fullscreen zoom previews.
* **Emoji Integration:** Floating emoji picker mapped to the input field.
* **Security:** Live password strength indicator during account creation.

---

## 🛠️ Tech Stack

**Frontend:**
* React 19 & Vite
* Tailwind CSS (Styling & Animations)
* Socket.io-client (Real-time events)
* React Hook Form (Form validation)

**Backend:**
* Node.js & Express.js
* Socket.io (WebSocket server)
* Prisma ORM
* PostgreSQL (Relational Database)
* JSON Web Tokens (JWT) & bcryptjs (Authentication/Security)
* Google Generative AI SDK
* Cloudinary (Media Storage)

---

## 📦 Database Schema (Prisma)

Nexus uses a optimized relational structure. Key models include:

* **Users:** Tracks authentication and profile data (`avatar`, `fullname`).
* **Room / RoomParticipant:** Manages direct and group chat environments, alongside `role` permissions and `unreadCount` tracking for accurate read-receipt mathematics.
* **Message:** Tracks content (`text`, `imageUrl`), mutability (`isEdited`, `isDeleted`), and self-relations (`replyToId`) for thread contexts.
