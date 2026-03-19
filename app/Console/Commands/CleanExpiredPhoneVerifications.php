<?php

namespace App\Console\Commands;

use App\Models\PhoneVerification;
use Illuminate\Console\Command;

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
