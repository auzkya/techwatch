<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PhoneVerification;

class CleanExpiredPhoneVerifications extends Command
{
    protected $signature = 'phone-verifications:clean';
    protected $description = 'Delete expired phone verifications';

    public function handle()
    {
        $deleted = PhoneVerification::where('expires_at', '<', now())->delete();

        $this->info("Deleted {$deleted} expired phone verifications.");

        return 0;
    }
}
