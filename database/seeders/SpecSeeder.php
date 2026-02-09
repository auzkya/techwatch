<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Spec;

class SpecSeeder extends Seeder
{
    public function run(): void
    {
        // Definujeme pole dvojic: Název -> Tvůj React Slug
        $categories = [
            'Osvětlovač' => 'light_technician',
            'Zvukař'     => 'sound_technician',
            'AV technik'  => 'av_technician',
            'Rigger'     => 'rigger',
            'Stagehands' => 'stagehands',
        ];

        foreach ($categories as $name => $slug) {
            // updateOrCreate zajistí, že pokud kategorie existuje, jen se aktualizuje slug
            Spec::updateOrCreate(
                ['name' => $name], // Podle čeho hledáme
                ['slug' => $slug]  // Co aktualizujeme
            );
        }
    }
}
