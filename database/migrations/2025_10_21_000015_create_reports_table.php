<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vynucení čistého vytvoření tabulky při spuštění migrace
        Schema::dropIfExists('reports');

        Schema::create('reports', function (Blueprint $table) {
            $table->id();

            // Vazba na uživatele, který nahlášení vytvořil
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');

            // Polymorfní identifikace cílového objektu nahlášení
            $table->nullableMorphs('target');

            // Detailní klasifikace a popis nahlášení
            $table->string('report_category');
            $table->text('reason')->nullable();
            $table->text('reporter_note')->nullable();

            // Stav a výstup administrátorského řešení nahlášení
            $table->enum('status', ['pending', 'resolved', 'dismissed'])->default('pending');
            $table->string('resolution_action')->nullable();
            $table->text('admin_note')->nullable();

            // Auditní údaje o zpracování nahlášení
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            // Indexy pro optimalizaci filtrů v administrátorském dashboardu
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
