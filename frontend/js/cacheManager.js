class CacheManager {
    constructor() {
        this.cachePrefix = 'title_alloc_';
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.init();
    }

    init() {
        // Clean up expired cache entries on startup
        this.cleanupExpired();
    }

    // Generate cache key based on endpoint and parameters
    generateKey(endpoint, params = {}) {
        const paramString = JSON.stringify(params);
        return `${this.cachePrefix}${endpoint}_${btoa(paramString)}`;
    }

    // Set cache with TTL (Time To Live)
    set(key, data, ttl = this.defaultTTL) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
            return true;
        } catch (error) {
            console.warn('Cache set failed:', error);
            return false;
        }
    }

    // Get cached data if not expired
    get(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const cacheItem = JSON.parse(cached);
            const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;

            if (isExpired) {
                this.remove(key);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            console.warn('Cache get failed:', error);
            this.remove(key);
            return null;
        }
    }

    // Remove specific cache entry
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Cache remove failed:', error);
        }
    }

    // Clear all cache entries for this app
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.cachePrefix)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('All cache cleared');
        } catch (error) {
            console.warn('Cache clear all failed:', error);
        }
    }

    // Clean up expired cache entries
    cleanupExpired() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.cachePrefix)) {
                    this.get(key); // This will remove if expired
                }
            });
        } catch (error) {
            console.warn('Cache cleanup failed:', error);
        }
    }

    // Get cache statistics
    getStats() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.cachePrefix));
        let totalSize = 0;
        
        keys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                totalSize += new Blob([item]).size;
            } catch (error) {
                // Skip if can't calculate size
            }
        });

        return {
            totalEntries: keys.length,
            totalSize: this.formatBytes(totalSize),
            cacheKeys: keys.map(key => key.replace(this.cachePrefix, ''))
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global cache instance
window.cacheManager = new CacheManager();