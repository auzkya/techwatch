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
        'target_type',    // Nahrazuje 'type' pro polymorfní vazbu
        'report_category', // Sjednoceno s názvem v migraci
        'reason',
        'status',
        'resolution_action',
        'admin_note',     // Přidáno pro tvoje poznámky (RQ-37)
        'resolved_at',
        'resolved_by'
    ];

    /**
     * Klíčová změna: Polymorfní vazba.
     * Umožňuje získat objekt, který byl nahlášen (Item, User, Review)
     * bez ohledu na to, v jaké je tabulce.
     */
    public function target(): MorphTo
    {
        return $this->morphTo();
    }

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