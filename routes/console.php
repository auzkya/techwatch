<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('users:delete-inactive')->hourly();
Schedule::command('app:send-active-worker-reminders')->hourly();
Schedule::command('app:deactivate-expired-workers')->daily();
Schedule::command('phone-verifications:clean')->daily();
