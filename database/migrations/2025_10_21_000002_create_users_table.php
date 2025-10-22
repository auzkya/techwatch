<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100);
            $table->string('email', 255)->unique();
            $table->string('password', 255);
            $table->string('profile_image')->nullable();
            $table->text('description')->nullable();
            $table->string('location', 100)->nullable();
            $table->timestamp('active_worker_till')->nullable();
            $table->boolean('state_verified')->default(false);
            $table->float('review_value')->nullable();
            $table->timestamps();
            $table->timestamp('last_login')->nullable();
            $table->index('username');
            $table->index('location');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
