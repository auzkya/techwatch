<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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

            // Stav a Verifikace
            $table->boolean('is_active')->default(false);
            $table->string('email_verification_token', 64)->nullable();
            $table->timestamp('email_verification_sent_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->boolean('state_verified')->default(false);

            // Profilové informace
            $table->string('profile_image')->nullable();
            $table->text('bio')->nullable();
            $table->string('location', 100)->nullable();
            $table->string('phone')->nullable()->unique();
            $table->boolean('phone_visible')->default(false);

            // Role a Systémové příznaky
            $table->enum('role', ['user', 'admin_viewer', 'admin_moderator', 'super_admin'])->default('user');
            $table->integer('strikes_count')->default(0);
            $table->boolean('is_banned')->default(false);
            $table->text('ban_reason')->nullable();

            // Pracovní data a Hodnocení
            $table->timestamp('active_worker_till')->nullable();
            $table->timestamp('active_worker_reminder_sent_at')->nullable();
            $table->float('review_value')->nullable();

            // Časové značky a Indexy
            $table->timestamp('last_login')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Přidá deleted_at pro Soft Deletes

            $table->index('created_at');
            $table->index('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
