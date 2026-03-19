<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ActiveWorkerReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $signedUrl;

    public function __construct(User $user, string $signedUrl)
    {
        $this->user = $user;
        $this->signedUrl = $signedUrl;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Profil brzy přestane být aktivní',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.worker-expiring',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
