<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Report extends Model
{
    protected $fillable = [
        'reporter_id',
        'target_id',
        'target_type',
        'report_category',
        'reason',
        'status',
        'resolution_action',
        'admin_note',
        'resolved_at',
        'resolved_by',
    ];

    /**
     * Polymorfní vazba na nahlášený objekt.
     */
    public function target(): MorphTo
    {
        return $this->morphTo();
    }

    // Vazba na uživatele, který nahlášení vytvořil
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    // Vazba na administrátora, který nahlášení vyřešil
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
