<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Item;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'sender_id',
        'type',
        'title',
        'description',
        'data',
        'is_read',
        'target_id',
        'target_sub_id',
        'target_slug'
    ];

    // Důležité: automaticky převede JSON na pole a zpět
    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean'
    ];

    protected $appends = ['tech_info'];

    // Vztah k příjemci
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Vztah k odesílateli
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Pomocná metoda pro získání techniky z JSON dat
    public function getTechInfoAttribute()
    {
        $techId = $this->data['tech_id'] ?? null;
        if (!$techId)
            return null;

        $item = Item::find($techId);
        if ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'image' => $item->image_urls[0] ?? null,
                'exists' => true
            ];
        }

        return [
            'title' => 'Inzerát již neexistuje',
            'image' => null,
            'exists' => false
        ];
    }
}
