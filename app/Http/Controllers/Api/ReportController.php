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
            'type'      => 'required|in:items,reviews_users,reviews_items,users',
            'category'  => 'required|string|max:255', // Např. "Podvod", "Nevhodný obsah"
            'reason'    => 'nullable|string|max:2000', // Detailní text od uživatele
        ]);

        $report = Report::create([
            'reporter_id' => Auth::id(),
            'type'        => $validated['type'],
            'target_id'   => $validated['target_id'],
            'category'    => $validated['category'],
            'reason'      => $validated['reason'],
            'status'      => 'pending',
        ]);

        return response()->json([
            'message' => 'Nahlášení bylo úspěšně odesláno.',
            'report'  => $report
        ], 201);
    }
}
