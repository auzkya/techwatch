<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('reports'); // Čistý start

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            // Kdo nahlásil
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            
            // Polymorfní vazba: vytvoří target_id a target_type (string)
            // Do target_type se uloží 'App\Models\Item' nebo 'App\Models\User' atd.
            $table->nullableMorphs('target'); 

            // Kategorie nahlášení (např. 'podvod', 'spam', 'urážky')
            $table->string('report_category'); 
            $table->text('reason')->nullable();
            
            // Stav řešení (RQ-37)
            $table->enum('status', ['pending', 'resolved', 'dismissed'])->default('pending');
            $table->text('admin_note')->nullable(); // Tvůj interní komentář k řešení
            
            // Kdo a kdy to vyřešil
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            
            $table->timestamps();

            // Indexy pro rychlé načítání v Admin Dashboardu
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void { Schema::dropIfExists('reports'); }
};