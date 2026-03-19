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
            // Generování slug hodnot kompatibilních s výběrem lokality na frontendu
            'location' => fake()->randomElement(['praha', 'brno', 'ostrava', 'plzensky']),
            'review_value' => fake()->randomFloat(1, 1, 5),
            // Nastavení data platnosti aktivního profilu do budoucna pro testovací scénáře
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
