<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

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
        'google_id',
        'facebook_id',
        'active_worker_till',
        'review_value',
        'email_verification_token',
        'email_verification_sent_at',
        'role',
        'strikes_count',
        'is_banned',
        'ban_reason',
        'last_login',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $with = ['specs'];

    protected $casts = [
        'phone_visible' => 'boolean',
        'is_active' => 'boolean',
        'active_worker_till' => 'datetime',
        'review_value' => 'float',
        'email_verification_sent_at' => 'datetime',
        'is_banned' => 'boolean',
        'last_login' => 'datetime',
    ];

    protected $appends = ['profile_image_url', 'reviews_count', 'obs_email', 'obs_phone'];

    // Vztahy
    public function specs()
    {
        return $this->belongsToMany(Spec::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function riders()
    {
        return $this->hasMany(UserRider::class, 'user_id');
    }

    // Vztah k recenzím, které uživatel DOSTAL (bez deleted_at uživatele)
    public function reviewsReceived()
    {
        return $this->hasMany(ReviewUser::class, 'reviewed_user_id')
            ->whereHas('reviewer', function ($query) {
                $query->whereNull('deleted_at');
            });
    }
    public function getReviewValueAttribute()
    {
        $avg = $this->reviewsReceived()->avg('review_value') ?: 0;
        return (float) number_format((float) $avg, 1, '.', '');
    }

    // Accessor pro počet recenzí
    public function getReviewsCountAttribute()
    {
        return $this->reviewsReceived()->count();
    }

    public function getProfileImageUrlAttribute()
    {
        if (! $this->profile_image) {
            return null;
        }
        if (filter_var($this->profile_image, FILTER_VALIDATE_URL)) {
            return $this->profile_image;
        }

        return Storage::disk('r2')->url($this->profile_image);
    }

    public function favouritedBy()
    {
        return $this->belongsToMany(User::class, 'favourites_users', 'favourite_user_id', 'user_id');
    }

    public function isViewer(): bool
    {
        return $this->role === 'admin_viewer';
    }

    public function isModerator(): bool
    {
        return $this->role === 'admin_moderator';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function getIsBannedAttribute($value)
    {
        // Vrací true, pokud je is_banned v DB true NEBO pokud je záznam v koši (Soft Deleted)
        return (bool) $value || $this->trashed();
    }

    // prázdné accessory aby technika zjistila zašifrovaný email a telefon
    public function getObsEmailAttribute()
    {
        return $this->attributes['obs_email'] ?? null;
    }

    public function getObsPhoneAttribute()
    {
        return $this->attributes['obs_phone'] ?? null;
    }
}
