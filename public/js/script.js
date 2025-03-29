let map = L.map('map').setView([22.3511, 78.6677], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let ngos = [];
let markers = [];
const DEFAULT_ZOOM = 5;
const NEARBY_RADIUS = 100;
const MAX_NEARBY_RESULTS = 5;
let userLocationMarker = null;

fetch("ngos.json")
    .then(response => response.json())
    .then(data => {
        ngos = data;
        displayNGOs(ngos);
    })
    .catch(error => {
        console.error("Error loading NGO data:", error);
        alert("Failed to load NGO data. Please check the file path.");
    });

function displayNGOs(ngoList) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    ngoList.forEach(ngo => {
        let marker = L.marker([ngo.lat, ngo.lon])
            .addTo(map)
            .bindPopup(`<b>${ngo.name}</b><br>${ngo.focus}<br>${ngo.website ? `<a href="${ngo.website}" target="_blank">Visit Website</a>` : "No website available"}`)
            .on('click', () => showNGODetails(ngo));
        markers.push(marker);
        ngo.marker = marker;
    });

    if (ngoList.length > 0) {
        let bounds = L.latLngBounds(ngoList.map(ngo => [ngo.lat, ngo.lon]));
        map.fitBounds(bounds);
    } else {
        map.setView([22.3511, 78.6677], DEFAULT_ZOOM);
    }
}

function searchNGOs() {
    let searchQuery = document.getElementById("search-box").value.trim().toLowerCase();
    let selectedFilter = document.getElementById("filter").value;

    let foundNGOs = ngos.filter(ngo => {
        let ngoLocation = ngo.location.trim().toLowerCase();
        return ngoLocation.includes(searchQuery) &&
            (selectedFilter === "" || ngo.focus.includes(selectedFilter));
    });

    if (foundNGOs.length === 0) {
        alert("No NGOs found in the specified city.");
    }

    displayNGOs(foundNGOs);
    updateSearchResults(foundNGOs);
}

function updateSearchResults(ngoList) {
    let resultDiv = document.getElementById("search-results");
    resultDiv.innerHTML = "";

    if (ngoList.length === 0) {
        resultDiv.innerHTML = "<p>No NGOs found.</p>";
        return;
    }

    ngoList.forEach(ngo => {
        let ngoEntry = document.createElement("div");
        ngoEntry.className = "ngo-item";
        ngoEntry.innerHTML = `<strong>${ngo.name}</strong><br>${ngo.focus}<br>📍 ${ngo.location}`;
        ngoEntry.onclick = () => {
            map.setView([ngo.lat, ngo.lon], 8);
            ngo.marker.openPopup();
            showNGODetails(ngo);
        };
        resultDiv.appendChild(ngoEntry);
    });
}

function resetSearch() {
    document.getElementById("search-box").value = "";
    document.getElementById("filter").value = "";
    map.setView([22.3511, 78.6677], DEFAULT_ZOOM);
    displayNGOs(ngos);
    document.getElementById("search-results").innerHTML = "";
    hideNGODetails();
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
    }
}

function showNGODetails(ngo) {
    let detailsDiv = document.getElementById("ngo-details");
    detailsDiv.innerHTML = `
        <h2>${ngo.name}</h2>
        <p><strong>Focus:</strong> ${ngo.focus}</p>
        <p><strong>Location:</strong> ${ngo.location}</p>
        <p><strong>Website:</strong> ${ngo.website ? `<a href="${ngo.website}" target="_blank">${ngo.website}</a>` : "N/A"}</p>
        <p><strong>Phone:</strong> ${'1800 180 111' || 'N/A'}</p>
        <p><strong>Email:</strong> ${'wehelp@save.com' || 'N/A'}</p>
    `;
    detailsDiv.classList.remove('hidden');
}

function hideNGODetails() {
    document.getElementById("ngo-details").classList.add('hidden');
}





const tab_pane = document.getElementById('crud-modal'); 
const success_tab = document.getElementById('successModal');
const joinus = document.getElementsByClassName('join-us');
const form = document.querySelector("#crud-modal form");
const submitButton = form.querySelector("button[type='submit']");

Array.from(joinus).forEach(anchor => {
    anchor.addEventListener('click', function(event) {
        event.preventDefault();
        tab_pane.classList.remove('hidden'); 
    });
});

form.addEventListener("submit", function(event) {
    event.preventDefault();

    // Disable button and show processing text
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loader"></span> Processing...';

    setTimeout(() => {
        // Show success modal after delay
        success_tab.classList.remove('hidden');
        tab_pane.classList.add('hidden');
        
        // Reset button text and enable it again
        submitButton.innerHTML = 'Submit';
        submitButton.disabled = false;
        
        // Optionally, clear form fields
        form.reset();
    }, 1500); // 1.5 seconds delay
});

function tabpopDown() {
    tab_pane.classList.add('hidden');
    success_tab.classList.add('hidden');
}