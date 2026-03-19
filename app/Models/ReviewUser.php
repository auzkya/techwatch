<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReviewUser extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'reviews_users';

    protected $fillable = ['reviewer_id', 'reviewed_user_id', 'review_value', 'review', 'pros', 'cons'];

    protected $casts = [
        'pros' => 'array',
        'cons' => 'array',
        'review_value' => 'float',
    ];

    // Autor recenze
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    // Uživatel, na jehož profilu je recenze napsaná
    public function reviewedUser()
    {
        return $this->belongsTo(User::class, 'reviewed_user_id');
    }
}
