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


class TaxiService {
    // 1. Load Taxis from your PHP API
    static async loadTaxis() {
        const container = document.getElementById('taxiList');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE}/taxi/available_taxi.php`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(taxi => `
                    <div class="list-item" style="border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display:block;">${taxi.vehicle_type}</strong>
                            <span style="font-size: 0.8rem; color: #666;">Driver: ${taxi.driver_name}</span>
                            <div style="color: #2c3e50; font-weight: bold;">$${taxi.price_per_km}/km</div>
                        </div>
                        <button class="btn btn-primary btn-sm" 
                                onclick="TaxiService.selectTaxi('${taxi.id}', '${taxi.vehicle_type}')">
                            Select
                        </button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-center text-gray-400">No taxis available at the moment.</p>';
            }
        } catch (error) {
            console.error('Load Error:', error);
            container.innerHTML = '<p class="text-center text-red-500">Error loading taxis.</p>';
        }
    }

    // 2. Handle the "Select" button click
    static selectTaxi(id, name) {
        // Match IDs exactly with your HTML
        const taxiIdInput = document.getElementById('taxiId');
        const displaySpan = document.getElementById('selectedTaxiName'); 
        const banner = document.getElementById('selectionBanner');
        const confirmBtn = document.getElementById('confirmBtn');

        if (taxiIdInput) taxiIdInput.value = id;
        if (displaySpan) displaySpan.textContent = name;
        
        // Remove the 'hidden' class used in your Tailwind/CSS
        if (banner) banner.classList.remove('hidden');

        // Enable button and update text
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `<i class="fas fa-check-circle"></i> Confirm Booking: ${name}`;
        }
        
        // Visual feedback: scroll to form
        displaySpan.parentElement.parentElement.scrollIntoView({ behavior: 'smooth' });
    }

    // 3. Send Booking to Backend
    static async bookTaxi() {
        const taxiId = document.getElementById('taxiId').value;
        const pickupTime = document.getElementById('pickup_time').value;
        const pickup = document.getElementById('pickup').value;
        const dropoff = document.getElementById('dropoff').value;
        
        if (!taxiId || !pickupTime || !pickup || !dropoff) {
            alert('Please fill in all travel details');
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
                alert('Success! Your ride has been requested.');
                
                // Reset Form
                document.getElementById('selectionBanner').classList.add('hidden');
                document.getElementById('confirmBtn').disabled = true;
                document.getElementById('confirmBtn').innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
                document.getElementById('pickup').value = '';
                document.getElementById('dropoff').value = '';
                document.getElementById('pickup_time').value = '';
                
                // Refresh data
                this.loadTaxis();
                if (window.BookingService) BookingService.loadUserBookings();
            } else {
                alert(data.message || 'Booking failed');
            }
        } catch (error) {
            console.error('Booking Error:', error);
            alert('Server error. Please try again later.');
        }
    }
}

// Ensure the class is globally available for the 'onclick' attributes
window.TaxiService = TaxiService;

// CRITICAL: Make the class globally accessible so HTML onclick works
window.TaxiService = TaxiService;
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

// Service Navigation Functions
function showService(service) {
    // Update navbar active state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(`nav${service.charAt(0).toUpperCase() + service.slice(1)}`).classList.add('active');
    
    // Update service tabs
    document.querySelectorAll('.service-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.service-tab:nth-child(${service === 'taxi' ? 1 : service === 'hotel' ? 2 : 3})`).classList.add('active');
    
    // Show/hide service sections
    const services = ['taxi-services', 'hotel-discovery', 'restaurant-discovery'];
    services.forEach(s => {
        const element = document.getElementById(s);
        if (element) element.style.display = s === (service === 'taxi' ? 'taxi-services' : service === 'hotel' ? 'hotel-discovery' : 'restaurant-discovery') ? 'block' : 'none';
    });
    
    if (service === 'hotel') {
        showHotelDiscovery();
    } else if (service === 'restaurant') {
        showRestaurantDiscovery();
    } else {
        hideHotelDiscovery();
        hideRestaurantDiscovery();
        document.getElementById('hotel-booking-form').style.display = 'none';
        document.getElementById('res-booking-form').style.display = 'none';
    }
}

// Hotel Management Functions
function showHotelDiscovery() {
    document.getElementById('hotel-discovery').style.display = 'block';
    document.getElementById('navHotels').classList.add('active');
    
    // Load hotels if not already loaded
    if (!window.hotelsLoaded) {
        loadHotels();
    }
    
    // Smooth scroll to hotel section
    document.getElementById('hotel-discovery').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function hideHotelDiscovery() {
    document.getElementById('hotel-discovery').style.display = 'none';
    document.getElementById('navHotels').classList.remove('active');
    document.getElementById('hotel-booking-form').style.display = 'none';
}

function loadHotels() {
    const grid = document.getElementById('hotel-grid');
    grid.innerHTML = '<p class="text-center text-gray-400 col-span-3">Loading hotels...</p>';
    
    fetch('/api/hotels')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(hotels => {
            renderHotels(hotels);
            window.hotelsLoaded = true;
        })
        .catch(error => {
            console.error('Error loading hotels:', error);
            // Fallback to mock data
            const mockHotels = [
                { id: 1, name: 'Sheraton Addis', address: 'Addis Ababa', rating: 4.5, price: '$$$', image: '../images/hotel1.jpg' },
                { id: 2, name: 'Budget Inn', address: 'Addis Ababa', rating: 3.8, price: '$', image: '../images/hotel2.jpg' },
                { id: 3, name: 'Luxury Resort', address: 'Bahir Dar', rating: 4.8, price: '$$$', image: '../images/hotel3.jpg' },
            ];
            renderHotels(mockHotels);
            window.hotelsLoaded = true;
        });
}

function renderHotels(hotels) {
    const grid = document.getElementById('hotel-grid');
    grid.innerHTML = '';
    hotels.forEach(hotel => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${hotel.image}" alt="${hotel.name}" class="card-img">
            <div class="card-body">
                <h4 class="card-title">${hotel.name}</h4>
                <p class="card-text">${hotel.address} • ${hotel.rating} ⭐ • ${hotel.price}</p>
                <button class="btn btn-primary" onclick="selectHotel(${hotel.id}, '${hotel.name}', '${hotel.address}')">Book Now</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function searchHotels() {
    const query = document.getElementById('hotelSearch').value.toLowerCase();
    const cards = document.querySelectorAll('#hotel-grid .card');
    cards.forEach(card => {
        const name = card.querySelector('.card-title').textContent.toLowerCase();
        card.style.display = name.includes(query) ? 'block' : 'none';
    });
}

function filterHotels() {
    const priceRange = document.getElementById('hotelPriceRange').value;
    const rating = parseFloat(document.getElementById('hotelRating').value);
    const cards = document.querySelectorAll('#hotel-grid .card');
    cards.forEach(card => {
        const text = card.querySelector('.card-text').textContent;
        const cardPrice = text.split(' • ')[2];
        const cardRating = parseFloat(text.split(' • ')[1]);
        const priceMatch = !priceRange || cardPrice === priceRange;
        const ratingMatch = !rating || cardRating >= rating;
        card.style.display = priceMatch && ratingMatch ? 'block' : 'none';
    });
}

function loadMoreHotels() {
    // Implement pagination or load more logic
    alert('Loading more hotels...');
}

function selectHotel(id, name, address) {
    document.getElementById('selected-hotel-name').textContent = name;
    document.getElementById('selected-hotel-address').textContent = address;
    document.getElementById('ext-hotel-id').value = id;
    document.getElementById('hotel-booking-form').style.display = 'block';
    document.getElementById('hotel-booking-form').scrollIntoView({ behavior: 'smooth' });
    
    // Calculate and display price (mock - replace with API if needed)
    const nights = 1; // Calculate based on dates
    const pricePerNight = 100; // Mock price
    document.getElementById('hotel-night-price').textContent = `$${pricePerNight}`;
    document.getElementById('hotel-total-price').textContent = `$${pricePerNight * nights}`;
}

function submitHotelBooking() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const guests = document.getElementById('hotel-guests').value;
    const rooms = document.getElementById('hotel-rooms').value;
    const roomType = document.getElementById('room-type').value;
    const requests = document.getElementById('hotel-requests').value;
    
    if (!checkIn || !checkOut) {
        alert('Please select check-in and check-out dates.');
        return;
    }
    
    // Replace with actual API call to submit booking
    fetch('/api/hotel-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn, checkOut, guests, rooms, roomType, requests })
    })
    .then(response => response.json())
    .then(data => {
        alert(`Hotel booking confirmed from ${checkIn} to ${checkOut} for ${guests} guests.`);
        document.getElementById('hotel-booking-form').style.display = 'none';
        refreshAllBookings();
    })
    .catch(error => {
        console.error('Error submitting hotel booking:', error);
        alert('Failed to submit booking. Please try again.');
    });
}

function cancelHotelBooking() {
    document.getElementById('hotel-booking-form').style.display = 'none';
}

// Restaurant Management Functions
function showRestaurantDiscovery() {
    document.getElementById('restaurant-discovery').style.display = 'block';
    document.getElementById('navRestaurants').classList.add('active');
    
    // Load restaurants if not already loaded
    if (!window.restaurantsLoaded) {
        loadRestaurants();
    }
    
    // Smooth scroll to restaurant section
    document.getElementById('restaurant-discovery').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function hideRestaurantDiscovery() {
    document.getElementById('restaurant-discovery').style.display = 'none';
    document.getElementById('navRestaurants').classList.remove('active');
    document.getElementById('res-booking-form').style.display = 'none';
}

function loadRestaurants() {
    const grid = document.getElementById('restaurant-grid');
    grid.innerHTML = '<p class="text-center text-gray-400 col-span-3">Loading restaurants...</p>';
    
    fetch('/api/restaurants')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(restaurants => {
            renderRestaurants(restaurants);
            window.restaurantsLoaded = true;
        })
        .catch(error => {
            console.error('Error loading restaurants:', error);
            // Fallback to mock data
            const mockRestaurants = [
                { id: 1, name: 'Habesha 2000', cuisine: 'Ethiopian', rating: 4.5, price: '$$', image: '../images/restaurant1.jpg' },
                { id: 2, name: 'Mama\'s Kitchen', cuisine: 'International', rating: 4.2, price: '$', image: '../images/restaurant2.jpg' },
                { id: 3, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.0, price: '$$', image: '../images/restaurant3.jpg' },
            ];
            renderRestaurants(mockRestaurants);
            window.restaurantsLoaded = true;
        });
}

function renderRestaurants(restaurants) {
    const grid = document.getElementById('restaurant-grid');
    grid.innerHTML = '';
    restaurants.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${restaurant.image}" alt="${restaurant.name}" class="card-img">
            <div class="card-body">
                <h4 class="card-title">${restaurant.name}</h4>
                <p class="card-text">${restaurant.cuisine} • ${restaurant.rating} ⭐ • ${restaurant.price}</p>
                <button class="btn btn-primary" onclick="selectRestaurant(${restaurant.id}, '${restaurant.name}')">Book Table</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function searchRestaurants() {
    const query = document.getElementById('restaurantSearch').value.toLowerCase();
    const cards = document.querySelectorAll('#restaurant-grid .card');
    cards.forEach(card => {
        const name = card.querySelector('.card-title').textContent.toLowerCase();
        card.style.display = name.includes(query) ? 'block' : 'none';
    });
}

function filterRestaurants() {
    const cuisine = document.getElementById('restaurantCuisine').value;
    const cards = document.querySelectorAll('#restaurant-grid .card');
    cards.forEach(card => {
        const cardCuisine = card.querySelector('.card-text').textContent.split(' • ')[0];
        card.style.display = !cuisine || cardCuisine === cuisine ? 'block' : 'none';
    });
}

function loadMoreRestaurants() {
    // Implement pagination or load more logic
    alert('Loading more restaurants...');
}

function selectRestaurant(id, name) {
    document.getElementById('selected-res-name').textContent = name;
    document.getElementById('ext-res-id').value = id;
    document.getElementById('res-booking-form').style.display = 'block';
    document.getElementById('res-booking-form').scrollIntoView({ behavior: 'smooth' });
}

function submitRestaurantBooking() {
    const guestCount = document.getElementById('guest-count').value;
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const requests = document.getElementById('special-requests').value;
    
    if (!date || !time) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Replace with actual API call to submit booking
    fetch('/api/restaurant-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestCount, date, time, requests })
    })
    .then(response => response.json())
    .then(data => {
        alert(`Restaurant booking confirmed for ${guestCount} guests on ${date} at ${time}.`);
        document.getElementById('res-booking-form').style.display = 'none';
        refreshAllBookings();
    })
    .catch(error => {
        console.error('Error submitting restaurant booking:', error);
        alert('Failed to submit reservation. Please try again.');
    });
}

function cancelReservation() {
    document.getElementById('res-booking-form').style.display = 'none';
}

// Additional helper functions
function showBookingTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.booking-tab').forEach(tab => tab.style.display = 'none');
    
    document.querySelector(`.tab-btn:nth-child(${type === 'taxi' ? 1 : type === 'hotel' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${type}-bookings`).style.display = 'block';
}

function refreshAllBookings() {
    // Refresh taxi bookings
    BookingService.loadUserBookings();
    
    // Refresh hotel and restaurant bookings (mock - replace with API calls if available)
    document.getElementById('hotelBookingList').innerHTML = '<p class="text-center text-gray-400">No hotel bookings yet</p>';
    document.getElementById('restaurantBookingList').innerHTML = '<p class="text-center text-gray-400">No restaurant reservations yet</p>';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['res-date', 'check-in', 'check-out'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.min = today;
        }
    });
    
    // Set default check-in to tomorrow, check-out to day after
    const checkIn = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');
    if (checkIn && checkOut) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        checkIn.value = tomorrow.toISOString().split('T')[0];
        
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        checkOut.value = dayAfter.toISOString().split('T')[0];
    }
});