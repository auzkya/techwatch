<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Spec;
use Illuminate\Support\Str;

class SpecSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Osvětlovač',
            'Zvukař',
            'AV technik',
            'Rigger',
            'Stagehands',
        ];

        foreach ($categories as $name) {
            Spec::create([
                'name' => $name,
                'slug' => Str::slug($name),
            ]);
        }
    }
}
