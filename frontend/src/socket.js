import { io } from "socket.io-client";

const backend_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const socket = io(backend_url);