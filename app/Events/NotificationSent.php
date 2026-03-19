<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function broadcastAs(): string
    {
        return 'notification.sent';
    }

    public function broadcastOn(): array
    {
        // Publikování události do privátního kanálu cílového uživatele
        return [
            new PrivateChannel('user.'.$this->notification->user_id),
        ];
    }

    public function broadcastWith(): array
    {
        // Rozšíření payloadu o data odesílatele a počet nepřečtených notifikací
        return [
            'notification' => $this->notification->load(['sender.specs']),
            'unread_count' => Notification::where('user_id', $this->notification->user_id)
                ->where('is_read', false)->count(),
        ];
    }
}
