const API_BASE = "http://localhost/Tourism_management_system/Tourism-Management-System-Taxi-Service-Module/api";

// 1. UTILS MUST BE DEFINED BEFORE AUTHSERVICE USES THEM
const Utils = {
    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },
    showLoading(element) {
        element.innerHTML = '<div class="loading"></div>';
    },
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// 2. TOAST NOTIFICATION FUNCTION
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '1000';
    toast.innerHTML = `
        <div class="toast-content" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 5px solid ${type === 'error' ? 'red' : 'green'}">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()" style="margin-left: 10px; border: none; background: none; cursor: pointer;">×</button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

// 3. AUTHENTICATION CLASS

class AuthService {
    static async login(email, password) {
    if (!email || !password) {
        showToast('Please enter email and password', 'warning');
        return;
    }
    if (!Utils.validateEmail(email)) {
        showToast('Please enter a valid email address', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/auth/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.success) {
            // Save the full user object
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            showToast('Login successful!', 'success');
            setTimeout(() => {
                if (data.role === 'Admin') {
                    window.location.href = 'admin.html';
                } else if (data.role === 'Manager') {
                    window.location.href = 'manager.html';
                } else {
                    window.location.href = 'tourist.html';
                }
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}
}

// 4. SESSION MANAGEMENT
class SessionManager {
    static async logout() {
        localStorage.removeItem('currentUser'); // Clear saved user
        try {
            await fetch(`${API_BASE}/auth/logout.php`);
        } catch (error) {}
        window.location.href = 'login.html';
    }

    static getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
}

window.AuthService = AuthService;
window.SessionManager = SessionManager;