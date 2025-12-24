function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '1000';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

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
                showToast('Login successful!', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    if (data.role === 'Manager' || data.role === 'Admin') {
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

    static async register(email, password, role) {
        if (!email || !password) {
            showToast('Please fill all fields', 'warning');
            return;
        }
        
        if (!Utils.validateEmail(email)) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Registration successful! Redirecting to login...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Network error. Please try again.', 'error');
        }
    }
}

const Utils = {
    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
class SessionManager {
    static async checkSession() {
        try {
            const response = await fetch(`${API_BASE}/auth/check_session.php`);
            const data = await response.json();
            
            if (!data.logged_in) {
                window.location.href = 'pages/login.html';
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = 'pages/login.html';
            return null;
        }
    }

    static async logout() {
        try {
            await fetch(`${API_BASE}/auth/logout.php`);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = 'login.html';
        }
    }

   static updateUserUI(user) {
        const userElement = document.getElementById('userEmail');
        if (userElement && user) {
            userElement.textContent = user.email;
            userElement.setAttribute('title', `Role: ${user.role}`);
            
            // Also update any other user info elements
            const userBadges = document.querySelectorAll('.user-badge');
            userBadges.forEach(badge => {
                badge.textContent = user.email;
            });
        }
        
        // Add dashboard link for managers/admins if on tourist page
        if ((user.role === 'Manager' || user.role === 'Admin') && 
            window.location.pathname.includes('tourist.html')) {
            this.addDashboardLink();
        }
    }
    
    static addDashboardLink() {
        // Check if dashboard link already exists
        if (document.getElementById('dashboardLink')) return;
        
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;
        
        // Create dashboard link
        const dashboardLink = document.createElement('a');
        dashboardLink.id = 'dashboardLink';
        dashboardLink.href = 'manager.html';
        dashboardLink.className = 'nav-link';
        dashboardLink.innerHTML = '<i class="fas fa-chart-line"></i> Dashboard';
        
        // Insert before logout button/user info
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            navLinks.insertBefore(dashboardLink, userInfo);
        } else {
            navLinks.appendChild(dashboardLink);
        }
    }
}




window.AuthService = AuthService;
window.SessionManager = SessionManager;

/* function updateNavbar() {

    // We check a small helper API to see who is logged in
    fetch('../api/auth/check_session.php')
    .then(res => res.json())
    .then(data => {
        const navContainer = document.getElementById('dynamic-nav');
        if (!data.logged_in) {
            navContainer.innerHTML = `
                <a href="login.html" class="nav-link">Login</a>
                <a href="signup.html" class="nav-link">Signup</a>
            `;
            return;
        }

        let navHTML = `
            <a href="tourist.html" class="nav-link">Taxis</a>
            <a href="#" onclick="consume('Hotel')" class="nav-link">Hotels</a>
            <a href="#" onclick="consume('Restaurant')" class="nav-link">Restaurants</a>
        `;

        // If Manager or Admin, add managerial links
        if (data.role === 'Manager' || data.role === 'Admin') {
            navHTML += `
                <div class="manager-only" style="display:flex; gap:15px;">
                    <a href="manager.html" class="nav-link" style="color:#f1c40f">📋 Manage Bookings</a>
                    <a href="add_taxi.html" class="nav-link" style="color:#f1c40f">🚖 Add Taxi</a>
                </div>
            `;
        }

        navHTML += `<button onclick="logout()" class="btn-logout">Logout (${data.email})</button>`;
        navContainer.innerHTML = navHTML;
    });
} */