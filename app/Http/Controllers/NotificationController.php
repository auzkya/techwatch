<?php

namespace App\Http\Controllers;

use App\Events\NotificationSent;
use App\Mail\NewMessageMail;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class NotificationController extends Controller
{
    // Načtení notifikací přihlášeného uživatele včetně odesílatele
    public function index()
    {
        return Notification::where('user_id', auth()->id())
            ->with(['sender.specs'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function sendInquiry(Request $request)
    {
        $request->validate([
            'recipient_id' => 'required',
            'title' => 'required',
            'message' => 'required',
            'tech_id' => 'nullable|integer',
        ]);

        // Uložení minimálního payloadu notifikace s identifikátorem techniky
        $notification = Notification::create([
            'user_id' => $request->recipient_id,
            'sender_id' => auth()->id(),
            'type' => 'direct_message',
            'title' => $request->title,
            'description' => $request->message,
            'data' => [
                'tech_id' => $request->tech_id,
                'is_job_offer' => $request->type === 'job',
            ],
        ]);

        // Okamžité doručení notifikace přes websocket kanál
        broadcast(new NotificationSent($notification))->toOthers();

        // Asynchronní odeslání e-mailu pouze při trvajícím stavu nepřečtené zprávy
        $recipient = User::find($request->recipient_id);

        if ($recipient && $recipient->email) {
            dispatch(function () use ($notification, $recipient) {
                $currentNotification = Notification::find($notification->id);

                if ($currentNotification && ! $currentNotification->is_read) {
                    Mail::to($recipient->email)->send(new NewMessageMail($currentNotification));
                }
            }); // ->delay(now()->addMinutes(1));
        }

        return response()->json(['success' => true]);
    }

    public function markAsRead(Request $request, $id = null)
    {
        $userId = auth()->id();

        // Hromadné označení notifikací jako přečtené pro vybraný typ
        if ($id === 'all') {
            $type = $request->get('type');

            $query = Notification::where('user_id', $userId)->where('is_read', false);

            if ($type === 'direct_message') {
                $query->where('type', 'direct_message');
            } elseif ($type === 'notifications') {
                $query->where('type', '!=', 'direct_message');
            }

            $query->update(['is_read' => true]);

            return response()->json(['success' => true]);
        }

        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function unreadCount()
    {
        return response()->json([
            'count' => Notification::where('user_id', auth()->id())
                ->where('is_read', false)
                ->count(),
        ]);
    }
}
