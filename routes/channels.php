<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// kontrola "Je ten, kdo se snaží poslouchat kanál uživatele 5, opravdu uživatel 5?"
