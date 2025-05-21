import PrimaryButton from "@/Components/PrimaryButton";
import MessageInput from "@/Components/App/MessageInput";
import { useRef, useState, useEffect, useCallback } from "react";
import { useEventBus } from "@/EventBus";

export default function FloatingChat({
    selectedConversation = null,
    messages = null,
    onClose,
}) {
    const [isMinimized, setIsMinimized] = useState(false); // Estado para minimizar/maximizar
    const [message, setMessage] = useState("");
    const [localMessages, setLocalMessages] = useState([]);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const [scrollFromBottom, setScrollFromBottom] = useState(0);
    const loadMoreIntersect = useRef(null);
    const messagesCtrRef = useRef(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState({});
    const { on } = useEventBus();

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            console.log("Mensaje enviado:", message);
            setMessage(""); // Limpiar el campo de entrada
        }
    };

    const messageCreated = (message) => {
        if (
            selectedConversation &&
            selectedConversation.is_group &&
            selectedConversation.id == message.group_id
        ) {
            setLocalMessages((prevMessages) => [...prevMessages, message]);
        }
        if (
            selectedConversation &&
            selectedConversation.is_user &&
            (selectedConversation.id == message.sender_id ||
                selectedConversation.id == message.receiver_id)
        ) {
            setLocalMessages((prevMessages) => [...prevMessages, message]);
        }
    };

    const messageDeleted = ({ message }) => {
        if (
            selectedConversation &&
            selectedConversation.is_group &&
            selectedConversation.id == message.group_id
        ) {
            setLocalMessages((prevMessages) => {
                return prevMessages.filter((m) => m.id !== message.id);
            });
        }
        if (
            selectedConversation &&
            selectedConversation.is_user &&
            (selectedConversation.id == message.sender_id ||
                selectedConversation.id == message.receiver_id)
        ) {
            setLocalMessages((prevMessages) => {
                return prevMessages.filter((m) => m.id !== message.id);
            });
        }
    };

    useEffect(() => {
        setTimeout(() => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTop =
                    messagesCtrRef.current.scrollHeight;
            }
        }, 10);

        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);

        setScrollFromBottom(0);
        setNoMoreMessages(false);

        return () => {
            offCreated();
            offDeleted();
        };
    }, [selectedConversation]);

    return (
        <div
            className={`fixed bottom-5 right-5 w-80 ${
                isMinimized ? "h-120" : "h-96"
            } bg-gray-800 text-gray-100 border border-gray-700 rounded-lg shadow-lg flex flex-col`}
        >
            {/* Encabezado */}
            <div className="bg-indigo-600 text-white p-3 flex justify-between items-center rounded-t-lg">
                <h3 className="text-lg font-semibold">
                    {isMinimized ? "Chat (Minimizado)" : "Chat"}
                </h3>
                <div className="flex gap-2">
                    {/* Botón para minimizar/maximizar */}
                    <button
                        className="text-gray-200 hover:text-white focus:outline-none"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? "⬆" : "⬇"}
                    </button>
                    {/* Botón para cerrar */}
                    <button
                        className="text-gray-200 hover:text-white focus:outline-none"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Cuerpo del chat */}
            {!isMinimized && (
                <>
                    <div className="flex-1 p-3 overflow-y-auto bg-gray-900">
                        <p className="text-gray-400 text-sm">
                            ¡Hola! ¿En qué puedo ayudarte?
                        </p>
                        {/* Aquí puedes agregar mensajes dinámicos */}
                    </div>

                    {/* Input para enviar mensajes */}
                    <div className="p-3 border-t border-gray-700 bg-gray-800">
                        <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2"
                        >
                            <MessageInput conversation={selectedConversation} />
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
