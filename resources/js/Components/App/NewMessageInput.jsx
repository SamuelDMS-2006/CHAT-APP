import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const NewMessageInput = ({ value, onChange, onSend, id, name }) => {
    const input = useRef();
    const [quickReplies, setQuickReplies] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredReplies, setFilteredReplies] = useState([]);
    const [suggestionIndex, setSuggestionIndex] = useState(0);

    useEffect(() => {
        axios.get("/api/quick-replies").then(res => setQuickReplies(res.data));
    }, []);

    const onInputKeyDown = (ev) => {
        if (showSuggestions) {
            if (ev.key === "ArrowDown") {
                setSuggestionIndex((prev) => (prev + 1) % filteredReplies.length);
                ev.preventDefault();
            } else if (ev.key === "ArrowUp") {
                setSuggestionIndex((prev) => (prev - 1 + filteredReplies.length) % filteredReplies.length);
                ev.preventDefault();
            } else if (ev.key === "Enter") {
                if (filteredReplies.length > 0) {
                    onSuggestionClick(filteredReplies[suggestionIndex]);
                    ev.preventDefault();
                    return;
                }
            } else if (ev.key === "Escape") {
                setShowSuggestions(false);
            }
        }
        if (ev.key === "Enter" && !ev.shiftKey && !showSuggestions) {
            ev.preventDefault();
            onSend();
        }
    };

    const onChangeEvent = (ev) => {
        setTimeout(() => {
            adjustHeight();
        }, 10);
        onChange(ev);

        const value = ev.target.value;
        const match = value.match(/\/(\w*)$/);
        if (match) {
            const search = match[0].toLowerCase();
            const filtered = Object.keys(quickReplies).filter(key =>
                key.toLowerCase().startsWith(search)
            );
            setFilteredReplies(filtered);
            setShowSuggestions(filtered.length > 0);
            setSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const onSuggestionClick = (key) => {
        // Reemplaza el comando por el mensaje de respuesta rápida
        const newValue = value.replace(/\/\w*$/, quickReplies[key]);
        onChange({ target: { value: newValue } });
        setShowSuggestions(false);
        setTimeout(() => input.current.focus(), 0);
    };

    const adjustHeight = () => {
        setTimeout(() => {
            input.current.style.height = "auto";
            input.current.style.height = input.current.scrollHeight + 1 + "px";
        }, 100);
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <>
            {showSuggestions && (
                <ul
                    className="absolute left-0 bottom-full w-full mb-2 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto animate-fade-in"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                >
                    {filteredReplies.length === 0 && (
                        <li className="px-4 py-2 text-gray-400 text-sm">Sin coincidencias</li>
                    )}
                    {filteredReplies.map((key, idx) => (
                        <li
                            key={key}
                            className={`flex items-start gap-2 px-4 py-2 cursor-pointer transition-colors ${
                                idx === suggestionIndex
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-blue-50 dark:hover:bg-gray-800"
                            }`}
                            onMouseDown={() => onSuggestionClick(key)}
                        >
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">/{key}</span>
                        </li>
                    ))}
                </ul>
            )}
            <textarea
                id={id}
                name={name}
                ref={input}
                value={value}
                rows="1"
                placeholder="Type a message"
                onKeyDown={onInputKeyDown}
                onChange={onChangeEvent}
                className="input input-bordered w-full rounded-r-none resize-none overflow-y-auto max-h-40"
            ></textarea>
        </>
    );
};

export default NewMessageInput;
