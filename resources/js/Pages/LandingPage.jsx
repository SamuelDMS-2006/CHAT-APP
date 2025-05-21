import { useState } from "react";
import ChatModal from "@/Components/App/ChatModal";
import FloatingChat from "@/Components/App/FloatingChat";

export default function LandingPage() {
    const [showChatModal, setShowChatModal] = useState(false);
    const [showFloatingChat, setShowFloatingChat] = useState(false); // Estado para la ventana de chat

    const handleChatStart = () => {
        setShowChatModal(false); // Cierra el modal
        setShowFloatingChat(true); // Muestra la ventana de chat
    };

    const handleCloseFloatingChat = () => {
        setShowFloatingChat(false); // Cierra la ventana flotante
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <h1 className="text-2xl font-bold">
                Bienvenido a nuestra plataforma
            </h1>
            <button
                className="fixed bottom-5 right-5 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
                onClick={() => setShowChatModal(true)}
            >
                Abrir Chat
            </button>
            {showChatModal && (
                <ChatModal
                    onClose={() => setShowChatModal(false)}
                    onChatStart={handleChatStart} // Pasar el manejador al modal
                />
            )}
            {showFloatingChat && (
                <FloatingChat onClose={handleCloseFloatingChat} />
            )}{" "}
            {/* Mostrar la ventana de chat */}
        </div>
    );
}
