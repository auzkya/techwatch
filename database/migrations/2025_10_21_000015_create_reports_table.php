<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Zajistíme čistý start pro odevzdání
        Schema::dropIfExists('reports');

        Schema::create('reports', function (Blueprint $table) {
            $table->id();

            // Kdo nahlásil
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');

            // Polymorfní vazba na cíl (User, Item, atd.)
            // Vytvoří target_id a target_type
            $table->nullableMorphs('target');

            // Detaily hlášení
            $table->string('report_category'); // např. podvod, spam
            $table->text('reason')->nullable(); // Původní důvod od uživatele
            $table->text('reporter_note')->nullable(); // Doplňující poznámka reportéra

            // Administrace a řešení (RQ-37)
            $table->enum('status', ['pending', 'resolved', 'dismissed'])->default('pending');
            $table->string('resolution_action')->nullable(); // Např. 'banned', 'deleted_item', 'warned'
            $table->text('admin_note')->nullable(); // Interní komentář admina

            // Audit řešení
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            // Indexy pro dashboard
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
