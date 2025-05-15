// Dashboard de Administrador

// Variables globales
let pendingReservations = [];
let allReservations = [];
let reservationModal = null;
let selectedReservationId = null;

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el modal de reservas
    reservationModal = new bootstrap.Modal(document.getElementById('reservationModal'));
    
    // Inicializar los eventos del sidebar y botones
    initializeSidebar();
    setupEventListeners();
    
    // Cargar los datos para el dashboard
    loadDashboardData();
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

// Configurar los eventos de los botones y elementos interactivos
function setupEventListeners() {
    // Botón para actualizar reservas pendientes
    const refreshBtn = document.getElementById('refreshPendingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadPendingReservations();
        });
    }
    
    // Botón para guardar cambios en la reserva
    const saveStatusBtn = document.getElementById('saveReservationStatusBtn');
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', function() {
            updateReservationStatus();
        });
    }
    
    // Evento para cerrar sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
}

// Cargar los datos del dashboard
async function loadDashboardData() {
    try {
        // Mostrar indicadores de carga para todas las secciones
        document.getElementById('pendingCount').innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div>';
        document.getElementById('confirmedCount').innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div>';
        document.getElementById('cancelledCount').innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div>';
        document.getElementById('usersCount').innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div>';
        
        // Cargar los datos en paralelo
        await Promise.all([
            loadReservationsStatistics(),
            loadUsersCount(),
            loadPendingReservations()
        ]);
    } catch (error) {
        console.error('Error al cargar los datos del dashboard:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos del dashboard. Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Cargar estadísticas de reservas
async function loadReservationsStatistics() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Obtener todas las reservas para las estadísticas
        const response = await fetch(`${window.API_BASE_URL || 'http://localhost:8080'}/api/reservations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar las reservas');
        }
        
        const data = await response.json();
        if (data.success) {
            allReservations = data.data;
            
            // Calcular estadísticas
            const pending = allReservations.filter(res => res.status === 'PENDING').length;
            const confirmed = allReservations.filter(res => res.status === 'CONFIRMED').length;
            const cancelled = allReservations.filter(res => res.status === 'CANCELLED').length;
            
            // Actualizar contadores
            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('confirmedCount').textContent = confirmed;
            document.getElementById('cancelledCount').textContent = cancelled;
        } else {
            throw new Error(data.message || 'Error al cargar las reservas');
        }
    } catch (error) {
        console.error('Error al cargar estadísticas de reservas:', error);
        document.getElementById('pendingCount').textContent = '-';
        document.getElementById('confirmedCount').textContent = '-';
        document.getElementById('cancelledCount').textContent = '-';
    }
}

// Cargar el conteo de usuarios
async function loadUsersCount() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'http://localhost:8080'}/api/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('usersCount').textContent = data.data.length;
        } else {
            throw new Error(data.message || 'Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error al cargar conteo de usuarios:', error);
        document.getElementById('usersCount').textContent = '-';
    }
}

// Cargar reservas pendientes
async function loadPendingReservations() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Mostrar indicadores de carga
    document.getElementById('pendingReservationsContainer').innerHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Cargando reservas pendientes...</p>
        </div>
    `;
    
    try {
        // Si ya tenemos todas las reservas cargadas, filtramos las pendientes
        if (allReservations.length > 0) {
            pendingReservations = allReservations.filter(res => res.status === 'PENDING');
            displayPendingReservations(pendingReservations);
            return;
        }
        
        // Si no, hacemos la petición específica
        const response = await fetch(`${window.API_BASE_URL || 'http://localhost:8080'}/api/reservations?status=PENDING`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar las reservas pendientes');
        }
        
        const data = await response.json();
        if (data.success) {
            pendingReservations = data.data;
            displayPendingReservations(pendingReservations);
        } else {
            throw new Error(data.message || 'Error al cargar las reservas pendientes');
        }
    } catch (error) {
        console.error('Error al cargar reservas pendientes:', error);
        document.getElementById('pendingReservationsContainer').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    No se pudieron cargar las reservas pendientes. Por favor, intente más tarde.
                </div>
            </div>
        `;
    }
}

// Mostrar las reservas pendientes
function displayPendingReservations(reservations) {
    const container = document.getElementById('pendingReservationsContainer');
    const noReservationsDiv = document.getElementById('noPendingReservations');
    
    if (!reservations || reservations.length === 0) {
        container.innerHTML = '';
        noReservationsDiv.style.display = 'block';
        return;
    }
    
    noReservationsDiv.style.display = 'none';
    
    // Mostrar máximo 6 reservas pendientes
    const reservationsToShow = reservations.slice(0, 6);
    let html = '';
    
    reservationsToShow.forEach(reservation => {
        // Formatear la fecha
        const reservationDate = new Date(reservation.date);
        const formattedDate = reservationDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Formatear la hora
        const reservationTime = reservation.time || '00:00';
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card reservation-card shadow-sm" data-id="${reservation.id}" onclick="openReservationModal(${reservation.id})">
                    <div class="card-body">
                        <span class="badge bg-warning status-badge">Pendiente</span>
                        <h5 class="card-title">${reservation.user?.name || 'Cliente'}</h5>
                        <div class="mb-2">
                            <i class="bi bi-calendar me-2"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="mb-2">
                            <i class="bi bi-clock me-2"></i>
                            <span>${reservationTime}</span>
                        </div>
                        <div class="mb-2">
                            <i class="bi bi-people me-2"></i>
                            <span>${reservation.people} personas</span>
                        </div>
                        <div class="mb-3">
                            <i class="bi bi-geo-alt me-2"></i>
                            <span>${reservation.branch?.name || 'Sede no especificada'}</span>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button class="btn btn-sm btn-outline-success me-2" onclick="confirmReservation(event, ${reservation.id})">
                                <i class="bi bi-check-circle"></i> Confirmar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="cancelReservation(event, ${reservation.id})">
                                <i class="bi bi-x-circle"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Abrir modal de detalles de reserva
window.openReservationModal = function(reservationId) {
    selectedReservationId = reservationId;
    const reservation = pendingReservations.find(res => res.id === reservationId);
    
    if (!reservation) {
        console.error('Reserva no encontrada:', reservationId);
        return;
    }
    
    // Formatear la fecha
    const reservationDate = new Date(reservation.date);
    const formattedDate = reservationDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Llenar los detalles de la reserva en el modal
    document.getElementById('modalClientName').textContent = reservation.user?.name || 'No especificado';
    document.getElementById('modalReservationDate').textContent = formattedDate;
    document.getElementById('modalReservationTime').textContent = reservation.time || 'No especificado';
    document.getElementById('modalGuests').textContent = reservation.people || 'No especificado';
    document.getElementById('modalBranch').textContent = reservation.branch?.name || 'No especificado';
    document.getElementById('modalTable').textContent = reservation.table?.number || 'No especificado';
    
    // Establecer el estado actual de la reserva
    document.getElementById('reservationStatus').value = reservation.status || 'PENDING';
    
    // Abrir el modal
    reservationModal.show();
}

// Función para actualizar el estado de la reserva desde el modal
async function updateReservationStatus() {
    if (!selectedReservationId) return;
    
    const newStatus = document.getElementById('reservationStatus').value;
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'http://localhost:8080'}/api/reservations/${selectedReservationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar el estado de la reserva');
        }
        
        const data = await response.json();
        if (data.success) {
            // Cerrar el modal
            reservationModal.hide();
            
            // Actualizar la lista de reservas y estadísticas
            loadDashboardData();
            
            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `La reserva ha sido ${newStatus === 'CONFIRMED' ? 'confirmada' : newStatus === 'CANCELLED' ? 'cancelada' : newStatus === 'COMPLETED' ? 'completada' : 'actualizada'} exitosamente.`,
                confirmButtonText: 'Aceptar'
            });
        } else {
            throw new Error(data.message || 'Error al actualizar el estado de la reserva');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo actualizar el estado de la reserva. Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para confirmar una reserva directamente desde la tarjeta
window.confirmReservation = function(event, reservationId) {
    event.stopPropagation(); // Evitar que se abra el modal
    
    Swal.fire({
        title: '¿Confirmar esta reserva?',
        text: 'La reserva se marcará como confirmada.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            changeReservationStatus(reservationId, 'CONFIRMED');
        }
    });
}

// Función para cancelar una reserva directamente desde la tarjeta
window.cancelReservation = function(event, reservationId) {
    event.stopPropagation(); // Evitar que se abra el modal
    
    Swal.fire({
        title: '¿Cancelar esta reserva?',
        text: 'La reserva se marcará como cancelada.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
    }).then((result) => {
        if (result.isConfirmed) {
            changeReservationStatus(reservationId, 'CANCELLED');
        }
    });
}

// Función para cambiar el estado de una reserva (botones rápidos)
async function changeReservationStatus(reservationId, status) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'http://localhost:8080'}/api/reservations/${reservationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: status })
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar el estado de la reserva');
        }
        
        const data = await response.json();
        if (data.success) {
            // Actualizar la lista de reservas y estadísticas
            loadDashboardData();
            
            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `La reserva ha sido ${status === 'CONFIRMED' ? 'confirmada' : 'cancelada'} exitosamente.`,
                confirmButtonText: 'Aceptar'
            });
        } else {
            throw new Error(data.message || 'Error al actualizar el estado de la reserva');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo actualizar el estado de la reserva. Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar'
        });
    }
}
