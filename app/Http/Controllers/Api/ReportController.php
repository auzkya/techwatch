<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'target_id' => 'required|integer',
            // Přijetí klíče typu cíle pro následné mapování na model
            'type' => 'required|in:items,reviews_items,users,reviews_users',
            'category' => 'required|string|max:255',
            'reason' => 'nullable|string|max:2000',
        ]);

        // Mapování typu cíle z požadavku na třídu modelu pro polymorfní vazbu
        $map = [
            'items' => \App\Models\Item::class,
            'reviews_items' => \App\Models\ReviewItem::class,
            'users' => \App\Models\User::class,
            'reviews_users' => \App\Models\ReviewUser::class,
        ];

        $report = Report::create([
            'reporter_id' => Auth::id(),
            'target_type' => $map[$validated['type']],
            'target_id' => $validated['target_id'],
            'report_category' => $validated['category'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Nahlášení bylo úspěšně odesláno.',
            'report' => $report,
        ], 201);
    }

    // Načtení seznamu nahlášení pro administrátorské rozhraní
    public function index()
    {
        // Eager loading vazeb reportéra a cílového objektu pro omezení počtu dotazů
        $reports = Report::with(['reporter', 'target'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reports);
    }
}
