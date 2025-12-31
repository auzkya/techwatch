<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Item;

class TechController extends Controller
{
    public function tech(Request $request)
    {
        $user_id = Auth::id();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:700',
            'price' => 'nullable|numeric',
            'category' => 'required|string',
            'location' => 'required|string',
            'purpose' => 'required|string',
            'quantity' => 'required|integer|min:1',

            'images' => 'required|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Uložení obrázků
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $path = $img->store('items', 'public');
                $imagePaths[] = asset('storage/' . $path);
            }
        }

        // Uložení záznamu
        $item = Item::create([
            'user_id' => $user_id,
            'title' => strip_tags($request->title),
            'description' => strip_tags($request->description),
            'price' => $request->price,
            'price_negotiable' => $request->priceNegotiable,
            'category' => $request->category,
            'location' => $request->location,
            'purpose' => $request->purpose,
            'quantity' => $request->quantity,
            'images' => json_encode($imagePaths)
        ]);

        return response()->json([
            'message' => 'Technika byla úspěšně přidána.',
            'item' => $item
        ]);
    }
}
