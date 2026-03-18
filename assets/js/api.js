/**
 * api.js - Centralized API Service for QuizWeb
 * Handles all network requests to the backend, token injection, and global error handling.
 */

const API_BASE_URL = 'http://localhost:8080/api';

// Helper to get the JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('quiz_auth_token');
}

// Global Loading State Management
let activeRequests = 0;
let loadingOverlay = null;

function showLoading() {
    if (activeRequests === 0) {
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'fixed inset-0 z-[9999] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-200 pointer-events-none';
            loadingOverlay.innerHTML = `
                <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 pointer-events-auto">
                    <div class="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Đang tải...</span>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
            // Trigger reflow
            void loadingOverlay.offsetWidth;
        }
        loadingOverlay.classList.remove('opacity-0');
    }
    activeRequests++;
}

function hideLoading() {
    activeRequests--;
    if (activeRequests <= 0) {
        activeRequests = 0;
        if (loadingOverlay) {
            loadingOverlay.classList.add('opacity-0');
            setTimeout(() => {
                if (activeRequests === 0 && loadingOverlay && loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                    loadingOverlay = null;
                }
            }, 200);
        }
    }
}

// Helper to handle API responses globally
async function handleResponse(response) {
    if (response.status === 401) {
        // Unauthorized - Token expired or invalid
        localStorage.removeItem('quiz_auth_token');
        localStorage.removeItem('quiz_user_profile');
        
        // Don't redirect if we are already on login page to avoid loops
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            window.location.href = '../pages/login.html';
        }
    }

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        const errorMessage = data.message || 'Có lỗi xảy ra khi kết nối máy chủ.';
        throw new Error(errorMessage);
    }

    return data;
}

/**
 * Standard GET request
 * @param {string} endpoint - e.g. '/users'
 */
async function apiGet(endpoint) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
        headers['x-auth-token'] = token;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: headers
        });

        return handleResponse(response);
    } finally {
        hideLoading();
    }
}

/**
 * Standard POST request
 * @param {string} endpoint - e.g. '/auth/login'
 * @param {object} payload - Body data
 */
async function apiPost(endpoint, payload) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
        headers['x-auth-token'] = token;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        return handleResponse(response);
    } finally {
        hideLoading();
    }
}

/**
 * Standard PUT request
 * @param {string} endpoint - e.g. '/users/1'
 * @param {object} payload - Body data
 */
async function apiPut(endpoint, payload) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
        headers['x-auth-token'] = token;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        });

        return handleResponse(response);
    } finally {
        hideLoading();
    }
}

/**
 * Standard DELETE request
 * @param {string} endpoint - e.g. '/users/1'
 */
async function apiDelete(endpoint) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
        headers['x-auth-token'] = token;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: headers
        });

        return handleResponse(response);
    } finally {
        hideLoading();
    }
}

// Export for global use in HTML pages if loaded as module, otherwise rely on window
window.API = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete
};
