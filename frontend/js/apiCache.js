class APICache {
    constructor() {
        this.cacheManager = window.cacheManager;
        this.cacheConfig = {
            // Cache configuration for different endpoints
            '/api/titles': { ttl: 2 * 60 * 1000 }, // 2 minutes
            '/api/users/supervisors': { ttl: 5 * 60 * 1000 }, // 5 minutes
            '/api/system-settings': { ttl: 1 * 60 * 1000 }, // 1 minute
            '/api/preferences': { ttl: 30 * 1000 }, // 30 seconds (user-specific)
            '/api/allocations': { ttl: 30 * 1000 }, // 30 seconds
            '/api/users': { ttl: 2 * 60 * 1000 }, // 2 minutes (admin only)
            '/api/custom-titles': { ttl: 2 * 60 * 1000 }, // 2 minutes
            '/api/capacity-conflicts/conflicts': { ttl: 1 * 60 * 1000 }, // 1 minute
            '/api/second-markers/assignments': { ttl: 2 * 60 * 1000 } // 2 minutes
        };
    }

    // Enhanced API call with caching
    async call(url, options = {}) {
        const method = options.method || 'GET';
        
        // Only cache GET requests
        if (method !== 'GET') {
            // Invalidate related cache on mutations
            this.invalidateRelatedCache(url, method);
            return this.makeAPICall(url, options);
        }

        // Check cache first
        const cacheKey = this.cacheManager.generateKey(url, options.data);
        const cachedData = this.cacheManager.get(cacheKey);

        if (cachedData) {
            console.log(`[Cache] Serving from cache: ${url}`);
            return cachedData;
        }

        // Make API call and cache result
        console.log(`[Cache] Making API call: ${url}`);
        const data = await this.makeAPICall(url, options);
        
        if (data) {
            const config = this.cacheConfig[url] || {};
            this.cacheManager.set(cacheKey, data, config.ttl);
        }

        return data;
    }

    async makeAPICall(url, options = {}) {
        try {
            const token = localStorage.getItem('token');
            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const mergedOptions = { ...defaultOptions, ...options };
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Invalidate cache when data changes
    invalidateRelatedCache(url, method) {
        if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
            const cacheKeys = Object.keys(localStorage);
            
            cacheKeys.forEach(key => {
                if (key.includes(this.cacheManager.cachePrefix)) {
                    // Invalidate cache for related endpoints
                    if (this.shouldInvalidate(key, url)) {
                        this.cacheManager.remove(key);
                        console.log(`[Cache] Invalidated: ${key}`);
                    }
                }
            });
        }
    }

    shouldInvalidate(cacheKey, mutatedUrl) {
        const key = cacheKey.replace(this.cacheManager.cachePrefix, '');
        
        // Define invalidation rules
        const invalidationRules = {
            '/api/titles': ['/api/titles', '/api/users/supervisors'],
            '/api/preferences': ['/api/preferences', '/api/allocations'],
            '/api/allocations': ['/api/allocations', '/api/second-markers/assignments'],
            '/api/users': ['/api/users', '/api/users/supervisors'],
            '/api/custom-titles': ['/api/custom-titles', '/api/capacity-conflicts/conflicts'],
            '/api/system-settings': ['/api/system-settings']
        };

        for (const [mutatedEndpoint, affectedEndpoints] of Object.entries(invalidationRules)) {
            if (mutatedUrl.includes(mutatedEndpoint)) {
                return affectedEndpoints.some(endpoint => key.includes(endpoint));
            }
        }

        return false;
    }

    // Preload common data
    async preloadCommonData() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) return;

        const preloadUrls = [
            '/api/system-settings',
            '/api/users/supervisors'
        ];

        if (user.role === 'student') {
            preloadUrls.push('/api/titles');
            preloadUrls.push('/api/preferences');
        } else if (user.role === 'admin') {
            preloadUrls.push('/api/titles');
            preloadUrls.push('/api/users');
            preloadUrls.push('/api/custom-titles');
        }

        // Preload in background
        preloadUrls.forEach(url => {
            this.call(url).catch(error => {
                console.warn(`Preload failed for ${url}:`, error);
            });
        });
    }

    // Clear all cache (useful for logout)
    clearAll() {
        this.cacheManager.clearAll();
    }
}

// Create global API cache instance
window.apiCache = new APICache();