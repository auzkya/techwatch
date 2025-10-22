<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; // pro autentizaci
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Tato pole lze hromadně naplnit při User::create()
    protected $fillable = [
        'username',
        'email',
        'password',
    ];

    // Skrytá pole při serializaci do JSON (např. password)
    protected $hidden = [
        'password',
        'remember_token',
    ];
}
