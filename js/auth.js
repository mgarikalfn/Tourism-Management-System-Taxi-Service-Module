function updateNavbar() {
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
}