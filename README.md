# 🌌 Nexus - Real-Time Full-Stack Messaging Platform

Nexus is a high-performance, real-time chat application built with a modern JavaScript stack. It features a responsive, dark-themed native UI with advanced messaging capabilities including optimistic updates, message mutability (edit/delete), nested replies, mathematically verified read receipts, and deeply integrated AI assistance.

## ✨ Key Features

### ⚡ Real-Time Engine
* **Instant Messaging:** Bidirectional, low-latency communication powered by Socket.io.
* **Live Typing Indicators:** Multi-user typing states with animated UI indicators.
* **Online/Offline Status:** Real-time connection tracking and broadcasting.

### 💬 Advanced Message Lifecycle
* **State Tracking:** 3-tier visual delivery system (Pending, Delivered, Read) with natively styled SVG ticks.
* **Message Mutability:** Soft-delete and live-edit functionality with optimistic UI updates.
* **Contextual Replies:** Nested reply system with automatic scroll-to-reference and UI previews.
* **Persistence Math:** Intelligent backend calculation of read-receipt states across page reloads using database index thresholds (`unreadCount`), eliminating the need for heavy boolean columns.

### 🤖 AI Copilot & Accessibility
* **Intelligence Panel:** Integration with Google's Gemini 3.1 Flash Lite to generate conversation summaries, extract actionable tasks with Google Calendar links, and pull important URLs from the chat history.
* **Magic Compose:** AI-assisted text rewriting to instantly adjust message tone (Professional, Friendly, Grammatically Perfect).
* **Voice-to-Text:** Native Web Speech API integration for seamless dictation.

### 👥 Group Dynamics & Management
* **Role-Based Access Control:** Admin and Member roles for group chats.
* **Group Management:** Admins can kick users, promote members, and update the group name or avatar.

### 🎨 Premium UI/UX
* **Dark Mode Native:** Tailored dark-theme aesthetics with crisp, high-contrast text and responsive design.
* **Media Handling:** Image uploads via Cloudinary with maximum size validation (25MB) and fullscreen zoom previews.
* **Emoji Integration:** Floating, click-away emoji picker mapped seamlessly to the input field.
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

---

## 🚀 Installation & Setup

### Prerequisites
* Node.js (v18+ recommended)
* PostgreSQL database

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/nexus-messaging-app.git](https://github.com/yourusername/nexus-messaging-app.git)
cd nexus-messaging-app