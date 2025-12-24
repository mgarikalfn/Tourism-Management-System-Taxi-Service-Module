const API_BASE = "http://localhost/taxi_service/api";

class ManagerDashboard {
    static fleet = [];

    // ==========================================
    // BOOKING MANAGEMENT
    // ==========================================
    static async loadAllBookings() {
        try {
            const response = await fetch(`${API_BASE}/booking/all_manager_booking.php`);
            const data = await response.json();
            const container = document.getElementById('managerBookingList');
            if (!container) return;
            
            if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(booking => `
                    <tr>
                        <td>#${booking.id}</td>
                        <td>${booking.customer_email}</td>
                        <td>${booking.vehicle_type}</td>
                        <td>${booking.pickup_location} → ${booking.dropoff_location}</td>
                        <td>${new Date(booking.pickup_time).toLocaleString()}</td>
                        <td><span class="badge status-${booking.status.toLowerCase()}">${booking.status}</span></td>
                        <td>
                            <div class="flex-btn-group">
                                ${booking.status === 'Pending' ? 
                                    `<button class="btn btn-success btn-sm" onclick="ManagerDashboard.updateStatus(${booking.id}, 'Confirmed')">Confirm</button>` : ''}
                                ${!['Completed', 'Cancelled'].includes(booking.status) ? 
                                    `<button class="btn btn-danger btn-sm" onclick="ManagerDashboard.updateStatus(${booking.id}, 'Cancelled')">Cancel</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                container.innerHTML = `<tr><td colspan="7" class="text-center">No bookings found</td></tr>`;
            }
        } catch (error) {
            console.error('Booking load failed:', error);
        }
    }

    static async updateStatus(bookingId, status) {
        if (!confirm(`Mark booking #${bookingId} as ${status}?`)) return;
        try {
            const response = await fetch(`${API_BASE}/booking/update_booking_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId, status: status })
            });
            const data = await response.json();
            if (data.success) {
                alert(`Status updated to ${status}`);
                this.loadAllBookings();
            }
        } catch (error) {
            console.error('Update error:', error);
        }
    }

    // ==========================================
    // FLEET (TAXI) MANAGEMENT
    // ==========================================
    static async loadFleet() {
        const tbody = document.getElementById('fleetTableBody');
        if (!tbody) return;

        try {
            const response = await fetch(`${API_BASE}/taxi/get_manager_taxis.php`);
            const data = await response.json();
            
            if (data.success) {
                this.fleet = data.data; // Crucial for Edit functionality
                tbody.innerHTML = data.data.map(taxi => `
                    <tr>
                        <td><strong>${taxi.vehicle_type}</strong></td>
                        <td>${taxi.plate_number}</td>
                        <td>${taxi.driver_name}</td>
                        <td>$${taxi.price_per_km}</td>
                        <td>
                            <span class="badge ${taxi.is_available ? 'bg-success' : 'bg-danger'}">
                                ${taxi.is_available ? 'Available' : 'Offline'}
                            </span>
                        </td>
                        <td>
                            <button class="btn-sm" onclick="ManagerDashboard.openEditTaxiModal(${taxi.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-sm btn-danger" onclick="ManagerDashboard.deleteTaxi(${taxi.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Fleet load failed:', error);
        }
    }

    // MODAL CONTROL
    static openAddTaxiModal() {
        this.resetModal();
        document.getElementById('modal-title').innerText = "Add New Taxi";
        this.toggleModal(true);
    }

    static openEditTaxiModal(taxiId) {
        const taxi = this.fleet.find(t => t.id == taxiId);
        if (!taxi) return alert('Taxi details not found. Try refreshing.');

        document.getElementById('edit-taxi-id').value = taxi.id;
        document.getElementById('taxi-type').value = taxi.vehicle_type;
        document.getElementById('taxi-plate').value = taxi.plate_number;
        document.getElementById('taxi-driver').value = taxi.driver_name;
        document.getElementById('taxi-price').value = taxi.price_per_km;
        
        document.getElementById('taxi-availability').value = taxi.is_available ? 1 : 0;
        document.getElementById('modal-title').innerText = "Edit Taxi Info";
        this.toggleModal(true);
    }

    static toggleModal(show) {
        const modal = document.getElementById('taxi-modal');
        if (show) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        } else {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    static resetModal() {
        document.getElementById('edit-taxi-id').value = '';
        document.getElementById('taxi-type').value = '';
        document.getElementById('taxi-plate').value = '';
        document.getElementById('taxi-driver').value = '';
        document.getElementById('taxi-price').value = '';
    }

    static async saveTaxi() {
        const id = document.getElementById('edit-taxi-id').value;
        const taxiData = {
            id: id ? parseInt(id) : null,
            vehicle_type: document.getElementById('taxi-type').value,
            plate_number: document.getElementById('taxi-plate').value,
            driver_name: document.getElementById('taxi-driver').value,
            price_per_km: parseFloat(document.getElementById('taxi-price').value),
            is_available:parseInt(document.getElementById('taxi-availability').value)
        };

        const endpoint = id ? 'update_taxi.php' : 'create_taxi.php';

        try {
            const response = await fetch(`${API_BASE}/taxi/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taxiData)
            });
            const data = await response.json();
            if (data.success) {
                alert(id ? "Updated successfully" : "Created successfully");
                this.toggleModal(false);
                this.loadFleet();
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err); }
    }

    static async deleteTaxi(id) {
        if (!confirm("Delete this vehicle?")) return;
        try {
            const response = await fetch(`${API_BASE}/taxi/delete_taxi.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await response.json();
            alert(data.message); // Display the message from PHP for both success and failure
            if (data.success) {
                this.loadFleet(); // Reload only on success
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting the taxi.');
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
}

// Remove or update the global openTaxiModal if not needed elsewhere
// If keeping, ensure it resets fields:
function openTaxiModal() {
    ManagerDashboard.resetModal(); // Add this to reset fields
    document.getElementById('edit-taxi-id').value = '';
    document.getElementById('modal-title').innerText = "Add New Taxi";
    document.getElementById('taxi-modal').style.display = 'flex';
}

window.ManagerDashboard = ManagerDashboard;