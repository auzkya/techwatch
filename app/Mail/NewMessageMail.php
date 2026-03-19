<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public $notification;

    public $senderName;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
        // Získáme jméno odesílatele pro předmět
        $this->senderName = $notification->sender->first_name.' '.$notification->sender->last_name;
    }

    public function build()
    {
        return $this->from('info@techwatch.app', 'Váš TechWatch')
            ->subject('Nová zpráva od: '.$this->senderName)
            ->view('emails.new-message')
            ->with([
                'title' => $this->notification->title,
                'link' => route('notification.email.open', ['notification' => $this->notification->id]),
            ]);
    }
}
