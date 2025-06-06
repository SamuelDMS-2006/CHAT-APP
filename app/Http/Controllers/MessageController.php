<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Muestra los mensajes entre el usuario autenticado y otro usuario.
     * Solo accesible por admin, asesor o el propio usuario asignado.
     */
    public function byUser(User $user)
    {
        $authUser = auth()->user();

        // Restringe acceso solo a admin, asesor o usuario asignado
        if (
            !$authUser->is_admin &&
            !$authUser->is_asesor &&
            $user->id != $authUser->asesor
        ) {
            return redirect()->route('chat.user', ['user' => $authUser->asesor]);
        }

        // Obtiene los mensajes entre ambos usuarios
        $messages = Message::with(['reactions.user', 'sender', 'attachments', 'replyTo'])
            ->where(function ($query) use ($authUser, $user) {
                $query->where('sender_id', $authUser->id)->where('receiver_id', $user->id)
                    ->orWhere('sender_id', $user->id)->where('receiver_id', $authUser->id);
            })->latest()->paginate(10);

        // Agrupa las reacciones por emoji
        $this->groupReactions($messages);

        // Devuelve la conversación, incluyendo el teléfono del usuario
        return inertia('Home', [
            'selectedConversation' => $user->toConversationArray(), // Asegúrate que incluya 'phone'
            'messages' => MessageResource::collection($messages),
        ]);
    }

    /**
     * Muestra los mensajes de un grupo.
     */
    public function byGroup(Group $group)
    {
        $messages = Message::with(['reactions.user', 'sender', 'attachments', 'replyTo'])
            ->where('group_id', $group->id)
            ->latest()
            ->paginate(10);

        $this->groupReactions($messages);

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    /**
     * Carga mensajes anteriores a un mensaje dado.
     */
    public function loadOlder(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::with(['reactions.user', 'sender', 'attachments', 'replyTo'])
                ->where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::with(['reactions.user', 'sender', 'attachments', 'replyTo'])
                ->where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->latest()
                ->paginate(10);
        }

        $this->groupReactions($messages);

        return MessageResource::collection($messages);
    }

    /**
     * Guarda un nuevo mensaje, con adjuntos si existen.
     */
    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();
        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;
        $files = $data['attachments'] ?? [];

        // Crea el mensaje
        $message = Message::create($data);

        // Procesa adjuntos si existen
        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                $model = [
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ];
                $attachments[] = MessageAttachment::create($model);
            }
            $message->attachments = $attachments;
        }

        // Actualiza la conversación o grupo con el último mensaje
        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message);
        }
        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }

        // Notifica por socket
        SocketMessage::dispatch($message);

        return new MessageResource($message);
    }

    /**
     * Elimina un mensaje si el usuario es el propietario.
     */
    public function destroy(Message $message)
    {
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Verifica si el mensaje es el último de la conversación o grupo
        $group = $message->group_id ? Group::where('last_message_id', $message->id)->first() : null;
        $conversation = !$group ? Conversation::where('last_message_id', $message->id)->first() : null;

        $message->delete();

        // Obtiene el nuevo último mensaje
        $lastMessage = null;
        if ($group) {
            $group = Group::find($group->id);
            $lastMessage = $group->lastMessage;
        } else if ($conversation) {
            $conversation = Conversation::find($conversation->id);
            $lastMessage = $conversation->lastMessage;
        }

        return response()->json(['message' => $lastMessage ? new MessageResource($lastMessage) : null]);
    }

    /**
     * Agrupa las reacciones de los mensajes por emoji.
     */
    private function groupReactions($messages)
    {
        $collection = $messages->getCollection();
        foreach ($collection as $message) {
            $grouped = [];
            foreach ($message->reactions as $reaction) {
                if ($reaction->user) {
                    $grouped[$reaction->emoji][] = [
                        'id' => $reaction->user->id,
                        'name' => $reaction->user->name,
                    ];
                }
            }
            $message->reactions_grouped = $grouped;
        }
    }
}
