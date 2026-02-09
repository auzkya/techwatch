<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    protected $fillable = [
        'reporter_id',
        'type',
        'target_id',
        'category',
        'reason',
        'status',
        'resolved_at',
        'resolved_by'
    ];

    // Kdo nahlášení vytvořil
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    // Kdo (admin/moderátor) nahlášení vyřešil
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
