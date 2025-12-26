const API_BASE = "http://localhost/Tourism_management_system/Tourism-Management-System-Taxi-Service-Module/api";

const AdminDashboard = {
   async loadGlobalStats() {
    try {
        const [taxisRes, bookingsRes] = await Promise.all([
            fetch(`${API_BASE}/taxi/get_all_taxis.php`),
            fetch(`${API_BASE}/booking/all_bookings.php`)
        ]);

        const taxisData = await taxisRes.json();
        const bookingsData = await bookingsRes.json();

        const totalTaxis = taxisData.success ? taxisData.data.length : 0;
        const totalBookings = bookingsData.success ? bookingsData.data.length : 0;

        // Load users count
        let totalUsers = 0;
      try {
    const usersRes = await fetch(`${API_BASE}/user/all_users.php`);
    
    if (!usersRes.ok) {
        throw new Error(`HTTP error! status: ${usersRes.status}`);
    }

    const usersData = await usersRes.json();
    console.log('Users Data:', usersData); // Check the precise response structure

    totalUsers = usersData.success ? usersData.data.length : 0;
} catch (e) {
    console.error("Users endpoint error:", e); // Log the complete error message
    totalUsers = 0;
}

        
        const estimatedRevenue = totalBookings * 20;

        // Update UI
        document.getElementById('totalTaxis').textContent = totalTaxis;
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalRevenue').textContent = `$${estimatedRevenue.toLocaleString()}`;
    } catch (error) {
        console.error('Stats load error:', error);
    }
},
    // Load All Taxis (Global View)
    async loadFleetOverview() {
    const tbody = document.getElementById('adminFleetTableBody');
    if (!tbody) return;

    try {
        // Use your existing global endpoint
        const response = await fetch(`${API_BASE}/taxi/get_all_taxis.php`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = result.data.map(taxi => `
                <tr>
                    <td><strong>${taxi.vehicle_type}</strong></td>
                    <td>${taxi.plate_number}</td>
                    <td>${taxi.driver_name}</td>
                    <td>$${parseFloat(taxi.price_per_km).toFixed(2)}</td>
                    <td>
                        <span class="badge ${taxi.is_available == 1 ? 'bg-success' : 'bg-danger'}">
                            ${taxi.is_available == 1 ? 'Available' : 'Offline'}
                        </span>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No taxis registered</td></tr>';
        }
    } catch (error) {
        console.error('Fleet load error:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load fleet</td></tr>';
    }
},

    // Load All Bookings (Global View)
    async loadAllBookings() {
    const tbody = document.getElementById('adminBookingList');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE}/booking/all_bookings.php`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = result.data.map(booking => `
                <tr>
                    <td>#${booking.id}</td>
                    <td>${booking.customer_email}</td>
                    <td>${booking.vehicle_type}</td>
                    <td>${booking.pickup_location} → ${booking.dropoff_location}</td>
                    <td>${new Date(booking.pickup_time).toLocaleString()}</td>
                    <td><span class="badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found</td></tr>';
        }
    } catch (error) {
        console.error('Bookings load error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load bookings</td></tr>';
    }
},

    async logout() {
        localStorage.removeItem('currentUser');
        try {
            await fetch(`${API_BASE}/auth/logout.php`);
        } catch (e) {}
        window.location.href = 'login.html';
    }
};

window.AdminDashboard = AdminDashboard;