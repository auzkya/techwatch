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
    // Načtení notifikací pro přihlášeného uživatele
    public function index()
    {
        // Díky $appends v modelu se tech_info přidá samo
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

        // Ukládáme POUZE tech_id. Žádné URL, žádné názvy (ty si vytáhneme v indexu výše)
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

        // 1. Okamžité odeslání přes websocket
        broadcast(new NotificationSent($notification))->toOthers();

        // 2. Email s odkladem (např. 5 minut)
        // Pokud si uživatel zprávu přečte dřív v Reactu,
        // v Jobu můžeme zkontrolovat 'is_read' a email neposlat.
        $recipient = User::find($request->recipient_id);

        if ($recipient && $recipient->email) {
            // Použijeme closure pro delayed job
            dispatch(function () use ($notification, $recipient) {
                $currentNotification = Notification::find($notification->id);

                // Kontrola: Poslat jen pokud je stále nepřečtená
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

        // Pokud je voláno jako /api/notifications/all/mark-as-read (pro Přečíst vše)
        if ($id === 'all') {
            $type = $request->get('type'); // Volitelné: rozlišení zprávy vs notifikace

            $query = Notification::where('user_id', $userId)->where('is_read', false);

            if ($type === 'direct_message') {
                $query->where('type', 'direct_message');
            } elseif ($type === 'notifications') {
                $query->where('type', '!=', 'direct_message');
            }

            $query->update(['is_read' => true]);

            return response()->json(['success' => true]);
        }

        // Klasické jedno ID
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
