import { useState, useEffect } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import Toast from "@/Components/App/Toast";
import NewMessageNotification from "@/Components/App/NewMessageNotification";
import PrimaryButton from "@/Components/PrimaryButton";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import NewUserModal from "@/Components/App/NewUserModal";
import UserAvatar from "@/Components/App/UserAvatar";

// Componente principal de layout para usuarios autenticados
export default function Authenticated({ header, children }) {
    // Obtenemos datos de usuario y conversaciones desde la página actual
    const page = usePage();
    const user = page.props.auth.user;
    const conversations = page.props.conversations;

    // Estado para mostrar/ocultar menú de navegación y modal de nuevo usuario
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showNewUserModal, setShowNewUserModal] = useState(false);

    // EventBus para emitir eventos globales (notificaciones, mensajes, etc)
    const { emit } = useEventBus();

    // Suscripción a canales de Echo para recibir mensajes y eventos en tiempo real
    useEffect(() => {
        conversations.forEach((conversation) => {
            // Determina el nombre del canal según si es grupo o usuario
            let channel = `message.group.${conversation.id}`;
            if (conversation.is_user) {
                channel = `message.user.${[
                    parseInt(user.id),
                    parseInt(conversation.id),
                ]
                    .sort((a, b) => a - b)
                    .join("-")}`;
            }

            // Suscríbete al canal de mensajes
            Echo.private(channel)
                .error((error) => {
                    // Manejo de errores de conexión al canal
                    console.error(error);
                })
                .listen("SocketMessage", (e) => {
                    // Evento recibido cuando llega un nuevo mensaje por websocket
                    const message = e.message;

                    // Emitimos evento global para actualizar la UI con el nuevo mensaje
                    emit("message.created", message);

                    // Si el mensaje es del usuario actual, no mostramos notificación
                    if (message.sender_id === user.id) {
                        return;
                    }

                    // Emitimos evento para mostrar notificación de nuevo mensaje
                    emit("newMessageNotification", {
                        user: message.sender,
                        group_id: message.group_id,
                        message:
                            message.message ||
                            `Shared ${
                                message.attachments.length === 1
                                    ? "an attachment"
                                    : message.attachments.length + " attachments"
                            }`,
                    });
                });

            // Si la conversación es de grupo, suscríbete también a eventos de eliminación de grupo
            if (conversation.is_group) {
                Echo.private(`group.deleted.${conversation.id}`)
                    .listen("GroupDeleted", (e) => {
                        // Emitimos evento global cuando se elimina un grupo
                        emit("group.deleted", { id: e.id, name: e.name });
                    })
                    .error((e) => {
                        // Manejo de errores de conexión al canal de grupo eliminado
                        console.error(e);
                    });
            }
        });

        // Cleanup: al desmontar o cambiar conversaciones, salimos de los canales
        return () => {
            conversations.forEach((conversation) => {
                let channel = `message.group.${conversation.id}`;
                if (conversation.is_user) {
                    channel = `message.user.${[
                        parseInt(user.id),
                        parseInt(conversation.id),
                    ]
                        .sort((a, b) => a - b)
                        .join("-")}`;
                }
                Echo.leave(channel);

                if (conversation.is_group) {
                    Echo.leave(`group.deleted.${conversation.id}`);
                }
            });
        };
    }, [conversations]); // Se ejecuta cada vez que cambian las conversaciones

    return (
        <>
            {/* Layout principal de la aplicación */}
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col h-screen">
                {/* Barra de navegación superior */}
                <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <div className="mx-auto px-4 sm:px-6">
                        <div className="flex justify-between h-16">
                            {/* Logo de la aplicación */}
                            <div className="flex">
                                <div className="shrink-0 flex items-center">
                                    <Link href="/">
                                        <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" />
                                    </Link>
                                </div>
                            </div>

                            {/* Botones y menú de usuario (escritorio) */}
                            <div className="hidden sm:flex sm:items-center sm:ms-6">
                                <div className="flex ms-3 relative">
                                    {/* Botón para agregar nuevo usuario (solo admin) */}
                                    {user.is_admin && (
                                        <PrimaryButton
                                            onClick={() => setShowNewUserModal(true)}
                                        >
                                            <UserPlusIcon className="h-5 w-5 mr-2" />
                                            Add New User
                                        </PrimaryButton>
                                    )}

                                    {/* Dropdown de usuario */}
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition ease-in-out duration-150"
                                                >
                                                    <UserAvatar user={user} position="left"/>
                                                    <span className="ml-2">{user.name}</span>
                                                    {/* Flecha del dropdown */}
                                                    <svg
                                                        className="ms-2 -me-0.5 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />  
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        {/* Opciones del dropdown */}
                                        <Dropdown.Content>
                                            <Dropdown.Link href={route("profile.edit")}>
                                                Profile
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route("logout")}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Botón de menú hamburguesa (móvil) */}
                            <div className="-me-2 flex items-center sm:hidden">
                                <button
                                    onClick={() =>
                                        setShowingNavigationDropdown(
                                            (previousState) => !previousState
                                        )
                                    }
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-gray-500 dark:focus:text-gray-400 transition duration-150 ease-in-out"
                                >
                                    {/* Icono de menú */}
                                    <svg
                                        className="h-6 w-6"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            className={
                                                !showingNavigationDropdown
                                                    ? "inline-flex"
                                                    : "hidden"
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={
                                                showingNavigationDropdown
                                                    ? "inline-flex"
                                                    : "hidden"
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Menú de usuario (móvil) */}
                    <div
                        className={
                            (showingNavigationDropdown ? "block" : "hidden") +
                            " sm:hidden"
                        }
                    >
                        <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-600">
                            <div className="px-4">
                                <div className="font-medium text-base text-gray-800 dark:text-gray-200">
                                    {user.name}
                                </div>
                                <div className="font-medium text-sm text-gray-500">
                                    {user.email}
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink href={route("profile.edit")}>
                                    Profile
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    method="post"
                                    href={route("logout")}
                                    as="button"
                                >
                                    Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Header opcional */}
                {header && (
                    <header className="bg-white dark:bg-gray-800 shadow">
                        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Contenido principal de la página */}
                {children}
            </div>
            {/* Componente de notificaciones tipo toast */}
            <Toast />
            {/* Notificación de nuevo mensaje */}
            <NewMessageNotification />
            {/* Modal para agregar nuevo usuario */}
            <NewUserModal
                show={showNewUserModal}
                onClose={() => setShowNewUserModal(false)}
            />
        </>
    );
}
