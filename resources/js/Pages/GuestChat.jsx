import { useEffect, useState, useRef } from "react";
import ConversationHeader from "@/Components/App/ConversationHeader";
import MessageItem from "@/Components/App/MessageItem";
import MessageInput from "@/Components/App/MessageInput";

export default function GuestChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const guestUser = JSON.parse(localStorage.getItem("guestUser") || "{}");
    const messagesEndRef = useRef(null);

    // Simulación de conversación (puedes conectar a backend aquí)
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages([...messages, {
            id: Date.now(),
            message: input,
            sender: { name: guestUser.name },
            created_at: new Date().toISOString(),
        }]);
        setInput("");
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Estructura central tipo chat, sin navbar ni sidebar
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded shadow-md flex flex-col h-[80vh]">
                <ConversationHeader
                    selectedConversation={{
                        name: guestUser.name || "Invitado",
                        phone: guestUser.phone || "Desconocido",
                        is_user: true,
                    }}
                />
                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((msg, idx) => (
                        <MessageItem key={idx} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <MessageInput 
                    input={input} 
                    setInput={setInput} 
                    sendMessage={sendMessage} 
                />
            </div>
        </div>
    );
}