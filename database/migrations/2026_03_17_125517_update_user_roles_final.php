<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Změna enum hodnot na ty aktuální
            $table->enum('role', ['user', 'admin_viewer', 'admin_moderator', 'super_admin'])
                ->default('user')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Zpět na původní (pokud byla jen 'user' a 'admin')
            $table->enum('role', ['user', 'admin'])
                ->default('user')
                ->change();
        });
    }
};
