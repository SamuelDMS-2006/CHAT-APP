import { usePage } from "@inertiajs/react";
import ReactMarkdown from "react-markdown";
import React, { useState, useEffect, useRef } from "react";
import UserAvatar from "./UserAvatar";
import { formatMessageDateLong } from "@/helpers";
import MessageAttachments from "./MessageAttachments";
import MessageOptionsDropdown from "./MessageOptionsDropdown";
import axios from "axios";

// Componente que representa un mensaje individual en el chat
const MessageItem = ({ message, attachmentClick, onReply }) => {
    const currentUser = usePage().props.auth.user;
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reactions, setReactions] = useState(message.reactions || {});
    const [error, setError] = useState(null);
    const emojiBtnRef = useRef();

    // Obtiene el emoji con el que el usuario actual reaccionó (si existe)
    const userEmoji = React.useMemo(() => {
        return (
            Object.entries(reactions).find(([emoji, users]) =>
                users.some((u) => u.id === currentUser.id)
            )?.[0] || null
        );
    }, [reactions, currentUser.id]);

    // Actualiza las reacciones en tiempo real usando Echo
    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private(`chat.message.${message.id}`);
        channel.listen("MessageReacted", (data) => {
            setReactions((prev) => {
                const emoji = data.reaction.emoji;
                const user = data.reaction.user;
                let newReactions = { ...prev };
                Object.keys(newReactions).forEach((em) => {
                    newReactions[em] = newReactions[em].filter((u) => u.id !== user.id);
                    if (newReactions[em].length === 0) delete newReactions[em];
                });
                if (data.reaction.action === "add") {
                    if (!newReactions[emoji]) newReactions[emoji] = [];
                    newReactions[emoji].push(user);
                }
                return newReactions;
            });
        });
        return () => channel.stopListening("MessageReacted");
    }, [message.id]);

    // Maneja agregar o quitar reacción del usuario actual
    const handleReact = async (emoji) => {
        setShowEmojiPicker(false);
        setError(null);
        try {
            if (userEmoji === emoji) {
                await axios.delete(`/message/${message.id}/react`, { data: { emoji } });
            } else {
                await axios.post(`/message/${message.id}/react`, { emoji });
            }
        } catch {
            setError("No se pudo actualizar la reacción.");
        }
    };

    // Cierra el picker de emojis si se hace click fuera de él
    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiBtnRef.current && !emojiBtnRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        }
        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmojiPicker]);

    const isOwn = message.sender_id === currentUser.id;
    const bubbleClass = `chat-bubble relative ${isOwn ? "chat-bubble-info" : ""} max-w-[70%] w-fit`;
    const containerClass = `chat ${isOwn ? "chat-end mr-4" : "chat-start ml-4"}`;

    return (
        <div className={containerClass}>
            {/* Avatar del usuario */}
            <UserAvatar user={message.sender}/> 
            {/* Cabecera del mensaje: nombre y fecha */}
            <div className="chat-header">
                {!isOwn && message.sender.name}
                <time className="text-xs opacity-50 ml-2">
                    {formatMessageDateLong(message.created_at)}
                </time>
            </div>

            {/* Si es una respuesta, muestra el mensaje al que responde */}
            {message.reply_to && (
                <div className="bg-gray-800 p-2 rounded mb-1 text-xs text-gray-300 border-l-4 border-blue-400">
                    <span className="font-semibold">
                        {message.reply_to.sender?.name}:
                    </span>{" "}
                    <span className="italic">{message.reply_to.message}</span>
                </div>
            )}

            <div className={bubbleClass}>
                {/* Avatar del usuario (solo si no es propio) */}
                <div>
                    {/* Dropdown de opciones del mensaje (responder, eliminar, reaccionar y reacciones) */}
                    <MessageOptionsDropdown
                        message={message}
                        onReact={handleReact}
                        userEmoji={userEmoji}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                        emojiBtnRef={emojiBtnRef}
                        position={isOwn ? "left" : "right"}
                        reactions={reactions}
                        currentUser={currentUser}
                    />
                </div>

                <div className="flex-1 min-w-0 flex items-center">
                    <div className="chat-message flex-1">
                        <div className="chat-message-content">
                            {/* Renderiza el contenido del mensaje con soporte Markdown */}
                            <ReactMarkdown>{message.message}</ReactMarkdown>
                        </div>
                        {/* Adjuntos del mensaje */}
                        <MessageAttachments
                            attachments={message.attachments}
                            attachmentClick={attachmentClick}
                        />
                        {/* Muestra errores de reacción si existen */}
                        {error && (
                            <div className="text-red-400 text-xs mt-1">{error}</div>
                        )}
                        {/* Reacciones debajo del mensaje */}
                        {Object.keys(reactions).length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {Object.entries(reactions).map(([emoji, users]) => (
                                    <span
                                        key={emoji}
                                        className={`px-2 py-1 bg-gray-700 rounded-full text-lg cursor-pointer ${
                                            users.some((u) => u.id === currentUser.id)
                                                ? "ring-2 ring-yellow-400"
                                                : ""
                                        }`}
                                        title={users.map((u) => u.name).join(", ")}
                                        onClick={() =>
                                            users.some((u) => u.id === currentUser.id)
                                                ? handleReact(emoji)
                                                : undefined
                                        }
                                    >
                                        {emoji} {users.length}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
