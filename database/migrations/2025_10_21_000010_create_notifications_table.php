<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Příjemce
            $table->foreignId('sender_id')->nullable()->constrained('users'); // Kdo akci vyvolal
            $table->string('type'); // 'favourite', 'review', 'direct_message', 'admin_alert'
            $table->string('title');
            $table->text('description');
            $table->json('data')->nullable(); // Extra info: ['email' => '...', 'reason' => '...']
            $table->boolean('is_read')->default(false);
            $table->unsignedBigInteger('target_id')->nullable(); // ID cíle (např. item_id, user_id)
            $table->unsignedBigInteger('target_sub_id')->nullable(); // Podřízené ID (např. review_id pro scroll)
            $table->string('target_slug')->nullable(); // Slug cílového uživatele (např. "jan-novak")
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
