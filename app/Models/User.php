<?php

// Model reprezentující uživatele v databázi, bez ktrého Laravel neví jak pracovat s tabulkou users

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; // pro autentizaci
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Tato pole lze hromadně naplnit při User::create()
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'bio',
        'location',
        'phone',
        'phone_visible',
        'profile_image',
        'is_active',
        'email_verification_token',
        'email_verification_sent_at',
        'google_id',
        'facebook_id',
    ];

    // Skrytá pole při serializaci do JSON (např. password)
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'phone_visible' => 'boolean',
        'is_active' => 'boolean',
        'last_login' => 'datetime',
        'email_verification_sent_at' => 'datetime',
        'phone_verified_at' => 'datetime',
    ];

    protected $appends = ['profile_image_url'];

    public function specs()
    {
        return $this->belongsToMany(Spec::class);
    }

    public function getProfileImageUrlAttribute()
    {
        return $this->profile_image
            ? config('app.url') . '/storage/' . $this->profile_image
            : null;
    }

}
