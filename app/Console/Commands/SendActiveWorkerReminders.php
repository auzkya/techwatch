<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\ActiveWorkerReminderMail;
use Illuminate\Support\Facades\URL;

class SendActiveWorkerReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-active-worker-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminder email 24h before active_worker_till expires';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::whereNotNull('active_worker_till')
            ->whereNull('active_worker_reminder_sent_at')
            ->whereBetween('active_worker_till', [
                now()->addHours(23),
                now()->addHours(25),
            ])
            ->get();

        // ⚠️ DEBUG
        \Log::info('Sending active worker reminders', [
            'count' => $users->count(),
            'users' => $users->pluck('id', 'email')->toArray(),
        ]);

        foreach ($users as $user) {
            $url = URL::temporarySignedRoute(
                'extend-active-worker',
                now()->addDays(2),
                ['user' => $user->id]
            );

            Mail::to($user->email)->send(
                new ActiveWorkerReminderMail($user, $url)
            );

            $user->active_worker_reminder_sent_at = now();
            $user->save();
        }
    }
}
