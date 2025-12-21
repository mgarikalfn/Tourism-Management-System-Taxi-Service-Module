// API Configuration
const API_BASE = "http://localhost/taxi_service/api";

// Common Utilities
const Utils = {
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
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
    },

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

// Session Management
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
        }
    }

    static updateUserUI(user) {
        const userElement = document.getElementById('userEmail');
        if (userElement && user) {
            userElement.textContent = user.email;
            userElement.setAttribute('title', `Role: ${user.role}`);
        }
    }
}

// Taxi Service
class TaxiService {
    static async loadTaxis() {
        try {
            const response = await fetch(`${API_BASE}/taxi/list_taxis.php`);
            const data = await response.json();
            
            const container = document.getElementById('taxiList');
            if (!container) return;
            
            if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(taxi => `
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">${taxi.vehicle_type}</div>
                            <div class="list-item-subtitle">
                                Driver: ${taxi.driver_name} • 
                                Price: $${taxi.price_per_km}/km • 
                                Available: ${taxi.is_available ? 'Yes' : 'No'}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" 
                                onclick="TaxiService.selectTaxi(${taxi.id}, '${taxi.vehicle_type}')"
                                ${!taxi.is_available ? 'disabled' : ''}>
                            ${taxi.is_available ? 'Select' : 'Unavailable'}
                        </button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-center text-gray-400">No taxis available at the moment.</p>';
            }
        } catch (error) {
            console.error('Failed to load taxis:', error);
            Utils.showToast('Failed to load taxi data', 'error');
        }
    }

    static selectTaxi(id, name) {
        document.getElementById('taxiId').value = id;
        document.getElementById('selectedTaxiName').textContent = name;
        document.getElementById('selectionBanner').classList.remove('hidden');
        document.getElementById('confirmBtn').disabled = false;
        
        // Smooth scroll to booking form
        document.getElementById('booking-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        Utils.showToast(`Selected: ${name}`, 'success');
    }

    static async bookTaxi() {
        const taxiId = document.getElementById('taxiId').value;
        const pickupTime = document.getElementById('pickup_time').value;
        const pickup = document.getElementById('pickup').value;
        const dropoff = document.getElementById('dropoff').value;
        
        if (!taxiId) {
            Utils.showToast('Please select a taxi first', 'warning');
            return;
        }
        
        if (!pickupTime || !pickup || !dropoff) {
            Utils.showToast('Please fill all required fields', 'warning');
            return;
        }
        
        const payload = {
            taxi_id: taxiId,
            pickup_time: pickupTime,
            pickup_location: pickup,
            dropoff_location: dropoff
        };
        
        try {
            const response = await fetch(`${API_BASE}/booking/create_booking.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showToast('Booking successful!', 'success');
                
                // Reset form
                document.getElementById('selectionBanner').classList.add('hidden');
                document.getElementById('confirmBtn').disabled = true;
                document.getElementById('pickup').value = '';
                document.getElementById('dropoff').value = '';
                document.getElementById('pickup_time').value = '';
                
                // Refresh lists
                this.loadTaxis();
                BookingService.loadUserBookings();
            } else {
                Utils.showToast(data.message || 'Booking failed', 'error');
            }
        } catch (error) {
            console.error('Booking failed:', error);
            Utils.showToast('Network error. Please try again.', 'error');
        }
    }
}

// Booking Management
class BookingService {
    static async loadUserBookings() {
        try {
            const response = await fetch(`${API_BASE}/booking/my_bookings.php`);
            const data = await response.json();
            
            const container = document.getElementById('bookingList');
            if (!container) return;
            
            if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(booking => `
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">
                                ${booking.vehicle_type} • ${booking.pickup_location} → ${booking.dropoff_location}
                            </div>
                            <div class="list-item-subtitle">
                                ${Utils.formatDateTime(booking.pickup_time)} • 
                                Status: <span class="badge badge-${this.getStatusColor(booking.status)}">${booking.status}</span>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            $${booking.total_price || 'N/A'}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-center text-gray-400">No bookings found.</p>';
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
        }
    }

    static getStatusColor(status) {
        const statusMap = {
            'Pending': 'warning',
            'Confirmed': 'info',
            'Completed': 'success',
            'Cancelled': 'danger'
        };
        return statusMap[status] || 'secondary';
    }
}

// Manager Dashboard
class ManagerDashboard {
    static async loadAllBookings() {
        try {
            const response = await fetch(`${API_BASE}/booking/all_bookings.php`);
            const data = await response.json();
            
            const container = document.getElementById('managerBookingList');
            if (!container) return;
            
            if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(booking => `
                    <tr>
                        <td>${booking.id}</td>
                        <td>${booking.customer_email}</td>
                        <td>${booking.vehicle_type}</td>
                        <td>${booking.pickup_location} → ${booking.dropoff_location}</td>
                        <td>${Utils.formatDateTime(booking.pickup_time)}</td>
                        <td>
                            <span class="badge badge-${BookingService.getStatusColor(booking.status)}">
                                ${booking.status}
                            </span>
                        </td>
                        <td>
                            <div class="flex gap-1">
                                ${booking.status === 'Pending' ? 
                                    `<button class="btn btn-success btn-sm" onclick="ManagerDashboard.updateStatus(${booking.id}, 'Confirmed')">
                                        Confirm
                                    </button>` : ''}
                                ${booking.status === 'Confirmed' ? 
                                    `<button class="btn btn-primary btn-sm" onclick="ManagerDashboard.updateStatus(${booking.id}, 'Completed')">
                                        Complete
                                    </button>` : ''}
                                ${!['Completed', 'Cancelled'].includes(booking.status) ? 
                                    `<button class="btn btn-danger btn-sm" onclick="ManagerDashboard.updateStatus(${booking.id}, 'Cancelled')">
                                        Cancel
                                    </button>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-8 text-gray-400">
                            No bookings found
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
        }
    }

    static async updateStatus(bookingId, status) {
        if (!confirm(`Are you sure you want to change status to "${status}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/booking/update_booking_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    booking_id: bookingId, 
                    status: status 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showToast(`Booking status updated to ${status}`, 'success');
                this.loadAllBookings();
            } else {
                Utils.showToast(data.message || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Status update failed:', error);
            Utils.showToast('Network error. Please try again.', 'error');
        }
    }
}

// External Services
class ExternalServices {
    static consumeHotel() {
        Utils.showToast('Connecting to Hotel Services...', 'info');
        // Implementation for Group 2 API
        setTimeout(() => {
            window.open('http://group2-api.example.com/hotels', '_blank');
        }, 1000);
    }

    static consumeRestaurant() {
        Utils.showToast('Connecting to Restaurant Services...', 'info');
        // Implementation for Group 3 API
        setTimeout(() => {
            window.open('http://group3-api.example.com/restaurants', '_blank');
        }, 1000);
    }
}

// Authentication
class AuthService {
    static async login(email, password) {
        if (!email || !password) {
            Utils.showToast('Please enter email and password', 'warning');
            return;
        }
        
        if (!Utils.validateEmail(email)) {
            Utils.showToast('Please enter a valid email address', 'warning');
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
                Utils.showToast('Login successful!', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    if (data.role === 'Manager' || data.role === 'Admin') {
                        window.location.href = 'manager.html';
                    } else {
                        window.location.href = 'tourist.html';
                    }
                }, 1000);
            } else {
                Utils.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showToast('Network error. Please try again.', 'error');
        }
    }

    static async register(email, password, role) {
        if (!email || !password) {
            Utils.showToast('Please fill all fields', 'warning');
            return;
        }
        
        if (!Utils.validateEmail(email)) {
            Utils.showToast('Please enter a valid email address', 'warning');
            return;
        }
        
        if (password.length < 6) {
            Utils.showToast('Password must be at least 6 characters', 'warning');
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
                Utils.showToast('Registration successful! Redirecting to login...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                Utils.showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            Utils.showToast('Network error. Please try again.', 'error');
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Add CSS for toast notifications
    const toastCSS = `
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            min-width: 300px;
            max-width: 400px;
        }
        
        .toast-content {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-left: 4px solid #2563eb;
        }
        
        .toast-success .toast-content {
            border-left-color: #10b981;
        }
        
        .toast-warning .toast-content {
            border-left-color: #f59e0b;
        }
        
        .toast-error .toast-content {
            border-left-color: #ef4444;
        }
        
        .toast-message {
            flex: 1;
        }
        
        .toast-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #64748b;
            margin-left: 1rem;
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = toastCSS;
    document.head.appendChild(style);
    
    // Check session on protected pages
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('signup.html')) {
        const user = await SessionManager.checkSession();
        if (user) {
            SessionManager.updateUserUI(user);
            
            // Page-specific initializations
            if (document.getElementById('taxiList')) {
                TaxiService.loadTaxis();
                BookingService.loadUserBookings();
            }
            
            if (document.getElementById('managerBookingList')) {
                ManagerDashboard.loadAllBookings();
            }
        }
    }
});