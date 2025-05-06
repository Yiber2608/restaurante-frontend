// Variables globales
let calendar;
let branchesMap;
let markers = [];
let branches = [];
let selectedBranchId = null;
let reservations = [];

// Inicializar la página cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeStatistics();
    loadBranches();
    initializeCalendar();
    initializeFilters();
    initializeMap();
    
    // Eliminar cualquier backdrop modal que pueda haber quedado
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
    });
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

// Inicializar contador de estadísticas
function initializeStatistics() {
    // Establecer valores iniciales para los contadores de estadísticas
    document.getElementById('totalReservations').textContent = '0';
    document.getElementById('confirmedReservations').textContent = '0';
    document.getElementById('pendingReservations').textContent = '0';
    document.getElementById('cancelledReservations').textContent = '0';
}

// Actualizar estadísticas de reservas
function updateStatistics(reservations) {
    if (!reservations || reservations.length === 0) {
        initializeStatistics();
        return;
    }

    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter(res => res.status === 'CONFIRMED').length;
    const pendingReservations = reservations.filter(res => res.status === 'PENDING').length;
    const cancelledReservations = reservations.filter(res => res.status === 'CANCELLED').length;

    document.getElementById('totalReservations').textContent = totalReservations;
    document.getElementById('confirmedReservations').textContent = confirmedReservations;
    document.getElementById('pendingReservations').textContent = pendingReservations;
    document.getElementById('cancelledReservations').textContent = cancelledReservations;
}

// Cargar las sedes desde la API
async function loadBranches() {
    try {
        console.log("Iniciando carga de sedes");
        const token = localStorage.getItem('token');
        
        // Mostrar indicador de carga
        const branchListContainer = document.getElementById('branchList');
        if (branchListContainer) {
            branchListContainer.innerHTML = `
                <div class="list-group-item d-flex justify-content-center p-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            `;
        }
        
        // Verificamos que la URL de la API exista
        if (!window.API_BASE_URL) {
            console.error("URL de API no definida. Verifique el archivo config.js");
            throw new Error("URL de API no definida");
        }
        
        console.log("URL de API:", window.API_BASE_URL);
        console.log("Token disponible:", !!token);
        
        const response = await fetch(`${window.API_BASE_URL}/api/v1/branches`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Respuesta recibida:", response.status);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error("Error de autenticación:", response.status);
                throw new Error("Sesión expirada o no autorizada");
            }
            
            const errorText = await response.text();
            console.error("Error en la respuesta:", response.status, errorText);
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        // Intentamos parsear la respuesta como JSON
        let data;
        try {
            data = await response.json();
            console.log("Datos recibidos:", data);
        } catch (parseError) {
            console.error("Error al parsear JSON:", parseError);
            throw new Error("Formato de respuesta inválido");
        }
        
        if (data.success) {
            branches = data.data || [];
            
            // Renderizar lista de sedes en el sidebar
            renderBranchList(branches);
            
            // Añadir marcadores al mapa
            if (typeof addBranchesToMap === 'function') {
                addBranchesToMap(branches);
            }
            
            // Si no hay sedes, mostrar un mensaje
            if (branches.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'No hay sedes disponibles',
                    text: 'No se encontraron sedes para gestionar reservas.',
                    showConfirmButton: true
                });
            } else {
                // Seleccionar la primera sede por defecto
                selectBranch(branches[0].id);
            }
        } else {
            console.error("API reportó error:", data.message);
            throw new Error(data.message || "Error desconocido");
        }
    } catch (error) {
        console.error('Error al cargar las sedes:', error);
        
        // Mensaje de error específico basado en el tipo de error
        let errorMessage = 'No se pudieron cargar las sedes. ';
        
        if (error.message.includes("Failed to fetch") || error.message === "NetworkError" || error.message === "Network request failed") {
            errorMessage += "Verifica tu conexión a internet y que el servidor esté en ejecución.";
        } else if (error.message.includes("401") || error.message.includes("403") || error.message === "Sesión expirada o no autorizada") {
            errorMessage += "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
            // Redireccionar al login después de mostrar el mensaje
            setTimeout(() => {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorMessage += error.message;
        }
        
        const branchListContainer = document.getElementById('branchList');
        if (branchListContainer) {
            branchListContainer.innerHTML = `
                <div class="list-group-item d-flex flex-column justify-content-center p-3 text-center">
                    <div class="text-danger mb-2">
                        <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                    </div>
                    <p class="mb-0">${errorMessage}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="loadBranches()">
                        <i class="bi bi-arrow-repeat me-1"></i>Reintentar
                    </button>
                </div>
            `;
        }
        
        showError('Error de conexión', errorMessage);
    }
}

// Renderizar la lista de sedes en el sidebar
function renderBranchList(branches) {
    const branchListContainer = document.getElementById('branchList');
    if (!branchListContainer) return;
    
    branchListContainer.innerHTML = '';
    
    if (branches.length === 0) {
        branchListContainer.innerHTML = `
            <div class="list-group-item text-center py-4">
                <i class="bi bi-building-x text-muted mb-2" style="font-size: 2rem;"></i>
                <p class="mb-0">No hay sedes disponibles</p>
            </div>
        `;
        return;
    }
    
    branches.forEach(branch => {
        const listItem = document.createElement('div');
        listItem.className = `list-group-item branch-item d-flex align-items-center p-3 ${selectedBranchId === branch.id ? 'active' : ''}`;
        listItem.setAttribute('data-id', branch.id);
        
        // Icono de ocupación basado en reservas
        let statusIcon = 'bi-circle';
        let statusClass = 'text-success';
        
        // Filtrar reservas por sede (si ya están cargadas)
        const branchReservations = reservations.filter(r => r.branchId == branch.id);
        const reservationCount = branchReservations.length;
        
        if (reservationCount > 10) {
            statusIcon = 'bi-circle-fill';
            statusClass = 'text-danger';
        } else if (reservationCount > 5) {
            statusIcon = 'bi-circle-half';
            statusClass = 'text-warning';
        }
        
        listItem.innerHTML = `
            <div class="me-3 branch-icon">
                <i class="bi ${statusIcon} ${statusClass}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${branch.name}</h6>
                    <span class="badge bg-primary rounded-pill">${reservationCount}</span>
                </div>
                <div class="small text-muted d-flex justify-content-between">
                    <span>${branch.address ? (branch.address.substring(0, 20) + (branch.address.length > 20 ? '...' : '')) : 'Sin dirección'}</span>
                    <span>${formatTime(branch.openingTime || '09:00:00')} - ${formatTime(branch.closingTime || '22:00:00')}</span>
                </div>
            </div>
        `;
        
        listItem.addEventListener('click', () => {
            selectBranch(branch.id);
        });
        
        branchListContainer.appendChild(listItem);
    });
}

// Inicializar los filtros de fecha y búsqueda
function initializeFilters() {
    // Configurar filtro por fecha actual
    const today = new Date();
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.valueAsDate = today;
    }
    
    // Botones de filtro
    const btnToday = document.getElementById('btnTodayReservations');
    const btnWeek = document.getElementById('btnWeekReservations');
    const btnMonth = document.getElementById('btnMonthReservations');
    const btnDateFilter = document.getElementById('btnDateFilter');
    const btnSearch = document.getElementById('btnSearch');
    const searchInput = document.getElementById('searchInput');
    
    if (btnToday) {
        btnToday.addEventListener('click', () => {
            filterReservationsToday();
        });
    }
    
    if (btnWeek) {
        btnWeek.addEventListener('click', () => {
            filterReservationsThisWeek();
        });
    }
    
    if (btnMonth) {
        btnMonth.addEventListener('click', () => {
            filterReservationsThisMonth();
        });
    }
    
    if (btnDateFilter && dateFilter) {
        btnDateFilter.addEventListener('click', () => {
            const selectedDate = dateFilter.value;
            if (selectedDate) {
                filterReservationsByDate(selectedDate);
            }
        });
    }
    
    if (btnSearch && searchInput) {
        btnSearch.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm.length > 0) {
                searchReservations(searchTerm);
            }
        });
        
        // También permitir búsqueda al presionar Enter
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm.length > 0) {
                    searchReservations(searchTerm);
                }
            }
        });
    }
}

// Filtrar reservas para hoy
function filterReservationsToday() {
    if (!selectedBranchId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona una sede',
            text: 'Por favor, selecciona una sede primero para ver sus reservas.'
        });
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Llamar a la API para obtener las reservas del día actual
    loadReservationsForDate(selectedBranchId, today);
}

// Filtrar reservas para esta semana
function filterReservationsThisWeek() {
    if (!selectedBranchId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona una sede',
            text: 'Por favor, selecciona una sede primero para ver sus reservas.'
        });
        return;
    }
    
    // Obtener fecha de inicio (lunes) y fin (domingo) de la semana actual
    const today = new Date();
    const currentDay = today.getDay(); // 0 (domingo) a 6 (sábado)
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];
    
    // Llamar a la API para obtener las reservas de la semana
    loadReservationsForDateRange(selectedBranchId, startDate, endDate);
}

// Filtrar reservas para este mes
function filterReservationsThisMonth() {
    if (!selectedBranchId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona una sede',
            text: 'Por favor, selecciona una sede primero para ver sus reservas.'
        });
        return;
    }
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];
    
    // Llamar a la API para obtener las reservas del mes
    loadReservationsForDateRange(selectedBranchId, startDate, endDate);
}

// Filtrar reservas por fecha específica
function filterReservationsByDate(dateString) {
    if (!selectedBranchId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona una sede',
            text: 'Por favor, selecciona una sede primero para ver sus reservas.'
        });
        return;
    }
    
    // Llamar a la API para obtener las reservas de la fecha seleccionada
    loadReservationsForDate(selectedBranchId, dateString);
}

// Cargar reservas para una fecha específica
async function loadReservationsForDate(branchId, date) {
    try {
        const token = localStorage.getItem('token');
        
        Swal.fire({
            title: 'Cargando reservas',
            text: 'Por favor espera...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/branch/${branchId}?date=${date}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        Swal.close();
        
        if (response.ok && data.success) {
            // Adaptar al formato que espera la aplicación
            reservations = data.data.map(reservation => ({
                id: reservation.id,
                date: reservation.reservationDate,
                time: reservation.startTime,
                endTime: reservation.endTime,
                duration: calculateDuration(reservation.startTime, reservation.endTime),
                people: reservation.numGuests,
                customerName: reservation.userName,
                customerEmail: reservation.userEmail || "",
                comments: reservation.specialRequests || "",
                status: reservation.status,
                branchId: reservation.branchId,
                branchName: reservation.branchName,
                tableId: reservation.tableId,
                tableNumber: reservation.tableNumber
            }));
            
            // Actualizar eventos en el calendario
            updateReservationEvents(reservations);
            updateStatistics(reservations);
            
            // Mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: 'Reservas cargadas',
                text: `Se encontraron ${reservations.length} reservas para el ${formatDate(date)}.`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Actualizar la fecha seleccionada en el filtro visual
            const dateFilter = document.getElementById('dateFilter');
            if (dateFilter) {
                dateFilter.value = date;
            }
        } else {
            showError('Error al cargar las reservas:', data.message);
        }
    } catch (error) {
        Swal.close();
        console.error('Error al cargar las reservas:', error);
        showError('Error de conexión', 'No se pudieron cargar las reservas. Verifica tu conexión a internet.');
    }
}

// Cargar reservas para un rango de fechas
async function loadReservationsForDateRange(branchId, startDate, endDate) {
    try {
        const token = localStorage.getItem('token');
        
        Swal.fire({
            title: 'Cargando reservas',
            text: 'Por favor espera...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/branch/${branchId}/range?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        Swal.close();
        
        if (response.ok && data.success) {
            // Adaptar al formato que espera la aplicación
            reservations = data.data.map(reservation => ({
                id: reservation.id,
                date: reservation.reservationDate,
                time: reservation.startTime,
                endTime: reservation.endTime,
                duration: calculateDuration(reservation.startTime, reservation.endTime),
                people: reservation.numGuests,
                customerName: reservation.userName,
                customerEmail: reservation.userEmail || "",
                comments: reservation.specialRequests || "",
                status: reservation.status,
                branchId: reservation.branchId,
                branchName: reservation.branchName,
                tableId: reservation.tableId,
                tableNumber: reservation.tableNumber
            }));
            
            // Actualizar eventos en el calendario
            updateReservationEvents(reservations);
            updateStatistics(reservations);
            
            // Mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: 'Reservas cargadas',
                text: `Se encontraron ${reservations.length} reservas del ${formatDate(startDate)} al ${formatDate(endDate)}.`,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            showError('Error al cargar las reservas:', data.message);
        }
    } catch (error) {
        Swal.close();
        console.error('Error al cargar las reservas:', error);
        showError('Error de conexión', 'No se pudieron cargar las reservas. Verifica tu conexión a internet.');
    }
}

// Función para buscar reservas
function searchReservations(searchTerm) {
    if (!selectedBranchId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona una sede',
            text: 'Por favor, selecciona una sede primero para buscar reservas.'
        });
        return;
    }
    
    if (searchTerm.length < 3) {
        Swal.fire({
            icon: 'info',
            title: 'Búsqueda demasiado corta',
            text: 'Por favor, ingresa al menos 3 caracteres para buscar.'
        });
        return;
    }
    
    // Filtrar las reservas ya cargadas
    const filtered = reservations.filter(reservation => {
        return reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               reservation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (reservation.comments && reservation.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (reservation.tableNumber && reservation.tableNumber.toString().includes(searchTerm));
    });
    
    if (filtered.length > 0) {
        // Mostrar solo las reservas filtradas en el calendario
        updateReservationEvents(filtered);
        
        Swal.fire({
            icon: 'success',
            title: 'Resultados de búsqueda',
            text: `Se encontraron ${filtered.length} reservas que coinciden con "${searchTerm}".`,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: `No se encontraron reservas que coincidan con "${searchTerm}".`,
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Cargar reservas para una sede específica
async function loadReservationsForBranch(branchId) {
    if (!branchId) {
        console.warn('No se ha seleccionado ninguna sede para cargar reservas');
        return;
    }
    
    // Validar que branchId sea un número
    if (isNaN(parseInt(branchId))) {
        console.error('Error: branchId debe ser un número', branchId);
        Swal.fire({
            icon: 'error',
            title: 'Error de parámetro',
            text: 'ID de sede inválido. Debe ser un valor numérico.'
        });
        return;
    }
    
    try {
        console.log("Cargando reservas para la sede:", branchId);
        const token = localStorage.getItem('token');
        
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Cargando reservas',
            text: 'Por favor espera...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Usar el endpoint correcto para obtener reservas por sede con ID numérico validado
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/branch/${parseInt(branchId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Respuesta de reservas recibida:", response.status);
        const data = await response.json();
        console.log("Datos de reservas recibidos:", data.success, "Cantidad:", data.data?.length || 0);
        Swal.close();
        
        if (response.ok && data.success) {
            // Adaptar el formato de reservas según la estructura proporcionada
            reservations = data.data.map(reservation => ({
                id: reservation.id,
                date: reservation.reservationDate,
                time: reservation.startTime,
                endTime: reservation.endTime,
                duration: calculateDuration(reservation.startTime, reservation.endTime),
                people: reservation.numGuests,
                customerName: reservation.userName,
                customerEmail: reservation.userEmail || "",
                comments: reservation.specialRequests || "",
                status: reservation.status,
                branchId: reservation.branchId,
                branchName: reservation.branchName,
                tableId: reservation.tableId,
                tableNumber: reservation.tableNumber
            }));
            
            console.log("Reservas procesadas:", reservations.length);
            
            // Actualizar contador de reservas en la lista de sedes
            updateBranchReservationsCount(branchId, reservations.length);
            
            // Actualizar eventos en el calendario
            updateReservationEvents(reservations);
            updateStatistics(reservations);
        } else {
            console.error("Error en la respuesta de reservas:", data.message);
            showError('Error al cargar las reservas:', data.message);
        }
    } catch (error) {
        Swal.close();
        console.error('Error al cargar las reservas:', error);
        showError('Error de conexión', 'No se pudieron cargar las reservas. Verifica tu conexión a internet.');
    }
}

// Actualizar contador de reservas para una sede
function updateBranchReservationsCount(branchId, count) {
    const branchItem = document.querySelector(`.branch-item[data-id="${branchId}"]`);
    if (branchItem) {
        const countBadge = branchItem.querySelector('.badge');
        if (countBadge) {
            countBadge.textContent = count;
        }
        
        // Actualizar también el icono de estado
        const iconElement = branchItem.querySelector('.branch-icon i');
        if (iconElement) {
            // Resetear clases
            iconElement.className = 'bi';
            
            // Añadir clases según cantidad de reservas
            if (count > 10) {
                iconElement.classList.add('bi-circle-fill', 'text-danger');
            } else if (count > 5) {
                iconElement.classList.add('bi-circle-half', 'text-warning');
            } else {
                iconElement.classList.add('bi-circle', 'text-success');
            }
        }
    }
}

// Calcular duración en minutos entre dos horas
function calculateDuration(startTime, endTime) {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end - start) / 60000; // convertir a minutos
}

// Actualizar eventos en el calendario
function updateReservationEvents(reservations) {
    console.log("Actualizando eventos en el calendario:", reservations.length);
    if (calendar) {
        // Limpiar eventos existentes
        calendar.getEvents().forEach(event => event.remove());
        
        // Agregar las nuevas reservas como eventos
        reservations.forEach(reservation => {
            const startDate = `${reservation.date}T${reservation.time}`;
            const endTime = reservation.endTime || calculateEndTime(reservation.date, reservation.time, reservation.duration || 120);
            const endDate = `${reservation.date}T${endTime}`;
            
            console.log(`Añadiendo evento: ${reservation.customerName}, Fecha: ${startDate}, Estado: ${reservation.status}`);
            
            calendar.addEvent({
                id: String(reservation.id), // Convertir a string para evitar errores
                title: `${reservation.customerName} (${reservation.people} personas)`,
                start: startDate,
                end: endDate,
                classNames: getStatusClass(reservation.status),
                extendedProps: {
                    people: reservation.people,
                    status: reservation.status,
                    comments: reservation.comments,
                    customerName: reservation.customerName,
                    customerEmail: reservation.customerEmail,
                    tableNumber: reservation.tableNumber
                }
            });
        });
        
        // Refrescar la vista del calendario
        calendar.refetchEvents();
    } else {
        console.error("El calendario no está inicializado");
    }
}

// Formatear hora (eliminar segundos)
function formatTime(timeString) {
    if (!timeString) return '';
    
    // Separar la hora en horas, minutos y segundos
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    
    // Devolver solo horas y minutos
    return `${parts[0]}:${parts[1]}`;
}

// Calcular hora de fin basada en la duración
function calculateEndTime(date, startTime, durationMinutes) {
    const start = new Date(`${date}T${startTime}`);
    start.setMinutes(start.getMinutes() + durationMinutes);
    
    // Formatear la hora de fin
    const hours = String(start.getHours()).padStart(2, '0');
    const minutes = String(start.getMinutes()).padStart(2, '0');
    const seconds = String(start.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

// Obtener clase CSS según el estado
function getStatusClass(status) {
    switch(status) {
        case 'CONFIRMED': return ['bg-success', 'text-white'];
        case 'PENDING': return ['bg-warning', 'text-dark'];
        case 'CANCELLED': return ['bg-danger', 'text-white'];
        case 'COMPLETED': return ['bg-info', 'text-white'];
        default: return ['bg-secondary', 'text-white'];
    }
}

// Manejar la selección de una fecha en el calendario
function handleDateSelect(selectInfo) {
    if (!selectedBranchId) {
        Swal.fire({
            icon: 'warning',
            title: 'No hay sede seleccionada',
            text: 'Por favor, selecciona una sede antes de ver detalles del día.'
        });
        return;
    }
    
    // Obtener la fecha seleccionada
    const selectedDate = selectInfo.startStr;
    console.log("Fecha seleccionada en el calendario:", selectedDate);
    
    // Cargar detalles para la fecha seleccionada
    loadDayDetails(selectedBranchId, selectedDate);
}

// Manejar el clic en un evento del calendario
function handleEventClick(eventInfo) {
    console.log("Evento clickeado:", eventInfo.event.title);
    const reservation = {
        id: eventInfo.event.id,
        date: eventInfo.event.start.toISOString().split('T')[0],
        time: eventInfo.event.start.toTimeString().substring(0, 8),
        people: eventInfo.event.extendedProps.people,
        customerName: eventInfo.event.extendedProps.customerName,
        customerEmail: eventInfo.event.extendedProps.customerEmail || '',
        comments: eventInfo.event.extendedProps.comments || '',
        status: eventInfo.event.extendedProps.status,
        tableNumber: eventInfo.event.extendedProps.tableNumber
    };
    
    showReservationDetails(reservation);
}

// Cargar detalles de un día específico
async function loadDayDetails(branchId, date) {
    if (!branchId) {
        showError('Error', 'No se ha seleccionado ninguna sede');
        return;
    }
    
    // Validar que branchId sea un número
    if (isNaN(parseInt(branchId))) {
        console.error('Error: branchId debe ser un número', branchId);
        Swal.fire({
            icon: 'error',
            title: 'Error de parámetro',
            text: 'ID de sede inválido. Debe ser un valor numérico.'
        });
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        // Asegurarse de que la fecha esté en el formato correcto YYYY-MM-DD
        const formattedDate = date.split('T')[0];
        
        // Usar el formato de fecha correcto según la API y validar branchId como número
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/branch/${parseInt(branchId)}?date=${formattedDate}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Respuesta de detalles del día recibida:", response.status);
        const data = await response.json();
        console.log("Datos del día recibidos:", data.success, "Cantidad:", data.data?.length || 0);
        
        if (response.ok && data.success) {
            // Obtener información de la sucursal
            const branch = branches.find(b => b.id.toString() === branchId.toString());
            
            if (!branch) {
                showError('Error', 'No se encontró información de la sede');
                return;
            }
            
            // Construir objeto con los datos para renderizar
            const dayData = {
                totalCapacity: branch.maxCapacity,
                usedCapacity: data.data.reduce((sum, res) => sum + res.numGuests, 0),
                slots: generateTimeSlots(data.data, branch)
            };
            
            renderDayDetails(dayData, formattedDate);
        } else {
            console.error("Error en la respuesta de detalles del día:", data.message);
            showError('Error al cargar los detalles del día:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar los detalles del día:', error);
        showError('Error de conexión', 'No se pudieron cargar los detalles. Verifica tu conexión a internet.');
    }
}

// Generar slots de tiempo a partir de las reservas
function generateTimeSlots(reservations, branch) {
    // Obtener horarios de la sede para el día
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date(today).toLocaleString('en-us', {weekday: 'long'}).toUpperCase();
    
    // Buscar el horario para el día de hoy entre los businessHours de la sede
    const todaySchedule = branch.businessHours?.find(hour => hour.dayOfWeek === dayOfWeek);
    
    // Horarios predeterminados si no hay información específica
    const openingTime = todaySchedule?.openingTime || branch.openingTime || "08:00:00";
    const closingTime = todaySchedule?.closingTime || branch.closingTime || "22:00:00";
    
    // Crear slots de 30 minutos entre el horario de apertura y cierre
    const slots = [];
    let currentTime = new Date(`2000-01-01T${openingTime}`);
    const endTime = new Date(`2000-01-01T${closingTime}`);
    
    while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().substring(0, 8);
        
        // Buscar reservas para este horario
        const reservationsAtTime = reservations.filter(r => r.startTime.substring(0, 5) === timeString.substring(0, 5));
        
        // Calcular capacidad utilizada para este slot
        const usedCapacity = reservationsAtTime.reduce((sum, r) => sum + r.numGuests, 0);
        
        // Capacidad total estimada por slot (20% de la capacidad máxima por hora)
        const totalCapacityPerSlot = Math.round(branch.maxCapacity * 0.2);
        
        slots.push({
            time: timeString,
            available: usedCapacity < totalCapacityPerSlot,
            totalCapacity: totalCapacityPerSlot,
            remainingCapacity: totalCapacityPerSlot - usedCapacity,
            reservations: reservationsAtTime
        });
        
        // Avanzar 30 minutos
        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
}

// Renderizar detalles del día
function renderDayDetails(data, date) {
    const dayDetailsCard = document.getElementById('dayDetailsCard');
    const selectedDateTitle = document.getElementById('selectedDateTitle');
    const hourSlots = document.getElementById('hourSlots');
    const remainingCapacity = document.getElementById('remainingCapacity');
    const totalCapacity = document.getElementById('totalCapacity');
    const occupancyPercentage = document.getElementById('occupancyPercentage');
    const capacityProgressBar = document.getElementById('capacityProgressBar');
    
    // Actualizar título
    selectedDateTitle.innerHTML = `<i class="bi bi-clock me-2"></i>Detalles para ${formatDate(date)}`;
    
    // Actualizar información de capacidad
    const totalCap = data.totalCapacity || 0;
    const usedCap = data.usedCapacity || 0;
    const remainingCap = totalCap - usedCap;
    const percentage = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;
    
    remainingCapacity.textContent = remainingCap;
    totalCapacity.textContent = totalCap;
    occupancyPercentage.textContent = `${percentage}%`;
    
    // Actualizar barra de progreso
    capacityProgressBar.style.width = `${percentage}%`;
    
    if (percentage >= 90) {
        capacityProgressBar.classList.remove('info', 'warning');
        capacityProgressBar.classList.add('danger');
    } else if (percentage >= 70) {
        capacityProgressBar.classList.remove('info', 'danger');
        capacityProgressBar.classList.add('warning');
    } else {
        capacityProgressBar.classList.remove('warning', 'danger');
        capacityProgressBar.classList.add('info');
    }
    
    // Limpiar y actualizar slots de hora
    hourSlots.innerHTML = '';
    
    if (data.slots && data.slots.length > 0) {
        data.slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `hour-slot ${slot.available ? 'available' : 'reserved'}`;
            
            let reservationsInfo = '';
            if (slot.reservations && slot.reservations.length > 0) {
                reservationsInfo = `

                    <div class="small mt-2">
                        <strong>Reservas:</strong> ${slot.reservations.length}
                        (${slot.reservations.reduce((total, r) => total + (r.people || 0), 0)} personas)
                    </div>
                    <div class="small">
                        ${slot.reservations.map(r => `
                            <span class="badge ${getStatusBadgeClass(r.status)} me-1">
                                ${r.id.substring(0, 6)} - ${r.customerName} (${r.people} pers.)
                            </span>
                        `).join('')}
                    </div>
                `;
            }
            
            slotElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold">${formatTime(slot.time)}</span>
                        <span class="text-muted ms-2">(${slot.available ? 'Disponible' : 'Reservado'})</span>
                    </div>
                    <div>
                        <span class="badge bg-${slot.available ? 'success' : 'danger'} rounded-pill">
                            ${slot.remainingCapacity}/${slot.totalCapacity} libres
                        </span>
                    </div>
                </div>
                ${reservationsInfo}
            `;
            
            hourSlots.appendChild(slotElement);
        });
    } else {
        hourSlots.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-calendar-x text-muted" style="font-size: 2rem;"></i>
                <p class="mt-3 mb-0 text-muted">No hay horarios disponibles para este día</p>
            </div>
        `;
    }
    
    // Mostrar la tarjeta
    dayDetailsCard.style.display = 'block';
}

// Mostrar detalles de una reserva
function showReservationDetails(reservation) {
    const modal = new bootstrap.Modal(document.getElementById('reservationDetailsModal'));
    
    // Preparar la información para mostrarla en el modal
    const reservationId = String(reservation.id); // Convertir a string para evitar errores
    
    // Si ID es numérico, mostrar los primeros 4 dígitos, de lo contrario mostrar los primeros 8 caracteres
    const displayId = !isNaN(reservationId) 
        ? reservationId.substring(0, 4) 
        : (typeof reservationId === 'string' && reservationId.length > 8) 
            ? reservationId.substring(0, 8) 
            : reservationId;
    
    document.getElementById('reservationId').textContent = displayId;
    document.getElementById('reservationDate').textContent = formatDate(reservation.date);
    document.getElementById('reservationTime').textContent = formatTime(reservation.time);
    document.getElementById('reservationPeople').textContent = `${reservation.people} personas`;
    document.getElementById('reservationTable').textContent = reservation.tableNumber || 'No asignada';
    document.getElementById('reservationName').textContent = reservation.customerName;
    document.getElementById('reservationEmail').textContent = reservation.customerEmail || 'No disponible';
    document.getElementById('reservationComments').textContent = reservation.comments || 'Sin comentarios';
    
    // Mostrar el estado actual
    const statusBadge = document.getElementById('reservationStatus');
    statusBadge.textContent = getStatusLabel(reservation.status);
    statusBadge.className = `badge ${getStatusBadgeClass(reservation.status)}`;
    
    // Actualizar botones de acción según el estado
    const confirmBtn = document.getElementById('confirmReservationBtn');
    const cancelBtn = document.getElementById('cancelReservationBtn');
    
    if (reservation.status === 'PENDING') {
        confirmBtn.style.display = 'block';
        cancelBtn.style.display = 'block';
    } else if (reservation.status === 'CONFIRMED') {
        confirmBtn.style.display = 'none';
        cancelBtn.style.display = 'block';
    } else {
        confirmBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }
    
    // Configurar eventos para los botones
    confirmBtn.onclick = () => updateReservationStatus(reservation.id, 'CONFIRMED');
    cancelBtn.onclick = () => updateReservationStatus(reservation.id, 'CANCELLED');
    
    // Mostrar el modal
    modal.show();
}

// Actualizar el estado de una reserva
async function updateReservationStatus(reservationId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        
        // Usar el endpoint correcto para actualizar el estado de una reserva
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/${reservationId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `La reserva ha sido ${newStatus === 'CONFIRMED' ? 'confirmada' : 'cancelada'} exitosamente.`
            });
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reservationDetailsModal'));
            modal.hide();
            
            // Recargar las reservas
            if (selectedBranchId) {
                loadReservationsForBranch(selectedBranchId);
            }
        } else {
            showError('Error al actualizar el estado:', data.message);
        }
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        showError('Error de conexión', 'No se pudo actualizar el estado. Verifica tu conexión a internet.');
    }
}

// Funciones de utilidad
function getStatusColor(status) {
    switch (status) {
        case 'CONFIRMED': return '#28a745'; // Verde
        case 'PENDING': return '#ffc107'; // Amarillo
        case 'CANCELLED': return '#dc3545'; // Rojo
        default: return '#6c757d'; // Gris
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'CONFIRMED': return 'Confirmada';
        case 'PENDING': return 'Pendiente';
        case 'CANCELLED': return 'Cancelada';
        default: return 'Desconocido';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'CONFIRMED': return 'bg-success';
        case 'PENDING': return 'bg-warning text-dark';
        case 'CANCELLED': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function getBranchName(branchId) {
    const branch = branches.find(b => b.id.toString() === branchId.toString());
    return branch ? branch.name : 'Sede desconocida';
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
}

// Mostrar mensaje de error
function showError(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        showConfirmButton: true
    });
}

// Inicializar el mapa con Leaflet
function initializeMap() {
    try {
        console.log("Inicializando mapa...");
        // Verificar si el elemento del mapa existe
        const mapElement = document.getElementById('branchesMap');
        if (!mapElement) {
            console.error("No se encontró el elemento del mapa 'branchesMap'");
            return;
        }

        // Inicializar el mapa con una posición predeterminada (Bogotá)
        branchesMap = L.map('branchesMap').setView([4.6097, -74.0817], 11);
        
        // Añadir la capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(branchesMap);
        
        console.log("Mapa inicializado correctamente");
        
        // Asegurar que el mapa se renderice correctamente
        setTimeout(() => {
            if (branchesMap) {
                branchesMap.invalidateSize();
                console.log("Tamaño del mapa invalidado/actualizado");
            }
        }, 500);
    } catch (error) {
        console.error("Error al inicializar el mapa:", error);
    }
}

// Añadir marcadores de las sedes al mapa
function addBranchesToMap(branches) {
    try {
        console.log("Intentando añadir marcadores al mapa...");
        
        // Verificar si el mapa está inicializado
        if (!branchesMap) {
            console.error("El mapa no está inicializado, intentando inicializarlo...");
            initializeMap();
            
            // Si aún no se ha inicializado, salir de la función
            if (!branchesMap) {
                console.error("No se pudo inicializar el mapa. No se añadirán marcadores.");
                return;
            }
        }
        
        // Limpiar marcadores existentes
        if (markers && markers.length > 0) {
            console.log("Limpiando marcadores existentes...");
            markers.forEach(marker => {
                if (marker && branchesMap) {
                    branchesMap.removeLayer(marker);
                }
            });
        }
        
        // Reiniciar el array de marcadores
        markers = [];
        
        // Comprobar si hay sedes para añadir
        if (!branches || branches.length === 0) {
            console.warn("No hay sedes para añadir al mapa");
            return;
        }
        
        console.log(`Añadiendo ${branches.length} marcadores al mapa...`);
        
        // Crear un grupo de límites para ajustar la vista del mapa
        const bounds = L.latLngBounds();
        
        // Añadir marcadores para cada sede
        branches.forEach(branch => {
            if (branch.latitude && branch.longitude) {
                try {
                    const lat = parseFloat(branch.latitude);
                    const lng = parseFloat(branch.longitude);
                    
                    if (isNaN(lat) || isNaN(lng)) {
                        console.warn(`Coordenadas inválidas para la sede ${branch.id}: ${branch.latitude}, ${branch.longitude}`);
                        return;
                    }
                    
                    console.log(`Añadiendo marcador para sede ${branch.id} en ${lat}, ${lng}`);
                    
                    // Crear un marcador para la sede
                    const marker = L.marker([lat, lng])
                        .bindPopup(`
                            <div class="popup-content">
                                <h5>${branch.name}</h5>
                                <p>${branch.address}</p>
                                <button class="btn btn-primary btn-sm select-branch-btn" data-id="${branch.id}">
                                    Seleccionar sede
                                </button>
                            </div>
                        `);
                    
                    // Añadir el marcador al mapa
                    marker.addTo(branchesMap);
                    
                    // Añadir eventos al popup
                    marker.on('popupopen', () => {
                        const selectButton = document.querySelector('.select-branch-btn');
                        if (selectButton) {
                            selectButton.addEventListener('click', () => {
                                selectBranch(selectButton.dataset.id);
                            });
                        }
                    });
                    
                    // Añadir el marcador al array
                    markers.push(marker);
                    
                    // Extender los límites para incluir este marcador
                    bounds.extend([lat, lng]);
                } catch (markerError) {
                    console.error(`Error al añadir marcador para sede ${branch.id}:`, markerError);
                }
            } else {
                console.warn(`La sede ${branch.id} no tiene coordenadas válidas`);
            }
        });
        
        // Ajustar la vista del mapa si hay marcadores
        if (markers.length > 0 && bounds.isValid()) {
            console.log("Ajustando la vista del mapa a los marcadores");
            branchesMap.fitBounds(bounds, { padding: [50, 50] });
        }
        
        console.log(`Se añadieron ${markers.length} marcadores al mapa`);
    } catch (error) {
        console.error("Error al añadir marcadores al mapa:", error);
    }
}

// Modificación de la función centerMapOnBranch
function centerMapOnBranch(branch) {
    try {
        console.log("Intentando centrar el mapa en la sede seleccionada");
        
        // Verificar si el mapa está inicializado
        if (!branchesMap) {
            console.error("El mapa no está inicializado, intentando inicializarlo...");
            initializeMap();
            
            // Si aún no se ha inicializado, salir de la función
            if (!branchesMap) {
                console.error("No se pudo inicializar el mapa. No se centrará en ninguna sede.");
                return;
            }
        }
        
        // Verificar que branch sea un objeto y tenga coordenadas
        if (!branch || typeof branch !== 'object') {
            console.error("No se proporcionó un objeto de sede válido");
            return;
        }
        
        // Obtener coordenadas de la sede
        const lat = parseFloat(branch.latitude);
        const lng = parseFloat(branch.longitude);
        
        // Verificar que las coordenadas sean válidas
        if (isNaN(lat) || isNaN(lng)) {
            console.error(`Coordenadas inválidas para la sede: ${branch.latitude}, ${branch.longitude}`);
            return;
        }
        
        console.log(`Centrando mapa en sede ${branch.id} (${lat}, ${lng})`);
        
        // Centrar el mapa en la ubicación de la sede
        branchesMap.setView([lat, lng], 15);
        
        // Buscar y abrir el popup del marcador correspondiente
        markers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
                marker.openPopup();
            }
        });
        
        console.log("Mapa centrado correctamente");
    } catch (error) {
        console.error("Error al centrar el mapa:", error);
    }
}

// Seleccionar una sede
function selectBranch(branchId) {
    console.log("Seleccionando sede:", branchId);
    // Actualizar la variable global de sede seleccionada
    selectedBranchId = branchId;
    
    // Marcar visualmente la sede seleccionada en la lista
    document.querySelectorAll('.branch-item').forEach(item => {
        if (item.getAttribute('data-id') == branchId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Limpiar el calendario
    if (calendar) {
        calendar.getEvents().forEach(event => event.remove());
    }
    
    // Centrar el mapa en la sede seleccionada
    const branch = branches.find(b => b.id == branchId);
    if (branch && branch.latitude && branch.longitude) {
        console.log("Centrando mapa en sede:", branch.name);
        centerMapOnBranch(branch);
    }
    
    // Cargar las reservas para esta sede
    loadReservationsForBranch(branchId);
    
    // Actualizar el título de la sección
    const branchNameElement = document.getElementById('selected-branch-name');
    if (branchNameElement && branch) {
        branchNameElement.textContent = branch.name;
    }
}

// Inicializar el calendario FullCalendar
function initializeCalendar() {
    console.log("Inicializando calendario");
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error("No se encontró el elemento del calendario (#calendar)");
        return;
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista'
        },
        events: [],
        selectable: true,
        select: handleDateSelect,
        eventClick: handleEventClick,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }
    });
    
    calendar.render();
}
