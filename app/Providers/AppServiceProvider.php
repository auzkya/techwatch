<?php

namespace App\Providers;

use App\Models\ReviewItem;
use App\Models\ReviewUser;
use App\Observers\ReviewItemObserver;
use App\Observers\ReviewUserObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            // Nastavení limitu API požadavků na 1000 za minutu pro vývojové prostředí
            return Limit::perMinute(1000)->by($request->user()?->id ?: $request->ip());
        });

        ReviewUser::observe(ReviewUserObserver::class);
        ReviewItem::observe(ReviewItemObserver::class);
    }
}
