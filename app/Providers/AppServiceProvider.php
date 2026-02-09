<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\ReviewUser;
use App\Models\ReviewItem;
use App\Observers\ReviewUserObserver;
use App\Observers\ReviewItemObserver;

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
            // Navýšíme na 1000 požadavků za minutu pro vývoj
            return Limit::perMinute(1000)->by($request->user()?->id ?: $request->ip());
        });

        ReviewUser::observe(ReviewUserObserver::class);
        ReviewItem::observe(ReviewItemObserver::class);
    }
}
