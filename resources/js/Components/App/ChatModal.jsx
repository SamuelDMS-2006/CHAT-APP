import { useState } from "react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";

const countries = [
    { name: "México", code: "+52", flag: "🇲🇽" },
    { name: "Estados Unidos", code: "+1", flag: "🇺🇸" },
    { name: "España", code: "+34", flag: "🇪🇸" },
    { name: "Colombia", code: "+57", flag: "🇨🇴" },
    // Agrega más países aquí
];

export default function ChatModal({ onClose, onChatStart }) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        country: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        if (!csrfToken) {
            console.error("CSRF token no encontrado");
            return;
        }

        try {
            const response = await fetch("chat-users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                console.log("Datos enviados correctamente");
                onChatStart(); // Llamar a la función para mostrar la ventana flotante
            } else {
                console.error("Error al enviar los datos");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <Modal show={true} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Para chatear con un asesor académico, por favor regálanos
                    estos datos antes de iniciar el chat.
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recuerda que cada vez que regreses, debes usar tu mismo
                    número de WhatsApp.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full mt-1 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Número de Celular / Whatsapp
                        </label>
                        <div className="flex gap-2">
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-1/3 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="">País</option>
                                {countries.map((country) => (
                                    <option
                                        key={country.code}
                                        value={country.code}
                                    >
                                        {country.flag} {country.name} (
                                        {country.code})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-2/3 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <PrimaryButton type="submit">Iniciar Chat</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
