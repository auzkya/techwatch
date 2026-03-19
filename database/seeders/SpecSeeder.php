<?php

namespace Database\Seeders;

use App\Models\Spec;
use Illuminate\Database\Seeder;

class SpecSeeder extends Seeder
{
    public function run(): void
    {
        // Definice mapování názvů specializací na slug hodnoty
        $categories = [
            'Osvětlovač' => 'light_technician',
            'Zvukař' => 'sound_technician',
            'AV technik' => 'av_technician',
            'Rigger' => 'rigger',
            'Stagehands' => 'stagehands',
        ];

        foreach ($categories as $name => $slug) {
            // Synchronizace specializací podle názvu a slug klíče
            Spec::updateOrCreate(
                ['name' => $name],
                ['slug' => $slug]
            );
        }
    }
}
