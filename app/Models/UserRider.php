<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRider extends Model {
    protected $table = 'users_riders';
    protected $fillable = ['user_id', 'image_url'];

    public function user() {
        return $this->belongsTo(User::class);
    }
}
