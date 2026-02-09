<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class ReviewUserFactory extends Factory
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
            'reviewed_user_id' => User::inRandomOrder()->first()->id,
            'review_value' => fake()->numberBetween(1, 5),
            'review' => fake()->paragraph(),
            'pros' => [fake()->sentence(), fake()->sentence()],
            'cons' => [fake()->sentence()],
        ];
    }
}
