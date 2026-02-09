const CACHE_KEYS = {
    ACTIVE_WORKER_TILL: 'active_worker_till',
    PROFILE_IMAGE_URL: 'profile_image_url',
    PROFILE_ELIGIBLE: 'profile_eligible',
    USER_DATA: 'user_data', // Pro celý profil
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minut

class CacheManager {
    set(key, value, ttl = CACHE_TTL) {
        const item = {
            value,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    get(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            const isExpired = Date.now() - item.timestamp > item.ttl;

            if (isExpired) {
                this.remove(key);
                return null;
            }

            return item.value;
        } catch {
            this.remove(key);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(key);
    }

    clear() {
        Object.values(CACHE_KEYS).forEach(key => this.remove(key));
    }

    // Specifické metody pro často používané hodnoty
    setActiveWorkerTill(date) {
        this.set(CACHE_KEYS.ACTIVE_WORKER_TILL, date);
    }

    getActiveWorkerTill() {
        return this.get(CACHE_KEYS.ACTIVE_WORKER_TILL);
    }

    setProfileImage(url) {
        this.set(CACHE_KEYS.PROFILE_IMAGE_URL, url);
    }

    getProfileImage() {
        return this.get(CACHE_KEYS.PROFILE_IMAGE_URL);
    }

    // Pro celý user objekt (použij opatrně, má velkou TTL)
    setUserData(userData) {
        this.set(CACHE_KEYS.USER_DATA, userData, 60 * 60 * 1000); // 1 hodina
    }

    getUserData() {
        return this.get(CACHE_KEYS.USER_DATA);
    }

    // Pro kontrolu zda je uživatelský profil připravený (vyplněný) k hledání práce)
    setProfileEligible(data) {
        this.set(CACHE_KEYS.PROFILE_ELIGIBLE, data, 24 * 60 * 60 * 1000); // 24h
    }

    getProfileEligible() {
        return this.get(CACHE_KEYS.PROFILE_ELIGIBLE);
    }
}

export const cache = new CacheManager();
export { CACHE_KEYS };
