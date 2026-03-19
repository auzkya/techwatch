<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 1. Role (pokud už ji tam náhodou nemáš z minula)
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['user', 'admin_viewer', 'admin_moderator', 'super_admin'])->default('user')->after('password');
            }

            // 2. Strike systém (RQ-37, RQ-40)
            if (!Schema::hasColumn('users', 'strikes_count')) {
                $table->integer('strikes_count')->default(0)->after('role');
            }

            // 3. Ban systém (RQ-40)
            if (!Schema::hasColumn('users', 'is_banned')) {
                $table->boolean('is_banned')->default(false)->after('strikes_count');
            }
            if (!Schema::hasColumn('users', 'ban_reason')) {
                $table->text('ban_reason')->nullable()->after('is_banned');
            }

            // 4. Soft Deletes (Umožní smazat účet, ale zachovat ho v DB pro ban check)
            if (!Schema::hasColumn('users', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['strikes_count', 'is_banned', 'ban_reason']);
            $table->dropSoftDeletes();
        });
    }
};