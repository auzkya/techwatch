<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 255)->unique();
            $table->string('password', 255)->nullable();
            $table->string('google_id')->nullable();
            $table->string('facebook_id')->nullable();
            $table->boolean('is_active')->default(false);
            $table->string('email_verification_token', 64)->nullable();
            $table->timestamp('email_verification_sent_at')->nullable();
            $table->string('profile_image')->nullable();
            $table->text('bio')->nullable();
            $table->string('location', 100)->nullable();
            $table->string('phone')->nullable()->unique();
            $table->timestamp('phone_verified_at')->nullable();
            $table->boolean('phone_visible')->default(false);
            $table->timestamp('active_worker_till')->nullable();
            $table->boolean('state_verified')->default(false);
            $table->float('review_value')->nullable();
            $table->index('created_at');
            $table->index('updated_at');
            $table->timestamp('last_login')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
