<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => bcrypt('password'),
            'is_active' => true,
            'profile_image' => 'https://i.pravatar.cc/150?u='.fake()->uuid(),
            'bio' => fake()->sentence(),
            'location' => fake()->randomElement(['praha', 'brno', 'ostrava', 'plzensky']), // Slugs pro tvůj select
            'review_value' => fake()->randomFloat(1, 1, 5),
            // Nastavíme aktivitu na 1 měsíc dopředu, aby byli vidět v seznamu
            'active_worker_till' => now()->addMonths(1),
            'state_verified' => fake()->boolean(),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
