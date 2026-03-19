<?php

// Hledání uživatelů kteří byli registrování před více než hodinou které následně smaže

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class DeleteInactiveUsers extends Command
{
    /**
     * Název příkazu pro Artisan
     *
     * @var string
     */
    protected $signature = 'users:delete-inactive';

    /**
     * Popis příkazu
     *
     * @var string
     */
    protected $description = 'Smaže neaktivní (neověřené) uživatele po určité době.';

    /**
     * Spuštění příkazu
     */
    public function handle()
    {
        $deleted = User::where('is_active', false)
            ->whereNotNull('email_verification_sent_at')
            ->where('email_verification_sent_at', '<', now()->subDays(30))
            ->delete();

        $this->info("Smazáno {$deleted} neaktivních uživatelů.");
    }
}
