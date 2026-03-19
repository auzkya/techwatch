<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ModerationActionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $notification;

    public $actionType;

    public function __construct(Notification $notification, $actionType)
    {
        $this->notification = $notification;
        $this->actionType = $actionType; // 'strike_user' nebo 'ban_user'
    }

    public function build()
    {
        $isActuallyBan = $this->actionType === 'ban_user' || str_contains($this->notification->title, 'Zablokování');

        $subject = match ($this->actionType) {
            $isActuallyBan => 'Důležité: Váš účet na TechWatch byl zablokován',
            'revert' => 'Informace: Váš obsah na TechWatch byl obnoven',
            default => 'Upozornění: Obdržel jste varování (strike)',
        };

        return $this->from('info@techwatch.app', 'Váš TechWatch')
            ->subject($subject)
            ->view('emails.moderation-action')
            ->with([
                'title' => $this->notification->title,
                'reason' => $this->notification->description,
                'actionType' => $this->actionType,
                // Pomocné proměnné pro Blade
                'isBan' => $isActuallyBan,
                'isRevert' => $this->actionType === 'revert',
            ]);
    }
}
