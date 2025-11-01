// API Configuration
const API_URL = '/api';

// Utility Functions
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Auth Functions
async function login(email, password) {
    return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

async function register(name, email, password) {
    return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
}

async function getCurrentUser() {
    return await apiRequest('/auth/me');
}

async function logout() {
    try {
        await apiRequest('/auth/logout', {
            method: 'POST'
        });
    } finally {
        removeToken();
        showLoginCard();
    }
}

// UI Functions
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    }
}

function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

function showLoginCard() {
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const dashboardCard = document.getElementById('dashboardCard');
    
    if (loginCard) loginCard.style.display = 'block';
    if (registerCard) registerCard.style.display = 'none';
    if (dashboardCard) dashboardCard.style.display = 'none';
}

function showRegisterCard() {
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const dashboardCard = document.getElementById('dashboardCard');
    
    if (loginCard) loginCard.style.display = 'none';
    if (registerCard) registerCard.style.display = 'block';
    if (dashboardCard) dashboardCard.style.display = 'none';
}

function showDashboardCard() {
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const dashboardCard = document.getElementById('dashboardCard');
    
    if (loginCard) loginCard.style.display = 'none';
    if (registerCard) registerCard.style.display = 'none';
    if (dashboardCard) dashboardCard.style.display = 'block';
    
    loadDashboardData();
}

async function loadDashboardData() {
    const token = getToken();
    if (!token) {
        showLoginCard();
        return;
    }

    try {
        const response = await getCurrentUser();
        if (response.success) {
            setUser(response.user);
            const user = response.user;
            
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            const userIdEl = document.getElementById('userId');
            
            if (userNameEl) userNameEl.textContent = user.name;
            if (userEmailEl) userEmailEl.textContent = user.email;
            if (userIdEl) userIdEl.textContent = user.id;
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        removeToken();
        showLoginCard();
    }
}

function setLoading(button, isLoading, originalText) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = originalText || button.dataset.originalText || '';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in (only on index.html)
    const token = getToken();
    const currentPage = window.location.pathname;
    
    // Only run auth logic on index.html
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
        if (token) {
            try {
                const response = await getCurrentUser();
                if (response.success) {
                    setUser(response.user);
                    showDashboardCard();
                    return;
                }
            } catch (error) {
                console.error('Token validation failed:', error);
                removeToken();
            }
        }

        showLoginCard();

        // Toggle between login and register
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterCard();
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginCard();
        });

        // Login Form Handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideError('errorMessage');
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                
                setLoading(submitBtn, true);

                try {
                    const response = await login(email, password);
                    if (response.success) {
                        setToken(response.token);
                        setUser(response.user);
                        showDashboardCard();
                    }
                } catch (error) {
                    showError('errorMessage', error.message || 'Login failed. Please try again.');
                } finally {
                    setLoading(submitBtn, false, 'Login');
                }
            });
        }

        // Register Form Handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideError('registerErrorMessage');
                
                const name = document.getElementById('regName').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const submitBtn = registerForm.querySelector('button[type="submit"]');

                if (password !== confirmPassword) {
                    showError('registerErrorMessage', 'Passwords do not match');
                    return;
                }

                if (password.length < 6) {
                    showError('registerErrorMessage', 'Password must be at least 6 characters long');
                    return;
                }

                setLoading(submitBtn, true);

                try {
                    const response = await register(name, email, password);
                    if (response.success) {
                        setToken(response.token);
                        setUser(response.user);
                        showDashboardCard();
                    }
                } catch (error) {
                    showError('registerErrorMessage', error.message || 'Registration failed. Please try again.');
                } finally {
                    setLoading(submitBtn, false, 'Register');
                }
            });
        }

        // Logout Button Handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await logout();
            });
        }
    }
});

