<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Report;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'target_id' => 'required|integer',
            // Frontend bude posílat jednoduchý klíč, my ho zde přemapujeme na Model
            'type'      => 'required|in:items,reviews_items,users,reviews_users', 
            'category'  => 'required|string|max:255', // mapujeme na 'report_category' v DB
            'reason'    => 'nullable|string|max:2000',
        ]);

        // Mapa pro převod typu z requestu na Laravel Model třídy
        $map = [
            'items'   => \App\Models\Item::class,
            'reviews_items' => \App\Models\ReviewItem::class,
            'users'   => \App\Models\User::class,
            'reviews_users' => \App\Models\ReviewUser::class,
        ];

        $report = Report::create([
            'reporter_id'     => Auth::id(),
            'target_type'     => $map[$validated['type']],
            'target_id'       => $validated['target_id'],
            'report_category' => $validated['category'], // změna názvu dle nové migrace
            'reason'          => $validated['reason'],
            'status'          => 'pending',
        ]);

        return response()->json([
            'message' => 'Nahlášení bylo úspěšně odesláno.',
            'report'  => $report
        ], 201);
    }

    /**
     * RQ-37: Zobrazení nahlášení pro admina
     */
    public function index()
    {
        // Načteme nahlášení i s daty o nahlášeném objektu (target) a reportérovi
        $reports = Report::with(['reporter', 'target'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reports);
    }
}