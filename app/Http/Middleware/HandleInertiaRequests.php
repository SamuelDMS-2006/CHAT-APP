<?php

namespace App\Http\Middleware;

use App\Http\Resources\UserResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => Auth::id() ? new UserResource($request->user()) : null,
            ],
            'conversations' => Auth::id() ? Conversation::getConversationsForSidebar(Auth::user()) : [],
            'asesors' => Auth::id() ? User::getAsesors(Auth::user()) : [],
            'splitUsers' => Auth::id() ? [
                'admins' => User::getUsersExceptUser(Auth::user(), 'admin')->map->toConversationArray(),
                'asesores' => User::getUsersExceptUser(Auth::user(), 'asesor')->map->toConversationArray(),
                'usuarios' => User::getUsersExceptUser(Auth::user(), 'usuario')->map->toConversationArray(),
            ] : [],
        ];
    }
}
