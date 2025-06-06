<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Events\MessageReacted;
use Illuminate\Support\Facades\Auth;

class MessageReactionController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Message $message)
    {
        $request->validate([
            'emoji' => 'required|string|max:32',
        ]);

        $user = Auth::user();

        // Evita duplicados: un usuario solo puede reaccionar una vez con el mismo emoji
        $reaction = MessageReaction::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => $request->emoji,
        ]);

        broadcast(new MessageReacted($reaction))->toOthers();

        return response()->json([
            'success' => true,
            'reaction' => $reaction,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Message $message)
    {
        $request->validate([
            'emoji' => 'required|string|max:32',
        ]);

        $user = Auth::user();

        $reaction = MessageReaction::where([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => $request->emoji,
        ])->first();

        if ($reaction) {
            $reaction->delete();
        }

        return response()->json([
            'success' => true,
        ]);
    }
}
