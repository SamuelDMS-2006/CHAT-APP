import { Link, usePage } from "@inertiajs/react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/solid";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";
import GroupDescriptionPopover from "./GroupDescriptionPopover";
import GroupUsersPopover from "./GroupUsersPopover";
import { useEventBus } from "@/EventBus";
import { useState, useEffect } from "react";

const ConversationHeader = ({ selectedConversation }) => {
    const page = usePage();
    const currentUser = page.props.auth.user;
    const asesors = page.props.asesors;
    const { emit } = useEventBus();
    const [sortedAsesors, setSortedAsesors] = useState([]);

    const status = [
        {
            id: 1,
            name: "gris",
            color: "bg-gray-500",
        },
        {
            id: 2,
            name: "amarillo",
            color: "bg-yellow-500",
        },
        {
            id: 3,
            name: "verde",
            color: "bg-green-500",
        },
        {
            id: 4,
            name: "naranja",
            color: "bg-orange-500",
        },
        {
            id: 5,
            name: "rojo",
            color: "bg-red-500",
        },
    ];

    const onDeleteGroup = () => {
        if (!window.confirm("Are you sure you want to delete this group?")) {
            return;
        }

        axios
            .delete(route("group.destroy", selectedConversation.id))
            .then((res) => {
                console.log(res);
                emit("toast.show", res.data.message);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const asignAsesor = (asesorId) => {
        axios
            .post(
                route("user.asignAsesor", [selectedConversation.id, asesorId])
            )
            .then((res) => {
                emit("toast.show", res.data.message);
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const changeStatus = (newStatus) => {
        axios
            .post(
                route("user.changeStatus", [selectedConversation.id, newStatus])
            )
            .then((res) => {
                emit("toast.show", res.data.message);
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    useEffect(() => {
        if (asesors && asesors.length > 0) {
            const sorted = [...asesors].sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            setSortedAsesors(sorted);
        }
    }, [asesors]);

    return (
        <>
            {selectedConversation && (
                <div className="p-3 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("dashboard")}
                            className="inline-block sm:hidden"
                        >
                            <ArrowLeftIcon className="w-6" />
                        </Link>
                        {selectedConversation.is_user && (
                            <UserAvatar user={selectedConversation} />
                        )}
                        {selectedConversation.is_group && <GroupAvatar />}
                        <div>
                            <h3>{selectedConversation.name}</h3>
                            {selectedConversation.is_group && (
                                <p className="text-xs text-gray-500">
                                    {selectedConversation.users.length} members
                                </p>
                            )}
                        </div>
                    </div>
                    {selectedConversation.is_group && (
                        <div className="flex gap-3">
                            <GroupDescriptionPopover
                                description={selectedConversation.description}
                            />
                            <GroupUsersPopover
                                users={selectedConversation.users}
                            />
                            {selectedConversation.owner_id ==
                                currentUser.id && (
                                <>
                                    <div
                                        className="tooltip tooltip-left"
                                        data-tip="Edit Group"
                                    >
                                        <button
                                            onClick={(ev) =>
                                                emit(
                                                    "GroupModal.show",
                                                    selectedConversation
                                                )
                                            }
                                            className="text-gray-400 hover:text-gray-200"
                                        >
                                            <PencilSquareIcon className="w-4" />
                                        </button>
                                    </div>
                                    <div
                                        className="tooltip tooltip-left"
                                        data-tip="Delete Group"
                                    >
                                        <button
                                            onClick={onDeleteGroup}
                                            className="text-gray-400 hover:text-gray-200"
                                        >
                                            <TrashIcon className="w-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {!selectedConversation.is_admin &&
                        !selectedConversation.is_asesor &&
                        currentUser.is_asesor && (
                            <div className="flex flex-row gap-2 items-start">
                                <Menu
                                    as="div"
                                    className="relative inline-block text-left"
                                >
                                    <Menu.Button className="flex items-center rounded-md px-3 py-2 text-sm text-gray-100 hover:bg-black/30 bg-gray-700">
                                        <UserIcon className="w-4 h-4 mr-2" />
                                        Asign Asesor
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute light-full top-10 right-0 ml-2 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                                            <div className="px-1 py-1">
                                                {sortedAsesors &&
                                                    sortedAsesors.map(
                                                        (asesor) => (
                                                            <Menu.Item
                                                                key={asesor.id}
                                                            >
                                                                {({
                                                                    active,
                                                                }) => (
                                                                    <button
                                                                        onClick={() =>
                                                                            asignAsesor(
                                                                                asesor.id
                                                                            )
                                                                        }
                                                                        className={`${
                                                                            active
                                                                                ? "bg-black/30 text-white"
                                                                                : "text-gray-100"
                                                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                    >
                                                                        <h3 className="text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                                                                            {
                                                                                asesor.name
                                                                            }
                                                                        </h3>
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        )
                                                    )}
                                            </div>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>

                                <Menu
                                    as="div"
                                    className="relative inline-block text-left"
                                >
                                    <Menu.Button className="flex items-center rounded-md px-3 py-2 text-sm text-gray-100 hover:bg-black/30 bg-gray-700">
                                        <UserIcon className="w-4 h-4 mr-2" />
                                        Cambiar Estado
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute light-full top-10 right-0 ml-2 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                                            <div className="px-1 py-1">
                                                {status &&
                                                    status.map((status) => (
                                                        <Menu.Item
                                                            key={status.id}
                                                        >
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() =>
                                                                        changeStatus(
                                                                            status.id
                                                                        )
                                                                    }
                                                                    className={`${
                                                                        active
                                                                            ? "bg-black/30 text-white"
                                                                            : "text-gray-100"
                                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                >
                                                                    <div className="flex justify-between items-center w-full">
                                                                        <h3 className="text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                                                                            {
                                                                                status.name
                                                                            }
                                                                        </h3>
                                                                        <div
                                                                            className={`w-3 h-3 ${status.color} rounded-full ml-2`}
                                                                        ></div>
                                                                    </div>
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    ))}
                                            </div>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        )}
                </div>
            )}
        </>
    );
};

export default ConversationHeader;
