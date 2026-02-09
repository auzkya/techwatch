<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Item;

class ReviewItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reviewer_id' => User::inRandomOrder()->first()->id,
            'item_id' => Item::inRandomOrder()->first()->id,
            'review_value' => fake()->numberBetween(1, 5),
            'review' => fake()->paragraph(),
            'pros' => [fake()->sentence(), fake()->sentence()],
            'cons' => [fake()->sentence()],
        ];
    }
}
