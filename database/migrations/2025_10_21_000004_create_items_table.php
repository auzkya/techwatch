<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('location', 100)->nullable();
            $table->enum('purpose', ['rental', 'sell']);
            $table->integer('price')->nullable();
            $table->boolean('active_item')->default(true);
            $table->float('review_value')->nullable();
            $table->timestamps();
            $table->index('title');
            $table->index('location');
            $table->index('purpose');
            $table->index('active_item');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
