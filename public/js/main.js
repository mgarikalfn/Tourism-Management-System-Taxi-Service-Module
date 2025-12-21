const API = "http://localhost/taxi_service/api";

// 1. Authentication
function login() {
    const emailVal = document.getElementById('email').value;
    const passVal = document.getElementById('password').value;

    fetch(`${API}/auth/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passVal })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('loginMsg').innerText = data.message;
        if(data.success) {
            document.getElementById('userEmail').innerText = "Logged in as: " + emailVal;
            document.getElementById('loginCard').style.display = 'none';
            loadBookings(); // Load user history on login
        }
    });
}


// 4. View Booking History
function loadBookings() {
    fetch(`${API}/booking/my_bookings.php`)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('bookingList');
        list.innerHTML = "";
        if(!data.data || data.data.length === 0) {
            list.innerHTML = "<p>No bookings found.</p>";
            return;
        }
        data.data.forEach(b => {
            list.innerHTML += `
                <div class="item-card">
                    <span>🚖 ${b.vehicle_type} | ${b.pickup_location} ➔ ${b.dropoff_location}</span>
                    <span class="badge" style="background:#95a5a6">${b.status}</span>
                </div>`;
        });
    });
}

// 5. External Service Consumption Placeholder
function consumeExternal(type) {
    alert(`Connecting to Group ${type === 'Hotel' ? '2' : '3'} Service... This demonstrates the "Service Consumer" requirement.`);
    // Future: fetch('http://other-group-ip/api/...')
}

function logout() {
    fetch(`${API}/auth/logout.php`).then(() => window.location.reload());
}

// Function called when user clicks "Book Now" on a taxi card
function selectTaxi(id, name) {
    // 1. Store the ID in the hidden input
    document.getElementById('taxiId').value = id;
    
    // 2. Update the UI to show what was selected
    const banner = document.getElementById('selectionBanner');
    const displayName = document.getElementById('displayTaxiName');
    const confirmBtn = document.getElementById('confirmBtn');
    
    banner.style.display = 'block';
    displayName.innerText = name;
    
    // 3. Enable the button
    confirmBtn.disabled = false;
    confirmBtn.innerText = "Confirm Booking for " + name;

    // 4. Smooth scroll to form
    document.getElementById('booking-section').scrollIntoView({behavior: 'smooth'});
}

// Updated loadTaxis to use the select button
function loadTaxis() {
    fetch(`${API}/taxi/list_taxis.php`)
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('taxiList');
        container.innerHTML = "";
        data.data.forEach(t => {
            container.innerHTML += `
                <div class="item-card">
                    <div>
                        <strong>${t.vehicle_type}</strong><br>
                        <small>Driver: ${t.driver_name} | $${t.price_per_km}/km</small>
                    </div>
                    <button class="btn-select" onclick="selectTaxi(${t.id}, '${t.vehicle_type}')">
                        Select
                    </button>
                </div>`;
        });
    });
}

function bookTaxi() {
    const payload = {
        taxi_id: document.getElementById('taxiId').value,
        pickup_location: document.getElementById('pickup').value,
        dropoff_location: document.getElementById('dropoff').value,
        pickup_time: document.getElementById('pickup_time').value // The date picker value
    };

    if(!payload.pickup_time) {
        alert("Please select a date and time");
        return;
    }

    fetch(`${API}/booking/create_booking.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        const msg = document.getElementById('bookMsg');
        msg.innerText = data.message;
        if(data.success) {
            msg.style.color = "green";
            loadBookings(); // Refresh history
            // Reset form
            document.getElementById('selectionBanner').style.display = 'none';
            document.getElementById('confirmBtn').disabled = true;
        } else {
            msg.style.color = "red";
        }
    });
}