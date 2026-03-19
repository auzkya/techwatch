<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reviews_items', function (Blueprint $table) {
            $table->id();
            // Vazby
            $table->foreignId('reviewer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            
            // Obsah recenze
            $table->decimal('review_value', 2, 1);
            $table->json('pros')->nullable();
            $table->json('cons')->nullable();
            $table->text('review')->nullable();
            
            // Systémová pole
            $table->timestamps();
            $table->softDeletes(); // Integrováno přímo sem

            // Indexy
            $table->index('item_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews_items');
    }
};