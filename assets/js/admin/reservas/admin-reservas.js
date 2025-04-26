let branchesGlobal = [];
let selectedBranchId = null;
let existingDates = [];
let selectedDates = [];
let branchCalendar = null; // Agregar referencia global al calendario

document.addEventListener("DOMContentLoaded", () => {
    loadBranches();
    document.getElementById("searchInput").addEventListener("input", filterBranches);
    $('#branchDetailsModal').on('shown.bs.modal', function () {
        if (branchCalendar) {
            setTimeout(() => {
                branchCalendar.updateSize();
                branchCalendar.render(); // Forzar redibujado
            }, 100);
        }
    });

    // Agregar eventos a las tarjetas de filtro
    document.querySelectorAll('.card-clickeable').forEach(card => {
        card.addEventListener('click', () => {
            const cardId = card.id;

            let filteredBranches;
            if (cardId === 'cardTodos') {
                filteredBranches = branchesGlobal;
            } else if (cardId === 'cardCapacidadAlta') {
                filteredBranches = branchesGlobal.filter(branch => branch.capacity > 100);
            } else if (cardId === 'cardCapacidadMedia') {
                filteredBranches = branchesGlobal.filter(branch => branch.capacity <= 100 && branch.capacity > 50);
            } else if (cardId === 'cardCapacidadBaja') {
                filteredBranches = branchesGlobal.filter(branch => branch.capacity <= 50);
            } else if (cardId === 'cardRecientes') {
                filteredBranches = branchesGlobal.filter(branch => new Date(branch.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            }

            displayBranchCards(filteredBranches);
        });
    });
});

async function loadBranches() {
    const token = localStorage.getItem('token');
    if (!token) {
        handleError('No se encontró el token de autorización.');
        return;
    }
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/branches`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            branchesGlobal = data.data;
            displayBranchCards(branchesGlobal);
            conteoItemsTarjetas();
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cargar las sedes:', error);
        handleError('Error al cargar las sedes. Por favor, intente nuevamente.');
    }
}

function displayBranchCards(branches) {
    const container = document.getElementById("branchCardsContainer");
    container.innerHTML = '';
    branches.forEach(branch => {
        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <div class="card h-100 border-0 shadow" data-branch-id="${branch.id}">
                <div class="card-body">
                    <h5 class="card-title">${branch.name}</h5>
                    <p class="card-text">${branch.address}</p>
                    <p class="card-text">Capacidad: ${branch.capacity}</p>
                </div>
            </div>
        `;
        card.addEventListener('click', () => showBranchDetails(branch));
        container.appendChild(card);
    });
}

function filterBranches() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const filteredBranches = branchesGlobal.filter(branch => {
        return branch.name.toLowerCase().includes(searchTerm) ||
            branch.address.toLowerCase().includes(searchTerm) ||
            branch.description.toLowerCase().includes(searchTerm);
    });
    displayBranchCards(filteredBranches);
}

function showBranchDetails(branch) {
    selectedBranchId = branch.id;
    document.getElementById("branchModalLabel").innerText = branch.name;
    $('#branchDetailsModal').modal('show');
    loadBranchCalendar(branch.id);
}

async function loadBranchCalendar(branchId) {
    const token = localStorage.getItem('token');
    if (!token) {
        handleError('No se encontró el token de autorización.');
        return;
    }
    try {
        const response = await fetch(`https://grupouno.click/api/v1/schedules/branch/${branchId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            existingDates = data.data.map(schedule => schedule.date);
            const events = data.data.map(schedule => {
                // Contar el número total de reservas para este horario
                let reservationCount = 0;
                for (let hour = 12; hour <= 22; hour++) {
                    if (schedule[`hour${hour}Reservation`]) {
                        reservationCount++;
                    }
                }
                return {
                    title: `R: ${reservationCount}`,
                    start: schedule.date,
                    allDay: true,
                    backgroundColor: reservationCount > 0 ? 'lightgreen' : '#c8e6c9',
                    borderColor: reservationCount > 0 ? 'lightgreen' : '#c8e6c9'
                };
            });
            renderBranchCalendar(events);
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cargar los horarios:', error);
        handleError('Error al cargar los horarios. Por favor, intente nuevamente.');
    }
}

function renderBranchCalendar(events) {
    const calendarEl = document.getElementById('branchCalendar');
    branchCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: events,
        selectable: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        select: async function(info) {
            const startDate = info.startStr;
            const endDate = new Date(info.endStr);
            endDate.setDate(endDate.getDate() - 1); // Ajustar la fecha final para no incluir el día siguiente
            const dates = getDatesInRange(startDate, endDate.toISOString().split('T')[0]);
            const newDates = dates.filter(date => !existingDates.includes(date));
            
            // Mostrar confirmación para cualquier nueva fecha seleccionada
            if (newDates.length > 0) {
                const result = await Swal.fire({
                    title: 'Confirmar selección',
                    text: `¿Deseas habilitar las siguientes fechas: ${newDates.join(', ')}?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, habilitar',
                    cancelButtonText: 'Cancelar'
                });
                if (result.isConfirmed) {
                    await saveSchedules(newDates);
                }
            }
            
            info.view.calendar.unselect(); // Limpiar selección
        },
        dateClick: async function(info) {
            const clickedDate = info.dateStr;
            
            // Si la fecha ya tiene horario, mostrar las reservas
            if (existingDates.includes(clickedDate)) {
                loadDaySchedule(clickedDate);
            } else {
                // Si la fecha no tiene horario, solicitar confirmación para habilitarla
                const result = await Swal.fire({
                    title: 'Habilitar fecha',
                    text: `¿Deseas habilitar el ${clickedDate}?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, habilitar',
                    cancelButtonText: 'Cancelar'
                });
                if (result.isConfirmed) {
                    await saveSchedules([clickedDate]);
                }
            }
        },
        eventDidMount: function(info) {
            const cell = info.el.closest('.fc-daygrid-day');
            if (cell) {
                cell.style.backgroundColor = 'lightgreen';
            }
        }
    });
    branchCalendar.render();
}

async function loadDaySchedule(date) {
    const token = localStorage.getItem('token');
    if (!token) {
        handleError('No se encontró el token de autorización.');
        return;
    }
    try {
        const response = await fetch(`https://grupouno.click/api/v1/schedules/branch/${selectedBranchId}/date/${date}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            renderReservations(data.data, date);
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cargar los horarios del día:', error);
        handleError('Error al cargar los horarios del día. Por favor, intente nuevamente.');
    }
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

function handleError(message) {
    console.error(message);
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        showConfirmButton: true
    });
}

function renderReservations(schedule, date) {
    const container = document.getElementById('dayScheduleCalendar');
    container.innerHTML = '';

    if (!schedule) {
        container.innerHTML = `
            <div class="no-selection">
                <h2>Seleccione una fecha para ver las reservas</h2>
                <p>Por favor, seleccione una fecha en el calendario para ver las reservas correspondientes.</p>
            </div>
        `;
        return;
    }

    const deleteButton = `
        <button class="btn btn-danger btn-sm float-end" onclick="deleteSchedule(${schedule.id}, '${date}')">
            <i class="bi bi-trash"></i>
        </button>
    `;

    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-3';
    header.innerHTML = `
        <h5 class="mb-0">Horario del ${date}</h5>
        ${deleteButton}
    `;
    container.appendChild(header);

    for (let hour = 12; hour <= 22; hour++) {
        const reservation = schedule[`hour${hour}Reservation`];
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm';
        card.innerHTML = reservation ? `
            <div class="card-body">
                <h5 class="card-title">Reserva a las ${hour}:00</h5>
                <p class="card-text">Nombre: ${reservation.userName}</p>
                <p class="card-text">Personas: ${reservation.numPeople}</p>
                <p class="card-text">Estado: ${reservation.status}</p>
                <button class="btn btn-success" onclick="approveReservation(${reservation.id})">Aprobar</button>
                <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">Cancelar</button>
            </div>
        ` : `
            <div class="card-body">
                <h5 class="card-title">Reserva a las ${hour}:00</h5>
                <p class="card-text">No hay reservas</p>
            </div>
        `;
        container.appendChild(card);
    }
}

async function deleteSchedule(scheduleId, scheduleDate) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`https://grupouno.click/api/v1/schedules/private/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Horario eliminado',
                text: 'El horario ha sido eliminado exitosamente.',
                showConfirmButton: true
            });
            
            // Actualizar el estado visual
            const cell = document.querySelector(`.fc-daygrid-day[data-date="${scheduleDate}"]`);
            if (cell) {
                cell.style.backgroundColor = '';
            }
            
            existingDates = existingDates.filter(date => date !== scheduleDate);
            renderReservations(null);
            loadBranchCalendar(selectedBranchId);
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al eliminar el horario:', error);
        handleError('Error al eliminar el horario. Por favor, intente nuevamente.');
    }
}

async function approveReservation(reservationId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`https://grupouno.click/api/v1/reservations/protected/${reservationId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Reserva aprobada',
                text: 'La reserva ha sido aprobada exitosamente.',
                showConfirmButton: true
            });
            loadDaySchedule(new Date().toISOString().split('T')[0]);
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al aprobar la reserva:', error);
        handleError('Error al aprobar la reserva. Por favor, intente nuevamente.');
    }
}

async function cancelReservation(reservationId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`https://grupouno.click/api/v1/reservations/protected/${reservationId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Reserva cancelada',
                text: 'La reserva ha sido cancelada exitosamente.',
                showConfirmButton: true
            });
            loadDaySchedule(new Date().toISOString().split('T')[0]);
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cancelar la reserva:', error);
        handleError('Error al cancelar la reserva. Por favor, intente nuevamente.');
    }
}

async function saveSchedules(dates) {
    const token = localStorage.getItem('token');
    const scheduleData = {
        branchId: selectedBranchId,
        dates: dates
    };
    console.log('Datos a enviar:', scheduleData);

    try {
        const response = await fetch('https://grupouno.click/api/v1/schedules/private/bulk', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
        const data = await response.json();
        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Horarios guardados',
                text: 'Los horarios han sido guardados exitosamente.',
                showConfirmButton: true
            });
            loadBranchCalendar(selectedBranchId);
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al guardar los horarios:', error);
        handleError('Error al guardar los horarios. Por favor, intente nuevamente.');
    }
}

function conteoItemsTarjetas() {
    const conteos = {
        total: branchesGlobal.length,
        alta: branchesGlobal.filter(branch => branch.capacity > 100).length,
        media: branchesGlobal.filter(branch => branch.capacity <= 100 && branch.capacity > 50).length,
        baja: branchesGlobal.filter(branch => branch.capacity <= 50).length,
        recientes: branchesGlobal.filter(branch => new Date(branch.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
    };

    document.getElementById('totalItems').innerText = conteos.total;
    document.getElementById('totalCapacidadAlta').innerText = conteos.alta;
    document.getElementById('totalCapacidadMedia').innerText = conteos.media;
    document.getElementById('totalCapacidadBaja').innerText = conteos.baja;
    document.getElementById('totalRecientes').innerText = conteos.recientes;
}
