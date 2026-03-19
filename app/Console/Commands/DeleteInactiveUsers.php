<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class DeleteInactiveUsers extends Command
{
    protected $signature = 'users:delete-inactive';

    protected $description = 'Smaže neaktivní (neověřené) uživatele po určité době.';
    public function handle()
    {
        $deleted = User::where('is_active', false)
            ->whereNotNull('email_verification_sent_at')
            ->where('email_verification_sent_at', '<', now()->subDays(30))
            ->delete();

        $this->info("Smazáno {$deleted} neaktivních uživatelů.");
    }
}
