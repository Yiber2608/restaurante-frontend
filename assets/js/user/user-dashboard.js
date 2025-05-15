// Dashboard de Usuario
let userReservations = [];
let currentUserId = null;
let reservationModal = null;
let selectedReservationId = null;

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sidebar
    initializeSidebar();
    
    // Comprobar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Obtener ID del usuario y cargar información
    try {
        const payload = jwt_decode(token);
        currentUserId = payload.userId;
        document.getElementById('username').textContent = payload.name || 'Usuario';
        document.getElementById('welcomeUserName').textContent = payload.name || 'Usuario';
        
        // Cargar reservas del usuario
        loadUserReservations();
    } catch (error) {
        console.error('Error decodificando token:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del usuario. Por favor, inicie sesión nuevamente.',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            window.location.href = 'index.html';
        });
    }
    
    // Inicializar modal de reserva
    reservationModal = new bootstrap.Modal(document.getElementById('reservationModal'));
    
    // Configurar filtros y botones
    setupFilterAndRefresh();
});

// Inicializar el sidebar
function initializeSidebar() {
    document.querySelector('.toggle-btn').addEventListener('click', function () {
        const sidebar = document.querySelector('.sidebar');
        const main = document.querySelector('.main');

        sidebar.classList.toggle('hidden');

        // Ajustar el ancho del main cuando se oculta el sidebar
        if (sidebar.classList.contains('hidden')) {
            main.style.width = '100%';
        } else {
            main.style.width = 'calc(100% - 90px)';
        }
    });
}

// Cargar las reservas del usuario
async function loadUserReservations() {
    if (!currentUserId) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/user/${currentUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar las reservas');
        }
        
        const result = await response.json();
        
        if (result.success) {
            userReservations = result.data;
            
            // Actualizar contadores
            updateReservationCounters(userReservations);
            
            // Filtrar y mostrar reservas
            const statusFilter = document.getElementById('statusFilter').value;
            displayReservations(filterReservationsByStatus(userReservations, statusFilter));
            
            // Mostrar próxima reserva si existe
            displayNextReservation(userReservations);
        } else {
            throw new Error(result.message || 'Error al cargar las reservas');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('reservationsList').innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="alert alert-danger mb-0">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${error.message || 'No se pudieron cargar las reservas. Por favor, intente más tarde.'}
                    </div>
                </td>
            </tr>
        `;
    }
}

// Actualizar contadores de reservas
function updateReservationCounters(reservations) {
    if (!reservations) return;
    
    const pendingCount = reservations.filter(res => res.status === 'PENDING').length;
    const completedCount = reservations.filter(res => res.status === 'COMPLETED').length;
    const cancelledCount = reservations.filter(res => res.status === 'CANCELLED').length;
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('cancelledCount').textContent = cancelledCount;
    document.getElementById('reservationCount').textContent = `${reservations.length} reserva${reservations.length !== 1 ? 's' : ''}`;
}

// Filtrar reservas por estado
function filterReservationsByStatus(reservations, status) {
    if (!reservations) return [];
    if (status === 'ALL') return reservations;
    
    return reservations.filter(res => res.status === status);
}

// Mostrar las reservas en la tabla
function displayReservations(reservations) {
    const tableBody = document.getElementById('reservationsList');
    
    if (!reservations || reservations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-calendar-x fs-1"></i>
                        <p class="mt-2 mb-0">No hay reservas para mostrar</p>
                        <a href="user-reserva.html" class="btn btn-primary btn-sm mt-3">
                            <i class="bi bi-plus-circle me-1"></i> Hacer una reserva
                        </a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Ordenar reservas por fecha (las más recientes primero)
    const sortedReservations = [...reservations].sort((a, b) => {
        const dateA = new Date(`${a.reservationDate}T${a.startTime}`);
        const dateB = new Date(`${b.reservationDate}T${b.startTime}`);
        return dateB - dateA;
    });
    
    sortedReservations.forEach(reservation => {
        const statusClass = getStatusBadgeClass(reservation.status);
        const statusText = getStatusText(reservation.status);
        const reservationDate = formatDate(reservation.reservationDate);
        
        html += `
            <tr data-reservation-id="${reservation.id}">
                <td>${reservation.id}</td>
                <td>${reservation.branchName}</td>
                <td>Mesa ${reservation.tableNumber}</td>
                <td>${reservationDate}</td>
                <td>${formatTime(reservation.startTime)} - ${formatTime(reservation.endTime)}</td>
                <td>${reservation.numGuests} persona${reservation.numGuests !== 1 ? 's' : ''}</td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-details-btn" data-reservation-id="${reservation.id}">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    ${reservation.status === 'PENDING' ? `
                        <button class="btn btn-sm btn-outline-danger ms-1 cancel-btn" data-reservation-id="${reservation.id}">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Agregar eventos a los botones
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = parseInt(this.dataset.reservationId);
            openReservationDetails(reservationId);
        });
    });
    
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = parseInt(this.dataset.reservationId);
            confirmCancelReservation(reservationId);
        });
    });
}

// Mostrar la próxima reserva pendiente
function displayNextReservation(reservations) {
    if (!reservations || reservations.length === 0) {
        document.getElementById('nextReservationContainer').style.display = 'none';
        return;
    }
    
    // Filtrar reservas pendientes
    const pendingReservations = reservations.filter(res => res.status === 'PENDING');
    
    if (pendingReservations.length === 0) {
        document.getElementById('nextReservationContainer').style.display = 'none';
        return;
    }
    
    // Ordenar por fecha más próxima
    const sortedReservations = [...pendingReservations].sort((a, b) => {
        const dateA = new Date(`${a.reservationDate}T${a.startTime}`);
        const dateB = new Date(`${b.reservationDate}T${b.startTime}`);
        return dateA - dateB;
    });
    
    // Obtener la próxima reserva
    const nextReservation = sortedReservations[0];
    const reservationDate = formatDate(nextReservation.reservationDate);
    
    // Verificar si la fecha ya pasó
    const today = new Date();
    const reservationDateTime = new Date(`${nextReservation.reservationDate}T${nextReservation.startTime}`);
    
    if (reservationDateTime < today) {
        document.getElementById('nextReservationContainer').style.display = 'none';
        return;
    }
    
    // Calcular días restantes
    const daysRemaining = Math.ceil((reservationDateTime - today) / (1000 * 60 * 60 * 24));
    let daysText = '';
    
    if (daysRemaining === 0) {
        daysText = '<span class="badge bg-danger">¡HOY!</span>';
    } else if (daysRemaining === 1) {
        daysText = '<span class="badge bg-warning text-dark">¡MAÑANA!</span>';
    } else {
        daysText = `<span class="badge bg-info">En ${daysRemaining} días</span>`;
    }
    
    const html = `
        <div class="d-md-flex align-items-center">
            <div class="text-center text-md-start me-md-4 mb-3 mb-md-0">
                <div class="display-4">${reservationDate}</div>
                <div class="h5">${formatTime(nextReservation.startTime)} ${daysText}</div>
            </div>
            <div class="vr d-none d-md-block mx-4"></div>
            <div>
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-building me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Sede</h6>
                        <p class="mb-0">${nextReservation.branchName}</p>
                    </div>
                </div>
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-geo-alt me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Mesa</h6>
                        <p class="mb-0">Mesa ${nextReservation.tableNumber} (${nextReservation.numGuests} personas)</p>
                    </div>
                </div>
                ${nextReservation.specialRequests && nextReservation.specialRequests !== 'Ninguna' ? `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-card-text me-2 text-primary"></i>
                        <div>
                            <h6 class="mb-0">Solicitudes</h6>
                            <p class="mb-0">${nextReservation.specialRequests}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="ms-auto mt-3 mt-md-0 text-center text-md-end">
                <button class="btn btn-primary me-2 view-details-btn" data-reservation-id="${nextReservation.id}">
                    <i class="bi bi-eye me-1"></i> Detalles
                </button>
                <button class="btn btn-outline-danger cancel-btn" data-reservation-id="${nextReservation.id}">
                    <i class="bi bi-x-circle me-1"></i> Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('nextReservationContent').innerHTML = html;
    document.getElementById('nextReservationContainer').style.display = 'block';
    
    // Agregar eventos a los botones
    document.querySelectorAll('#nextReservationContent .view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = parseInt(this.dataset.reservationId);
            openReservationDetails(reservationId);
        });
    });
    
    document.querySelectorAll('#nextReservationContent .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = parseInt(this.dataset.reservationId);
            confirmCancelReservation(reservationId);
        });
    });
}

// Configurar filtros y botón de actualizar
function setupFilterAndRefresh() {
    document.getElementById('statusFilter').addEventListener('change', function() {
        const status = this.value;
        displayReservations(filterReservationsByStatus(userReservations, status));
    });
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadUserReservations();
    });
}

// Abrir modal con detalles de la reserva
function openReservationDetails(reservationId) {
    const reservation = userReservations.find(res => res.id === reservationId);
    if (!reservation) return;
    
    selectedReservationId = reservationId;
    
    const statusClass = getStatusBadgeClass(reservation.status);
    const statusText = getStatusText(reservation.status);
    const reservationDate = formatDate(reservation.reservationDate);
    
    const cancelBtn = document.getElementById('cancelReservationBtn');
    if (reservation.status === 'PENDING') {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => confirmCancelReservation(reservationId);
    } else {
        cancelBtn.style.display = 'none';
    }
    
    const html = `
        <div class="row">
            <div class="col-12 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Reserva #${reservation.id}</h5>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <hr>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-calendar-date me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Fecha</h6>
                        <p class="mb-0">${reservationDate}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-clock me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Hora</h6>
                        <p class="mb-0">${formatTime(reservation.startTime)} - ${formatTime(reservation.endTime)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-building me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Sede</h6>
                        <p class="mb-0">${reservation.branchName}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-table me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Mesa</h6>
                        <p class="mb-0">Mesa ${reservation.tableNumber}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-people me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Personas</h6>
                        <p class="mb-0">${reservation.numGuests} persona${reservation.numGuests !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>
            <div class="col-12 mt-2">
                <h6 class="mb-2">Solicitudes Especiales</h6>
                <div class="alert alert-light">
                    ${reservation.specialRequests || 'Ninguna'}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('reservationModalContent').innerHTML = html;
    reservationModal.show();
}

// Confirmar cancelación de reserva
function confirmCancelReservation(reservationId) {
    Swal.fire({
        title: '¿Cancelar Reserva?',
        text: 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta reserva?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, mantener'
    }).then((result) => {
        if (result.isConfirmed) {
            cancelReservation(reservationId);
        }
    });
}

// Cancelar una reserva
async function cancelReservation(reservationId) {
    const token = localStorage.getItem('token');
    try {
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Procesando',
            text: 'Cancelando su reserva...',
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Esta es una simulación de la cancelación, ajustar según el API real
        // En un caso real, aquí se realizaría una llamada PATCH o PUT para actualizar el estado
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/${reservationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'CANCELLED'
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al cancelar la reserva');
        }
        
        const result = await response.json();
        if (result.success) {
            // Si el modal está abierto, cerrarlo
            if (selectedReservationId === reservationId) {
                reservationModal.hide();
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Reserva Cancelada',
                text: 'La reserva ha sido cancelada exitosamente.',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                // Recargar las reservas
                loadUserReservations();
            });
        } else {
            throw new Error(result.message || 'Error al cancelar la reserva');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo cancelar la reserva. Por favor, intente más tarde.'
        });
    }
}

// Utilidades para formato y visualización
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function formatTime(timeString) {
    if (!timeString) return '';
    
    // Convertir formato HH:MM:SS a HH:MM
    const timeParts = timeString.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'PENDING':
            return 'bg-warning text-dark';
        case 'COMPLETED':
            return 'bg-success';
        case 'CANCELLED':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'PENDING':
            return 'Pendiente';
        case 'COMPLETED':
            return 'Completada';
        case 'CANCELLED':
            return 'Cancelada';
        default:
            return status;
    }
}
