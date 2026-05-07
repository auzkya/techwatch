<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationSent;
use App\Http\Controllers\Controller;
use App\Mail\ModerationActionMail;
use App\Models\Item;
use App\Models\Notification;
use App\Models\Report;
use App\Models\Spec;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    public function getDashboardStats(Request $request)
    {
        $range = $request->query('range', '6months');
        $now = now();
        $timeData = collect();

        // Nastavení parametrů podle rozsahu
        switch ($range) {
            case 'week':
                $steps = 7;
                $subUnit = 'day';
                $format = 'd.m.';
                break;
            case 'month':
                $steps = 30;
                $subUnit = 'day';
                $format = 'd.m.';
                break;
            case '6months':
                $steps = 180;
                $subUnit = 'day';
                $format = 'm/Y';
                break;
            case '1year':
                $steps = 365;
                $subUnit = 'day';
                $format = 'm/Y';
                break;
            case '2years':
                $steps = 24;
                $subUnit = 'month';
                $format = 'm/Y';
                break;
            case 'all':
                $firstUser = User::oldest()->first();
                $startDate = $firstUser ? $firstUser->created_at : now()->subYear();
                $diffMonths = $startDate->diffInMonths($now);

                if ($diffMonths > 24) {
                    $steps = $diffMonths;
                    $subUnit = 'month';
                } else {
                    $steps = ceil($startDate->diffInDays($now) / 7);
                    $subUnit = 'week';
                }
                $format = 'm/Y';
                break;
        }

        // Generování datových bodů
        for ($i = $steps; $i >= 0; $i--) {
            // Dynamické odečítání jednotek (dnů/týdnů/měsíců)
            $method = 'sub'.ucfirst($subUnit).'s';
            $date = $now->copy()->$method($i);
            $endOfPeriod = ($subUnit === 'day') ? $date->endOfDay() : $date->copy();
            if ($subUnit === 'week') {
                $endOfPeriod = $date->endOfWeek();
            }
            if ($subUnit === 'month') {
                $endOfPeriod = $date->endOfMonth();
            }

            // Zajištění, že nepočítáme data z budoucnosti
            $checkDate = $endOfPeriod->isFuture() ? $now : $endOfPeriod;
            $dateString = $checkDate->toDateTimeString();

            $totalUsers = User::where('created_at', '<=', $dateString)->count();
            $totalItems = Item::where('created_at', '<=', $dateString)->count();

            $activeWorkers = User::where('created_at', '<=', $dateString)
                ->where('active_worker_till', '>=', $dateString)
                ->count();

            $timeData->push([
                'date' => $date->format($format),
                'full_date' => $date->format('d. m. Y'), // Pro detailnější tooltip
                'users' => $totalUsers,
                'workers' => $activeWorkers,
                'items' => $totalItems,
            ]);
        }

        // Ostatní metriky
        $specs = Spec::withCount('users')->get()->map(fn ($s) => [
            'name' => $s->name,
            'value' => $s->users_count,
        ]);

        $categoryTranslations = [
            'light' => 'Světla',
            'sound' => 'Zvuk',
            'video' => 'Video',
            'rigging_stage' => 'Rigging & stage',
            'scenography' => 'Scénografie',
        ];

        $itemCategories = Item::select('category', DB::raw('count(*) as value'))
            ->groupBy('category')
            ->get()
            ->map(function ($item) use ($categoryTranslations) {
                return [
                    'name' => $categoryTranslations[$item->category] ?? ucfirst($item->category),
                    'value' => $item->value
                ];
            });

        $workersVsItems = [
            ['name' => 'Aktivní pracovníci', 'value' => User::where('active_worker_till', '>', now())->count()],
            ['name' => 'Nabídky techniky', 'value' => Item::count()],
        ];

        $authMethods = [
            ['name' => 'Heslo', 'value' => User::whereNotNull('password')->count()],
            ['name' => 'Google', 'value' => User::whereNotNull('google_id')->count()],
            ['name' => 'Facebook', 'value' => User::whereNotNull('facebook_id')->count()],
        ];

        $phoneStats = [
            ['name' => 'Ověřeno', 'value' => User::whereNotNull('phone')->where('is_active', true)->count()],
            ['name' => 'Neověřeno', 'value' => User::whereNull('phone')->orWhere('is_active', false)->count()],
        ];

        $reports = Report::with('reporter')
            ->where('status', 'pending')
            ->whereNotNull('target_type')
            ->get()
            ->map(function ($report) {
                try {
                    // Načtení cílového objektu včetně soft-deleted záznamů
                    $target = $report->target_type::withTrashed()->find($report->target_id);

                    // Načtení souvisejících relací podle typu objektu pro administrátorské rozhraní
                    if ($target) {
                        $modelName = class_basename($report->target_type);
                        switch ($modelName) {
                            case 'Item':
                                $target->load('user');
                                break;
                            case 'ReviewUser':
                                $target->load(['reviewer', 'reviewedUser']);
                                break;
                            case 'ReviewItem':
                                $target->load(['reviewer', 'item']);
                                break;
                        }
                    }
                    $report->target = $target;
                } catch (\Exception $e) {
                    $report->target = null;
                }

                return $report;
            });

        return response()->json([
            'chart_data' => [
                'timeLine' => $timeData,
                'specs' => $specs,
                'itemCategories' => $itemCategories,
                'workersVsItems' => $workersVsItems,
                'authMethods' => $authMethods,
                'phoneStats' => $phoneStats,
            ],
            'users_count' => User::count(),
            'items_count' => Item::count(),
            'pending_reports_count' => Report::where('status', 'pending')->count(),
            'reports' => $reports,
        ]);
    }

    public function resolveReport(Request $request, $id)
    {
        $report = Report::findOrFail($id);

        // Načtení cílového objektu i v případě soft delete stavu
        $target = null;
        if ($report->target_type && class_exists($report->target_type)) {
            $target = $report->target_type::withTrashed()->find($report->target_id);
        }

        if (!$target && $request->input('action') !== 'dismiss') {
            return response()->json(['message' => 'Cíl nahlášení již neexistuje a nelze nad ním provést akci.'], 422);
        }

        $action = $request->input('action');
        $adminNote = $request->input('adminNote') ?: null;
        $reporterNote = $request->input('reporterNote') ?: null;

        $isUser = $target instanceof User;

        // Příprava textových dat notifikace podle typu řešeného objektu
        $targetType = 'obsah';
        $targetName = '';
        $suffix = 'o';

        if ($target) {
            $modelName = class_basename($report->target_type);
            $targetDate = $target->created_at ? $target->created_at->format('d.m.Y') : '';

            switch ($modelName) {
                case 'Item':
                    $targetType = 'inzerát';
                    $targetName = "**„{$target->title}“**";
                    $suffix = '';
                    break;
                case 'User':
                    $targetType = 'účet';
                    $targetName = "**{$target->first_name} {$target->last_name}**";
                    $suffix = '';
                    break;
                case 'ReviewUser':
                    $targetType = 'recenze';
                    $profileOwner = $target->reviewedUser
                        ? "{$target->reviewedUser->first_name} {$target->reviewedUser->last_name}"
                        : null;

                    $targetName = "uživatele **$profileOwner** ze dne **$targetDate**";
                    $suffix = 'a';
                    break;
                case 'ReviewItem':
                    $targetType = 'recenze';
                    $itemTitle = $target->item ? "„{$target->item->title}“" : 'inzerátu';
                    $targetName = "nabídky **$itemTitle** ze dne **$targetDate**";
                    $suffix = 'a';
                    break;
            }
        }

        DB::transaction(function () use ($report, $action, $adminNote, $reporterNote, $targetType, $targetName, $suffix, $isUser) {
            $target = $report->target;
            $owner = null;

            // Identifikace majitele
            if ($target instanceof User) {
                $owner = $target;
            } elseif ($target) {
                if (method_exists($target, 'reviewer')) {
                    $owner = $target->reviewer()->withTrashed()->first();
                } elseif (method_exists($target, 'user')) {
                    $owner = $target->user()->withTrashed()->first();
                }
            }

            // Provedení akce
            switch ($action) {
                case 'warn_user':
                    // U napomenutí nic neměníme, pouze pokračujeme k odeslání notifikace níže
                    break;
                case 'strike_user':
                    // STRIKE: Funguje pro uživatele přímo, i pro majitele obsahu
                    $owner = $isUser ? $target : $target->user ?? $target->reviewer;
                    if ($owner) {
                        $owner->increment('strikes_count');
                        $owner->refresh();
                        if ($owner->strikes_count >= 3) {
                            $autoReason = 'Dosáhli jste 3 varování.';
                            $owner->update(['is_banned' => true, 'ban_reason' => 'Dosáhli jste 3 varování.']);
                            $owner->delete(); // Soft delete při automatickém banu

                            // Pokud admin nezadal vlastní důvod, doplníme automatický důvod banu
                            if (empty($adminNote)) {
                                $adminNote = $autoReason;
                            }
                        }
                    }
                    // Pokud to nebyl nahlášený uživatel přímo, ale jeho inzerát/recenze, smažeme ten obsah
                    if (! $isUser && $target) {
                        $target->delete();
                    }
                    break;

                case 'ban_user':
                    // BAN: Zablokuje uživatele a provede soft-delete
                    $owner = $isUser ? $target : $target->user ?? $target->reviewer;
                    if ($owner) {
                        $owner->update([
                            'is_banned' => true,
                            'ban_reason' => $adminNote,
                        ]);
                        $owner->delete(); // Soft delete - zapíše deleted_at
                    }
                    if (! $isUser && $target) {
                        $target->delete();
                    }
                    break;

                case 'hide_content':
                    if ($target instanceof Item) {
                        $target->update(['active_item' => 0]); 
                    }
                    break;

                case 'delete_content':
                    // Bezpečné zpracování akce delete_content i pro uživatelský typ cíle
                    if ($isUser) {
                        $target->delete();
                    } else {
                        $target->delete();
                    }
                    break;
            }

            // Uzavření nahlášení a uložení metadat o řešení
            $report->update([
                'status' => $action === 'dismiss' ? 'dismissed' : 'resolved',
                'resolution_action' => $action,
                'admin_note' => $adminNote,
                'reporter_note' => $reporterNote,
                'resolved_by' => auth()->id(),
                'resolved_at' => now(),
            ]);

            // Odeslání notifikace vlastníkovi cílového objektu mimo akci dismiss
            if ($owner && $action !== 'dismiss') {
                $notifTitle = 'Tým TechWatch: Smazání obsahu';
                if ($action === 'strike_user') {
                    $notifTitle = 'Tým TechWatch: Varování (Strike)';
                }
                if ($action === 'ban_user') {
                    $notifTitle = 'Tým TechWatch: Zablokování účtu';
                }
                if ($action === 'hide_content') {
                    $notifTitle = 'Tým TechWatch: Skrytí inzerátu';
                }


                // Volba tvaru zájmena podle rodu cílového typu obsahu
                $pronoun = ($suffix === 'a') ? 'Vaše' : 'Váš';

                // Sestavení textu notifikace podle typu provedené moderace
                if ($action === 'strike_user') {
                    $currentStrikes = $owner->strikes_count;
                    $verb = ($suffix === 'a') ? 'byla vyhodnocena jako závadná' : 'byl vyhodnocen jako závadný';

                    if ($currentStrikes >= 3) {
                        $notifTitle = 'Tým TechWatch: Zablokování účtu';
                        $fullDescription = "Dobrý den, $pronoun $targetType $targetName $verb. ".
                                        'Za opakované porušení pravidel Vám byl udělen **3. strike**, a proto byl Váš účet **trvale zablokován**.';
                    } else {
                        $fullDescription = "Dobrý den, $pronoun $targetType $targetName $verb. ".
                                        "Za porušení pravidel vám byl udělen **Strike**. Toto je Váš **$currentStrikes. ze 3 možných**. ".
                                        'Upozorujeme, že při dosažení **3 striků** bude Váš účet **zablokován**.';
                    }
                } elseif ($action === 'ban_user') {
                    $fullDescription = "Dobrý den, $pronoun $targetType $targetName byl důvodem pro okamžité **zablokování Vašeho účtu**.";
                } elseif ($action === 'hide_content'){
                    $verb = ($suffix === 'a') ? 'byla skryta' : (($suffix === '') ? 'byl skryt' : 'bylo skryto');
                    $fullDescription = "Dobrý den, $pronoun $targetType $targetName $verb. ".
                                    "Inzerát můžete po opravě zpětovně aktivovat.";
                } elseif ($action === 'warn_user') {
                    $notifTitle = 'Tým TechWatch';
                    $fullDescription = $adminNote;           
                    // Vynulujeme adminNote pro tento case, aby se text dole nedubloval
                    $adminNote = null; 
                }
                else {
                    $verb = ($suffix === 'a') ? 'byla odstraněna' : (($suffix === '') ? 'byl odstraněn' : 'bylo odstraněno');
                    $fullDescription = "Dobrý den, $pronoun $targetType $targetName $verb z důvodu porušení pravidel.";
                }

                if (! empty($adminNote)) {
                    $fullDescription .= "\n**Odůvodnění**: $adminNote";
                }

                // Sanitizace a formátování textu před odesláním e-mailu/notifikace
                $fullDescription = strip_tags($fullDescription);
                $fullDescription = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $fullDescription);

                $notifOwner = Notification::create([
                    'user_id' => $owner->id,
                    'sender_id' => auth()->id(),
                    'type' => 'moderation_action',
                    'title' => $notifTitle,
                    'description' => $fullDescription,
                    'data' => ['action' => $action, 'is_alert' => true],
                ]);

                broadcast(new NotificationSent($notifOwner))->toOthers();

                // Email posíláme POUZE u striku nebo banu
                if (in_array($action, ['strike_user', 'ban_user']) && $owner && $owner->email) {
                    // Předáváme notifikaci a typ akce (string)
                    Mail::to($owner->email)->send(new ModerationActionMail($notifOwner, $action));
                }
            }

            // Notifikace oznamovateli
            if ($report->reporter && $reporterNote) {
                $notifReporter = Notification::create([
                    'user_id' => $report->reporter_id,
                    'sender_id' => auth()->id(),
                    'type' => 'report_feedback',
                    'title' => 'Tým TechWatch',
                    'description' => $reporterNote,
                    'data' => ['report_id' => $report->id],
                ]);
                broadcast(new NotificationSent($notifReporter))->toOthers();
            }
        });

        return response()->json(['message' => 'Nahlášení bylo úspěšně vyřešeno.']);
    }

    public function getResolvedReports()
    {
        return Report::with('reporter')
            ->whereIn('status', ['resolved', 'dismissed'])
            ->whereNotNull('target_type')
            ->orderBy('resolved_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($report) {
                try {
                    $target = $report->target_type::withTrashed()->find($report->target_id);
                    if ($target) {
                        $modelName = class_basename($report->target_type);
                        if ($modelName === 'Item') {
                            $target->load('user');
                        }
                        if ($modelName === 'ReviewUser') {
                            $target->load(['reviewer', 'reviewedUser']);
                        }
                        if ($modelName === 'ReviewItem') {
                            $target->load(['reviewer', 'item']);
                        }
                    }
                    $report->setRelation('target', $target); // Nastavíme relaci "oficiálně"
                } catch (\Exception $e) {
                    $report->setRelation('target', null);
                }

                return $report;
            });
    }

    public function revertReport(Request $request, $id)
    {
        $report = Report::findOrFail($id);
        $shouldNotify = $request->input('notify', false);
        $revertNote = trim($request->input('revert_note', ''));

        $originalAction = $report->resolution_action;

        DB::transaction(function () use ($report, $shouldNotify, $originalAction, $revertNote) {
            $modelClass = $report->target_type;
            $target = $modelClass::withTrashed()->find($report->target_id);

            // Obnova cíle
            if (in_array($originalAction, ['delete_content', 'strike_user', 'ban_user'])) {
                if ($target && method_exists($target, 'restore') && $target->trashed()) {
                    $target->restore();
                }
            }

            // Textace (přesunuto nad notifikaci)
            $targetType = 'obsah';
            $targetName = '';
            $suffix = '';

            if ($target) {
                $modelName = class_basename($modelClass);
                $targetDate = $target->created_at ? $target->created_at->format('d.m.Y') : '';

                switch ($modelName) {
                    case 'Item':
                        $targetType = 'inzerát';
                        $targetName = "**„{$target->title}“**";
                        $suffix = '';
                        break;
                    case 'User':
                        $targetType = 'účet';
                        $targetName = "**{$target->first_name} {$target->last_name}**";
                        $suffix = '';
                        break;
                    case 'ReviewUser':
                        $targetType = 'recenze';
                        $profileOwner = $target->reviewedUser ? "{$target->reviewedUser->first_name} {$target->reviewedUser->last_name}" : null;
                        $targetName = "uživatele **$profileOwner** ze dne **$targetDate**";
                        $suffix = 'a';
                        break;
                    case 'ReviewItem':
                        $targetType = 'recenze';
                        $itemTitle = $target->item ? "„{$target->item->title}“" : 'inzerátu';
                        $targetName = "nabídky **$itemTitle** ze dne **$targetDate**";
                        $suffix = 'a';
                        break;
                }
            }

            // Správa postihů
            $owner = null;
            if ($target instanceof User) {
                $owner = $target;
            } elseif ($target) {
                if (method_exists($target, 'user')) {
                    $owner = $target->user()->withTrashed()->first();
                } elseif (method_exists($target, 'reviewer')) {
                    $owner = $target->reviewer()->withTrashed()->first();
                }
            }

            if ($owner) {
                $hadStrikeOrBan = ($owner->strikes_count > 0 || $owner->is_banned);
                $strikeWasRemoved = false;

                if ($owner->strikes_count > 0) {
                    $owner->decrement('strikes_count');
                    $strikeWasRemoved = true;
                }

                $wasUnbanned = false;
                // Pokud je uživatel zablokovaný a počet striků klesl pod 3, odbanujeme ho
                if ($owner->is_banned && $owner->strikes_count < 3) {
                    $owner->update([
                        'is_banned' => false,
                        'ban_reason' => null,
                    ]);

                    // Pokud byl uživatel smazaný (banem), musíme ho obnovit v DB
                    if (method_exists($owner, 'restore') && $owner->trashed()) {
                        $owner->restore();
                    }

                    $wasUnbanned = true;
                }

                // Logika notifikace
                $isSoftAction = in_array($originalAction, ['hide_content', 'warn_user']);

                // Notifikace - Vše musí být uvnitř této podmínky
                if ($shouldNotify && $report->status === 'resolved') {
                    $title = 'Tým TechWatch';
                    $msg = '';

                    if ($isSoftAction) { 
                        $msg = $revertNote; // U napomenutí/skrytí posíláme jen to, co napsal admin pokud něco napsal
                    }
                    else{
                        $pronoun = ($suffix === 'a') ? 'Vaše' : 'Váš';
                        $verb = ($suffix === 'a') ? 'obnovena' : 'obnoven';

                        $msg = "Dobrý den, po dodatečném přezkoumání byl $pronoun $targetType $targetName $verb.";

                        if ($strikeWasRemoved) {
                            $currentStrikes = $owner->strikes_count;
                            $msg .= " Na základě toho Vám byl **odmazán jeden Strike**. Aktuálně máte **$currentStrikes ze 3**.";
                        }

                        if ($wasUnbanned) {
                            $msg .= ' Zároveň byl Váš účet **plně odblokován** a přístup k němu **obnoven**.';
                        }
                    }
                    if (!empty(trim(strip_tags($msg)))) {

                        // Očistit od nebezpečných tagů
                        $msg = strip_tags($msg);
                        // Převést konce řádků na <br> (klíčové pro Outlook)
                        $msg = nl2br($msg);
                        // Nahradit Markdown za strong
                        $msg = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $msg);

                        $notif = Notification::create([
                            'user_id' => $owner->id,
                            'sender_id' => auth()->id(),
                            'type' => 'moderation_action',
                            'title' => $title,
                            'description' => $msg,
                            'data' => ['action' => 'revert'],
                        ]);

                        broadcast(new NotificationSent($notif))->toOthers();

                        if ($hadStrikeOrBan && $owner->email) {
                            Mail::to($owner->email)->send(new ModerationActionMail($notif, 'revert'));
                        }
                    }

                }
            }

            // Reset reportu (vždy na konci transakce)
            $report->update([
                'status' => 'pending',
                'resolved_at' => null,
                'resolved_by' => null,
                'resolution_action' => null,
                'admin_note' => null,
                'reporter_note' => null,
            ]);
        });

        return response()->json(['message' => 'Akce byla vrácena a obsah obnoven.']);
    }
}
