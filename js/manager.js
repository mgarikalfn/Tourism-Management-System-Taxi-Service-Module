const API_BASE = "http://localhost/taxi_service/api";

class ManagerDashboard {
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
                tbody.innerHTML = data.data.map(taxi => `
                    <tr>
                        <td><strong>${taxi.vehicle_type}</strong></td>
                        <td>${taxi.plate_number}</td>
                        <td>${taxi.driver_name}</td>
                        <td>$${taxi.price_per_km}</td>
                        <td>
                            <span class="badge ${taxi.is_available ? 'bg-success' : 'bg-danger'}">
                                ${taxi.is_available ? 'Available' : 'NotAvailable'}
                            </span>
                        </td>
                        <td>
                            <button class="btn-sm" onclick="ManagerDashboard.openEditTaxiModal(${taxi.id})">Edit</button>
                            <button class="btn-sm btn-danger" onclick="ManagerDashboard.deleteTaxi(${taxi.id})">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Fleet load failed:', error);
        }
    }

    static async createTaxi() {
        const taxi = {
            vehicle_type: document.getElementById('taxi-type').value,
            plate_number: document.getElementById('taxi-plate').value,
            driver_name: document.getElementById('taxi-driver').value,
            price_per_km: parseFloat(document.getElementById('taxi-price').value)
        };

        
        
        if(!taxi.vehicle_type || !taxi.plate_number || !taxi.driver_name){
            alert("All fields are required");
            return;
        }

        
        try {
            const response = await fetch(`${API_BASE}/taxi/create_taxi.php`, {
                method:'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taxi)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Create failed');
            } 
            alert("Taxi created successfully");
            closeTaxiModal();
            ManagerDashboard.loadFleet();
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    static async updateTaxi() {
    const id = document.getElementById('edit-taxi-id').value;

    const taxi = {
        id: parseInt(id),
        vehicle_type: document.getElementById('taxi-type').value.trim(),
        plate_number: document.getElementById('taxi-plate').value.trim(),
        driver_name: document.getElementById('taxi-driver').value.trim(),
        price_per_km: parseFloat(document.getElementById('taxi-price').value)
    };

    // ✅ Proper validation
    if (
        !taxi.id ||
        !taxi.vehicle_type ||
        !taxi.plate_number ||
        !taxi.driver_name ||
        isNaN(taxi.price_per_km)
    ) {
        alert("All fields are required");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/taxi/update_taxi.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taxi)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Update failed");
        }

        alert("Taxi updated successfully");

        closeTaxiModal();
        this.loadFleet();

    } catch (error) {
        console.error("Update error:", error);
        alert("Failed to update taxi");
    }
}


    static async deleteTaxi(id) {
        if (!confirm("Delete this taxi? If there are active bookings, it will be marked 'Offline' instead.")) return;
        try {
            const response = await fetch(`${API_BASE}/taxi/delete_taxi.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                this.loadFleet();
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    }
static saveTaxi() {
    const id = document.getElementById('edit-taxi-id').value;

    if (id) {
        this.updateTaxi();
    } else {
        this.createTaxi();
    }
}

   
}

function openCreateTaxiModal() {
    document.getElementById('modal-title').textContent = "Add Taxi";
    document.getElementById('edit-taxi-id').value = "";
    document.getElementById('taxi-type').value = "";
    document.getElementById('taxi-plate').value = "";
    document.getElementById('taxi-driver').value = "";
    document.getElementById('taxi-price').value = "";

    document.getElementById('taxi-modal').style.display = "flex";
}

function openEditTaxiModal(taxiId) {
    // Find the taxi from loaded fleet
    const taxi = this.fleet.find(t => t.id === taxiId);
    if (!taxi) return alert("Taxi not found");

    // Populate edit modal
    document.getElementById('edit-taxi-id').value = taxi.id;
    document.getElementById('edit-taxi-type').value = taxi.vehicle_type;
    document.getElementById('edit-taxi-plate').value = taxi.plate_number;
    document.getElementById('edit-taxi-driver').value = taxi.driver_name;
    document.getElementById('edit-taxi-price').value = taxi.price_per_km;

    // Open edit modal
    document.getElementById('edit-taxi-modal').classList.remove('hidden');
}


function submitTaxiForm() {
    const id = document.getElementById('edit-taxi-id').value;

    if (id) {
        TaxiUpdateService.updateTaxi();
    } else {
        TaxiCreateService.createTaxi();
    }
}

function openTaxiModal() {
    document.getElementById('taxi-modal').style.display = 'flex';
}

function closeTaxiModal() {
    document.getElementById('taxi-modal').style.display = 'none';

    // reset form
    document.getElementById('edit-taxi-id').value = '';
    document.getElementById('taxi-type').value = '';
    document.getElementById('taxi-plate').value = '';
    document.getElementById('taxi-driver').value = '';
    document.getElementById('taxi-price').value = '';
}


// Make globally accessible
window.ManagerDashboard = ManagerDashboard;