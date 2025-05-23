<?php

use App\Http\Controllers\ChatUserController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/landing', function () {
    return Inertia::render('LandingPage');
});

Route::post('/chat-users', [ChatUserController::class, 'store']);

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/', [HomeController::class, 'home'])->name('dashboard');

    Route::get('user/{user}', [MessageController::class, 'byUser'])->name('chat.user');
    Route::get('group/{group}', [MessageController::class, 'byGroup'])->name('chat.group');

    Route::post('/message', [MessageController::class, 'store'])->name('message.store');
    Route::delete('/message/{message}', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::get('/message/older/{message}', [MessageController::class, 'loadOlder'])->name('message.loadOlder');

    Route::post('/group', [GroupController::class, 'store'])->name('group.store');
    Route::put('/group/{group}', [GroupController::class, 'update'])->name('group.update');
    Route::delete('/group/{group}', [GroupController::class, 'destroy'])->name('group.destroy');

    Route::middleware(['admin'])->group(function () {
        Route::post('/user', [UserController::class, 'store'])->name('user.store');
        Route::post('/user/set-asesor/{user}', [UserController::class, 'setRoleAsesor'])->name('user.setRoleAsesor');
        Route::post('/user/set-admin/{user}', [UserController::class, 'setRoleAdmin'])->name('user.setRoleAdmin');
        Route::post('/users/{user}/asign-asesor/{asesor}', [UserController::class, 'asignAsesor'])->name('user.asignAsesor');
        Route::post('/users/{user}/change-status/{newStatus}', [UserController::class, 'changeStatus'])->name('user.changeStatus');

        Route::post('/user/block-unblock/{user}', [UserController::class, 'blockUnblock'])
            ->name('user.blockUnblock');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
