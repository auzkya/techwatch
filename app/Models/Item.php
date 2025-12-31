<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'price',
        'category',
        'location',
        'purpose',
        'quantity',
        'images'
        // jestli ukládáš obrázky nebo jejich cesty, tak přidat
    ];
}
