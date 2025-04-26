// Simulated database
let reservations = [
    { name: "Juan Pérez", email: "juan@example.com", phone: "1234567890", date: "2024-03-15", time: "19:00", guests: 4 },
    { name: "María García", email: "maria@example.com", phone: "0987654321", date: "2024-03-16", time: "20:00", guests: 2 },
];

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: reservations.map(reservation => ({
            title: `Reserva: ${reservation.guests} personas`,
            start: `${reservation.date}T${reservation.time}`,
        })),
    });
    calendar.render();
});

// Initialize map
var map = L.map('map').setView([10.3932, -75.4832], 13); // Coordinates for Cartagena, Colombia
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.marker([10.3932, -75.4832]).addTo(map)
    .bindPopup('Sabores del Caribe<br>¡Te esperamos!')
    .openPopup();

// Handle form submission
document.getElementById('reservationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newReservation = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        guests: document.getElementById('guests').value
    };

    reservations.push(newReservation);
    updateReservationsList();
    updateCalendar();
    this.reset();
    alert('¡Reserva realizada con éxito!');
});

// Update reservations list
function updateReservationsList() {
    const list = document.getElementById('reservationsList');
    list.innerHTML = '';
    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation.name}</td>
            <td>${reservation.date}</td>
            <td>${reservation.time}</td>
            <td>${reservation.guests}</td>
        `;
        list.appendChild(row);
    });
}

// Update calendar
function updateCalendar() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: reservations.map(reservation => ({
            title: `Reserva: ${reservation.guests} personas`,
            start: `${reservation.date}T${reservation.time}`,
        })),
    });
    calendar.render();
}

// Initial update of reservations list
updateReservationsList();