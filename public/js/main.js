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

// 2. Load Internal Taxis (Provider functionality)
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
                        <strong>${t.vehicle_type}</strong> (ID: ${t.id})<br>
                        <small>Driver: ${t.driver_name}</small>
                    </div>
                    <div><span class="badge">$${t.price_per_km}/km</span></div>
                </div>`;
        });
    });
}

// 3. Create Booking
function bookTaxi() {
    const payload = {
        taxi_id: document.getElementById('taxiId').value,
        pickup_location: document.getElementById('pickup').value,
        dropoff_location: document.getElementById('dropoff').value
    };

    fetch(`${API}/booking/create_booking.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        const msg = document.getElementById('bookMsg');
        msg.innerText = data.message;
        msg.style.color = data.success ? "green" : "red";
        if(data.success) loadBookings();
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