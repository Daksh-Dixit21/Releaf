    let users = <%- JSON.stringify(users) %>;

    document.addEventListener("DOMContentLoaded", () => {
        applyFilters();

        document.getElementById("help-btn").addEventListener("click", function (e) {
            e.preventDefault();

            const formPopup = document.createElement("div");
            formPopup.className = "popup-overlay";
            formPopup.innerHTML = `
                <div class="popup-content">
                    <h2>SOS Mail Form</h2>
                    <form id="sos-form">
                        <label for="name">Your Name</label>
                        <input type="text" id="name" required>

                        <label for="contact">Contact Number</label>
                        <input type="text" id="contact" required>

                        <label for="message">Your Message</label>
                        <textarea id="message" rows="4" required></textarea>

                        <button type="submit" class="submit-btn">Send SOS Mail</button>
                        <button type="button" class="cancel-btn">Cancel</button>
                    </form>
                </div>
            `;

            document.body.appendChild(formPopup);

            document.querySelector(".cancel-btn").addEventListener("click", () => {
                document.body.removeChild(formPopup);
            });

            document.getElementById("sos-form").addEventListener("submit", async function (e) {
                e.preventDefault();

                // Extract form data
                const name = document.getElementById("name").value.trim();
                const contact = document.getElementById("contact").value.trim();
                const message = document.getElementById("message").value.trim();

                // Remove the form popup
                document.body.removeChild(formPopup);

                // Show loading screen
                const loadingScreen = document.createElement("div");
                loadingScreen.className = "loading-screen";
                loadingScreen.innerHTML = `
                    <div class="loader"></div>
                    <p>Sending SOS Mail...</p>
                `;
                document.body.appendChild(loadingScreen);

                // Send request to backend
                try {
                    let response = await fetch("/sos", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ name, contact, message }),
                    });

                    if (response.ok) {
                        document.body.removeChild(loadingScreen);

                        const confirmationPopup = document.createElement("div");
                        confirmationPopup.className = "popup-overlay";
                        confirmationPopup.innerHTML = `
                            <div class="popup-content">
                                <h2>✅ Mail Sent Successfully!</h2>
                                <p>Your SOS request has been sent. We hope help reaches you soon.</p>
                                <button class="close-btn">Close</button>
                            </div>
                        `;

                        document.body.appendChild(confirmationPopup);
                        document.querySelector(".close-btn").addEventListener("click", () => {
                            document.body.removeChild(confirmationPopup);
                        });
                    } else {
                        throw new Error("Failed to send SOS request.");
                    }
                } catch (error) {
                    console.error(error);
                    document.body.removeChild(loadingScreen);
                    alert("⚠️ Error: Unable to send SOS request. Please try again.");
                }
            });
        });
    });

    let currentPage = 1;
    const resultsPerPage = 10;

    function displayUsers(filteredUsers) {
        const userList = document.getElementById("user-list");
        userList.innerHTML = "";

        const paginationDiv = document.querySelector(".pagination");
        paginationDiv.innerHTML = "";

        const totalPages = Math.ceil(filteredUsers.length / resultsPerPage);
        const start = (currentPage - 1) * resultsPerPage;
        const end = start + resultsPerPage;
        const paginatedUsers = filteredUsers.slice(start, end);

        if (filteredUsers.length === 0) {
            userList.innerHTML = `<p>No results found.</p>`;
            return;
        }

        paginatedUsers.forEach(user => {
            const userCard = document.createElement("div");
            userCard.className = "user-card";
            userCard.innerHTML = `
                <div>
                    <h4>${user.name}</h4>
                    <p>City: ${user.city}</p>
                    <p>Type: ${user.type ? user.type.toUpperCase() : "Unknown Type"}</p>
                    <p>Contact: ${user.email || user.phone || "No contact info"}</p>
                </div>
                <button class="share-btn" onclick="shareProfile('${user.name}')">Share</button>
            `;
            userList.appendChild(userCard);
        });

        for (let i = 1; i <= totalPages; i++) {
            let btn = document.createElement("button");
            btn.innerText = i;
            btn.className = i === currentPage ? "selected" : "";
            btn.onclick = () => { currentPage = i; applyFilters(); };
            paginationDiv.appendChild(btn);
        }
    }

    function applyFilters() {
        const cityFilter = document.getElementById("city-search").value.trim().toLowerCase();
        const typeFilter = document.getElementById("type-filter").value.toLowerCase();

        let filteredUsers = users.filter(user =>
            (cityFilter === "" || user.city.toLowerCase().includes(cityFilter)) &&
            (typeFilter === "all" || (user.type && user.type.toLowerCase() === typeFilter))
        );

        displayUsers(filteredUsers);
    }

    function shareProfile(userName) {
        const user = users.find(u => u.name === userName);
        let contactInfo = user ? (user.phone || user.email || "No contact info available") : "User not found.";

        navigator.clipboard.writeText(contactInfo)
            .then(() => alert(`Copied: ${contactInfo}`))
            .catch(() => alert("Failed to copy contact info."));
    }

    document.querySelectorAll("header input, header select").forEach(input =>
        input.addEventListener("input", applyFilters)
    );