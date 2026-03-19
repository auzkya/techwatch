<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reviews_users', function (Blueprint $table) {
            $table->id();
            // Vazby
            $table->foreignId('reviewer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('reviewed_user_id')->constrained('users')->onDelete('cascade');
            
            // Obsah recenze
            $table->decimal('review_value', 2, 1);
            $table->json('pros')->nullable();
            $table->json('cons')->nullable();
            $table->text('review')->nullable();
            
            // Systémová pole
            $table->timestamps();
            $table->softDeletes(); // Integrováno přímo sem

            // Indexy
            $table->index('reviewed_user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews_users');
    }
};