// Function to fetch locations from the API
async function fetchLocations() {
    try {
        const response = await fetch('http://localhost:8080/api/v1/branches');
        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Error fetching locations');
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Function to create location cards
function createLocationCards(locations) {
    const locationCardsContainer = document.getElementById('locationCards');
    locationCardsContainer.innerHTML = ''; // Clear existing cards
    locations.forEach(location => {
        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <div class="card h-100 location-card" data-location-id="${location.id}">
                <img src="${location.image}" class="card-img-top" alt="${location.name}">
                <div class="card-body">
                    <h5 class="card-title">${location.name}</h5>
                    <p class="card-text">${location.address}</p>
                    <p class="card-text"><small class="text-muted">Capacidad: ${location.capacity || 'No especificada'} personas</small></p>
                </div>
            </div>
        `;
        locationCardsContainer.appendChild(card);
    });
}

// Function to initialize date and time pickers
function initializePickers() {
    flatpickr("#reservationDate", {
        minDate: "today",
        dateFormat: "Y-m-d"
    });

    $('#reservationTime').timepicker({
        'scrollDefault': 'now',
        'step': 30
    });
}

// Function to simulate available hours
function getAvailableHours() {
    // This is a placeholder. In a real scenario, you'd fetch this from your backend
    const hours = [];
    for (let i = 11; i <= 21; i++) {
        hours.push(i + ':00');
        if (i !== 21) hours.push(i + ':30');
    }
    return hours;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    const locations = await fetchLocations();
    createLocationCards(locations);
    initializePickers();
    
    document.getElementById('locationCards').addEventListener('click', (e) => {
        const card = e.target.closest('.location-card');
        if (card) {
            const locationId = card.getAttribute('data-location-id');
            const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
            modal.show();
            // Here you can use locationId to fetch specific data for the selected location if needed
        }
    });

    document.getElementById('confirmReservation').addEventListener('click', (e) => {
        e.preventDefault();
        // Here you would typically send the reservation data to your backend
        alert('Reserva enviada. En breve recibirás una confirmación.');
        bootstrap.Modal.getInstance(document.getElementById('reservationModal')).hide();
    });

    // Set available hours when date is selected
    document.getElementById('reservationDate').addEventListener('change', () => {
        const availableHours = getAvailableHours();
        $('#reservationTime').timepicker('option', 'disableTimeRanges', []);
        $('#reservationTime').timepicker('option', 'allowTimes', availableHours);
    });
});