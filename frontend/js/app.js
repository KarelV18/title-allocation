class App {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // This will be called when the app loads
        console.log('App initialized');
        
        // Check if user is logged in and update UI accordingly
        this.checkAuthStatus();
        
        // Initialize any global event listeners
        this.initGlobalListeners();
    }

    checkAuthStatus() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('token');
        
        if (user && token) {
            this.currentUser = user;
            // Auth.js already handles showing the main app, so we don't need to do anything here
        }
    }

    initGlobalListeners() {
        // Global event listeners can go here
        console.log('Global listeners initialized');
    }

    // Utility method for making API calls with error handling
    async apiCall(url, options = {}) {
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

    // Show loading spinner
    showLoading(container) {
        const loadingHtml = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p class="mt-4 text-gray-600">Loading...</p>
            </div>
        `;
        if (container) {
            $(container).html(loadingHtml);
        }
        return loadingHtml;
    }

    // Show error message
    showError(message, container) {
        const errorHtml = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> ${message}
            </div>
        `;
        if (container) {
            $(container).html(errorHtml);
        }
        return errorHtml;
    }

    // Show success message
    showSuccess(message, container) {
        const successHtml = `
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ${message}
            </div>
        `;
        if (container) {
            $(container).html(successHtml);
        }
        return successHtml;
    }
}

// Initialize the app when document is ready
$(document).ready(() => {
    window.app = new App();
    
    // Global error handler for AJAX calls
    $(document).ajaxError(function(event, jqxhr, settings, thrownError) {
        if (jqxhr.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        } else if (jqxhr.status === 403) {
            alert('You do not have permission to perform this action.');
        }
    });
});