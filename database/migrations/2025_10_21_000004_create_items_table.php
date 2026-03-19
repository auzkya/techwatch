<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            // Vazba na majitele
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Základní informace
            $table->string('title', 255);
            $table->text('category'); // Doporučení pro BP: Pokud je kategorie jedno slovo, string by stačil, ale nechávám text dle tvého zadání
            $table->text('description');
            $table->string('location', 100);
            
            // Parametry nabídky
            $table->enum('purpose', ['rental', 'sell']);
            $table->integer('quantity')->default(1);
            $table->integer('price')->nullable();
            
            // Média a metadata
            $table->json('images')->nullable();
            $table->boolean('active_item')->default(true);
            $table->float('review_value')->nullable();
            
            // Časové značky a Soft Deletes
            $table->timestamps();
            $table->softDeletes(); 

            // Indexy pro rychlé vyhledávání a filtrování
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