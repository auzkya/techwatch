<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('favourites_items', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['user_id', 'item_id']);
            $table->index('user_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favourites_items');
    }
};
