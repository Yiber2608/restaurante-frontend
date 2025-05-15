// Variables globales
let branches = [];
let locationMap;
let markers = [];
let selectedBranchId = null;
let selectedTableId = null;
let selectedDate = null;
let selectedTime = null;
let datePicker;
let reservationDetails = {};
let availableTables = [];

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeSteps();
    initializeMap();
    loadBranches();
    initializeDatePicker();
    setupFormListeners();
    initializeSidebar();
    
    // Comprobar si hay un usuario autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        // Redireccionar a login o mostrar modal de login
        Swal.fire({
            title: 'Iniciar sesión',
            text: 'Debes iniciar sesión para realizar una reserva.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Iniciar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'index.html';
            }
        });
    } else {
        // Precargar información del usuario
        loadUserInfo();
    }
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

// Inicializar la visualización por pasos
function initializeSteps() {
    // Mostrar solo el primer paso
    document.getElementById('step1Content').style.display = 'block';
    document.getElementById('step2Content').style.display = 'none';
    document.getElementById('step3Content').style.display = 'none';
    document.getElementById('step4Content').style.display = 'none';
    
    // Configurar el primer paso como activo
    document.getElementById('step1').classList.add('active');
    
    // Configurar botones de navegación
    document.getElementById('nextToStep2').addEventListener('click', function() {
        goToStep(2);
        loadTablesForBranch(selectedBranchId);
    });
    
    document.getElementById('backToStep1').addEventListener('click', function() {
        goToStep(1);
    });
    
    document.getElementById('nextToStep3').addEventListener('click', function() {
        goToStep(3);
        loadAvailableDates();
    });
    
    document.getElementById('backToStep2').addEventListener('click', function() {
        goToStep(2);
    });
    
    document.getElementById('nextToStep4').addEventListener('click', function() {
        goToStep(4);
        updateReservationSummary();
    });
    
    document.getElementById('backToStep3').addEventListener('click', function() {
        goToStep(3);
    });
    
    document.getElementById('confirmReservation').addEventListener('click', function() {
        submitReservation();
    });

    // Configurar el checkbox de términos
    document.getElementById('termsCheckbox').addEventListener('change', function() {
        document.getElementById('confirmReservation').disabled = !this.checked;
    });
}

// Navegar a un paso específico
function goToStep(stepNumber) {
    // Ocultar todos los contenidos
    document.getElementById('step1Content').style.display = 'none';
    document.getElementById('step2Content').style.display = 'none';
    document.getElementById('step3Content').style.display = 'none';
    document.getElementById('step4Content').style.display = 'none';
    
    // Desmarcar todos los pasos
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step4').classList.remove('active');
    
    // Mostrar el paso actual y marcarlo como activo
    document.getElementById('step' + stepNumber + 'Content').style.display = 'block';
    document.getElementById('step' + stepNumber).classList.add('active');
    
    // Si vamos al paso 1, actualizamos el mapa (puede haber cambiado de tamaño)
    if (stepNumber === 1 && locationMap) {
        setTimeout(() => locationMap.invalidateSize(), 100);
    }
    
    // Añadir animación
    document.getElementById('step' + stepNumber + 'Content').classList.add('animate__fadeIn');
    setTimeout(() => {
        document.getElementById('step' + stepNumber + 'Content').classList.remove('animate__fadeIn');
    }, 1000);
}

// Configurar eventos del formulario
function setupFormListeners() {
    // Establecer eventos para la confirmación final
    document.getElementById('termsCheckbox').addEventListener('change', function() {
        document.getElementById('confirmReservation').disabled = !this.checked;
    });
    
    document.getElementById('confirmReservation').addEventListener('click', function() {
        submitReservation();
    });
    
    // Evento cambio en campos para actualizar resumen
    document.getElementById('specialRequests').addEventListener('input', function() {
        if (selectedBranchId && selectedTableId && selectedDate && selectedTime) {
            updateReservationSummary();
        }
    });
}

// Inicializar mapa
function initializeMap() {
    locationMap = L.map('locationMap').setView([4.6097, -74.0817], 13); // Bogotá por defecto
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(locationMap);
    
    // Actualizar mapa cuando cambie de tamaño
    setTimeout(function() {
        locationMap.invalidateSize();
    }, 400);
}

// Cargar sedes
async function loadBranches() {
    const token = localStorage.getItem('token');
    try {
        // Mostrar indicador de carga
        document.getElementById('branchCards').innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2">Cargando sedes...</p></div>';
        
        const response = await fetch(`${window.API_BASE_URL}/api/v1/branches`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar las sedes');
        }
        
        const result = await response.json();
        if (result.success) {
            branches = result.data;
            renderBranchCards(branches);
            addBranchesToMap(branches);
            
            // Configurar buscador
            setupBranchSearch();
        } else {
            throw new Error(result.message || 'Error al cargar las sedes');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('branchCards').innerHTML = '<div class="alert alert-danger">Error al cargar las sedes. Por favor, intenta de nuevo.</div>';
    }
}

// Renderizar tarjetas de sedes
function renderBranchCards(branchList) {
    const branchCardsContainer = document.getElementById('branchCards');
    branchCardsContainer.innerHTML = '';
    
    if (branchList.length === 0) {
        branchCardsContainer.innerHTML = '<div class="alert alert-info">No hay sedes disponibles</div>';
        return;
    }
    
    branchList.forEach(branch => {
        const card = document.createElement('div');
        card.className = 'card mb-2 branch-card';
        if (branch.id === selectedBranchId) {
            card.classList.add('border-primary');
        }
        
        const statusClass = branch.status === 'OPEN' ? 'bg-success' : 'bg-danger';
        const statusText = branch.status === 'OPEN' ? 'Abierto' : 'Cerrado';
        
        card.innerHTML = `
            <div class="card-body py-2">
                <div class="d-flex align-items-center justify-content-between">
                    <h6 class="card-title mb-0">${branch.name}</h6>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <p class="card-text small mb-1">${branch.address}</p>
                <p class="card-text small text-muted mb-0">
                    <i class="bi bi-telephone"></i> ${branch.phone || 'No disponible'}
                </p>
            </div>
        `;
        
        card.addEventListener('click', function() {
            // Deseleccionar todas las tarjetas
            document.querySelectorAll('.branch-card').forEach(card => {
                card.classList.remove('border-primary');
            });
            
            // Seleccionar esta tarjeta
            this.classList.add('border-primary');
            selectedBranchId = branch.id;
            
            // Centrar mapa en esta sede
            locationMap.setView([branch.latitude, branch.longitude], 16);
            
            // Habilitar botón siguiente
            document.getElementById('nextToStep2').disabled = false;
        });
        
        branchCardsContainer.appendChild(card);
    });
}

// Añadir sedes al mapa
function addBranchesToMap(branchList) {
    // Limpiar marcadores anteriores
    markers.forEach(marker => locationMap.removeLayer(marker));
    markers = [];
    
    // Límites para ajustar el mapa
    const bounds = L.latLngBounds();
    
    branchList.forEach(branch => {
        if (branch.latitude && branch.longitude) {
            const marker = L.marker([branch.latitude, branch.longitude])
                .addTo(locationMap)
                .bindPopup(`
                    <strong>${branch.name}</strong><br>
                    ${branch.address}<br>
                    <span class="badge ${branch.status === 'OPEN' ? 'bg-success' : 'bg-danger'}">
                        ${branch.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                    </span>
                `);
                
            marker.on('click', function() {
                selectedBranchId = branch.id;
                
                // Actualizar tarjetas
                document.querySelectorAll('.branch-card').forEach(card => {
                    card.classList.remove('border-primary');
                });
                
                const branchCards = document.querySelectorAll('.branch-card');
                for (let i = 0; i < branchCards.length; i++) {
                    if (branchCards[i].querySelector('.card-title').textContent === branch.name) {
                        branchCards[i].classList.add('border-primary');
                        branchCards[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
                
                // Habilitar botón siguiente
                document.getElementById('nextToStep2').disabled = false;
            });
            
            markers.push(marker);
            bounds.extend([branch.latitude, branch.longitude]);
        }
    });
    
    // Ajustar el mapa si hay marcadores
    if (markers.length > 0) {
        locationMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Configurar buscador de sedes
function setupBranchSearch() {
    const searchInput = document.getElementById('searchBranch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            renderBranchCards(branches);
            addBranchesToMap(branches);
            return;
        }
        
        const filteredBranches = branches.filter(branch => {
            return branch.name.toLowerCase().includes(searchTerm) || 
                branch.address.toLowerCase().includes(searchTerm);
        });
        
        renderBranchCards(filteredBranches);
        addBranchesToMap(filteredBranches);
    });
}

// Cargar las mesas disponibles para una sede
async function loadTablesForBranch(branchId) {
    const token = localStorage.getItem('token');
    try {
        // Actualizar información de la sede
        updateSelectedBranchInfo();
        
        const response = await fetch(`${window.API_BASE_URL}/api/tables/branch/${branchId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar las mesas');
        }
        
        const result = await response.json();
        if (result.success) {
            const branchData = result.data;
            availableTables = branchData.tables;
            
            renderTables(branchData);
        } else {
            throw new Error(result.message || 'Error al cargar las mesas');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las mesas. Por favor, intente más tarde.'
        });
    }
}

// Inicializar el selector de fechas
function initializeDatePicker() {
    datePicker = flatpickr("#datepicker", {
        locale: "es",
        minDate: "today",
        dateFormat: "Y-m-d",
        maxDate: new Date().fp_incr(30), // Permite reservar hasta 30 días en el futuro
        disable: [
            function(date) {
                // Desactivar días que están completamente ocupados (implementar lógica según API)
                return false;
            }
        ],
        onChange: function(selectedDates, dateStr) {
            selectedDate = dateStr;
            loadAvailableTimeSlots(selectedDate);
        }
    });
}

// Cargar fechas disponibles
function loadAvailableDates() {
    // Esta función puede consultar a la API para obtener fechas disponibles
    // Por ahora simplemente reiniciamos el datepicker
    if (datePicker) {
        datePicker.setDate([]);
    }
    
    // Limpiar slots de horarios
    document.getElementById('timeSlots').innerHTML = '';
    
    // Desactivar botón siguiente hasta que se seleccione fecha y hora
    document.getElementById('nextToStep4').disabled = true;
}

// Cargar horarios disponibles para una fecha
function loadAvailableTimeSlots(selectedDate) {
    // Horarios disponibles (idealmente esto vendría de la API)
    const availableHours = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
    
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';
    
    // Generar botones de horarios
    availableHours.forEach(time => {
        const timeButton = document.createElement('button');
        timeButton.type = 'button';
        timeButton.className = 'btn btn-outline-primary m-1';
        timeButton.dataset.time = time;
        timeButton.textContent = time;
        
        // Añadir evento de clic
        timeButton.addEventListener('click', function() {
            // Deseleccionar todos los botones
            document.querySelectorAll('#timeSlots button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Seleccionar este botón
            this.classList.add('active');
            selectedTime = time;
            
            // Habilitar botón siguiente
            document.getElementById('nextToStep4').disabled = false;
        });
        
        timeSlotsContainer.appendChild(timeButton);
    });
}

// Actualizar información de la sede seleccionada
function updateSelectedBranchInfo() {
    const branch = branches.find(b => b.id === selectedBranchId);
    if (!branch) return;
    
    document.getElementById('branchNameDisplay').textContent = branch.name;
}

// Renderizar mesas disponibles
function renderTables(branchData) {
    const tablesContainer = document.getElementById('tablesList');
    tablesContainer.innerHTML = '';
    
    const capacityPercentage = (branchData.currentTablesCapacity / branchData.maxBranchCapacity) * 100;
    document.getElementById('capacityProgress').style.width = `${capacityPercentage}%`;
    document.getElementById('capacityText').textContent = `${branchData.currentTablesCapacity}/${branchData.maxBranchCapacity} capacidad`;
    
    const selectedGuestCount = parseInt(document.getElementById('guestCount').value);
    
    // Filtrar mesas por capacidad y estado
    let filteredTables = branchData.tables.filter(table => {
        return table.capacity >= selectedGuestCount && table.status === 'AVAILABLE';
    });
    
    if (filteredTables.length === 0) {
        tablesContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No hay mesas disponibles para el número de personas seleccionado</div></div>';
        document.getElementById('nextToStep3').disabled = true;
        return;
    }
    
    // Ordenar mesas por capacidad (más cercana al número de personas)
    filteredTables.sort((a, b) => a.capacity - b.capacity);
    
    filteredTables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = 'col-md-3 col-sm-6';
        
        let statusClass = 'bg-success';
        if (table.status === 'OCCUPIED') statusClass = 'bg-danger';
        if (table.status === 'RESERVED') statusClass = 'bg-warning';
        
        tableCard.innerHTML = `
            <div class="card table-card h-100 ${table.id === selectedTableId ? 'border-primary' : ''}" data-table-id="${table.id}">
                <div class="card-header ${statusClass} text-white d-flex justify-content-between align-items-center py-2">
                    <h6 class="mb-0">Mesa ${table.tableNumber}</h6>
                    <span class="badge bg-light text-dark">${table.capacity} personas</span>
                </div>
                <div class="card-body text-center">
                    <img src="./assets/img/mesa.png" alt="Mesa" class="img-fluid" style="max-height: 100px;">
                    <p class="mt-2 mb-0">Ubicación: ${table.location}</p>
                </div>
            </div>
        `;
        
        tablesContainer.appendChild(tableCard);
        
        // Añadir evento de clic para seleccionar la mesa
        tableCard.querySelector('.table-card').addEventListener('click', function() {
            if (table.status === 'AVAILABLE') {
                // Deseleccionar todas las mesas
                document.querySelectorAll('.table-card').forEach(card => {
                    card.classList.remove('border-primary');
                });
                
                // Seleccionar esta mesa
                this.classList.add('border-primary');
                selectedTableId = table.id;
                
                // Habilitar botón siguiente
                document.getElementById('nextToStep3').disabled = false;
            }
        });
    });
    
    // Actualizar el filtro por número de personas
    document.getElementById('guestCount').addEventListener('change', function() {
        renderTables(branchData);
    });
}

// Actualizar resumen de reserva
function updateReservationSummary() {
    const branch = branches.find(b => b.id === selectedBranchId);
    if (!branch) return;
    
    const selectedTable = availableTables.find(table => table.id === selectedTableId);
    const guestCount = document.getElementById('guestCount').value;
    
    const summaryHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-building me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Sede</h6>
                        <p class="mb-0">${branch.name}</p>
                    </div>
                </div>
            </div>
            <div class="col-12 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-geo-alt me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Dirección</h6>
                        <p class="mb-0">${branch.address}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-table me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Mesa</h6>
                        <p class="mb-0">Mesa ${selectedTable ? selectedTable.tableNumber : 'No especificada'}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-people me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Personas</h6>
                        <p class="mb-0">${guestCount} ${guestCount == 1 ? 'persona' : 'personas'}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-calendar-date me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Fecha</h6>
                        <p class="mb-0">${formatDate(selectedDate)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-clock me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-0">Hora</h6>
                        <p class="mb-0">${selectedTime}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('reservationSummary').innerHTML = summaryHTML;
    
    // Guardar detalles para el envío
    reservationDetails = {
        branchId: selectedBranchId,
        reservationDate: selectedDate,
        startTime: `${selectedTime}:00`,
        endTime: calculateEndTime(selectedDate, selectedTime, 120), // 2 horas de duración por defecto
        numGuests: parseInt(guestCount),
        specialRequests: document.getElementById('specialRequests').value || 'Ninguna',
        preferredTableId: selectedTableId
    };
}

// Calcular hora de fin basada en la duración
function calculateEndTime(date, startTime, durationMinutes) {
    const startDateTime = new Date(`${date}T${startTime}:00`);
    startDateTime.setMinutes(startDateTime.getMinutes() + durationMinutes);
    
    const hours = startDateTime.getHours().toString().padStart(2, '0');
    const minutes = startDateTime.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:00`;
}

// Validar formulario de reserva
function validateReservationForm() {
    if (!selectedBranchId) {
        showError('Error', 'Debe seleccionar una sede');
        return false;
    }
    
    if (!selectedTableId) {
        showError('Error', 'Debe seleccionar una mesa');
        return false;
    }
    
    if (!selectedDate) {
        showError('Error', 'Debe seleccionar una fecha');
        return false;
    }
    
    if (!selectedTime) {
        showError('Error', 'Debe seleccionar una hora');
        return false;
    }
    
    if (!document.getElementById('termsCheckbox').checked) {
        showError('Error', 'Debe aceptar los términos y condiciones');
        return false;
    }
    
    return true;
}

// Enviar reserva al servidor
let isSubmitting = false; // Variable para evitar envíos múltiples

async function submitReservation() {
    // Evitar múltiples envíos
    if (isSubmitting) return;
    
    if (!validateReservationForm()) return;
    
    // Marcar como en proceso de envío
    isSubmitting = true;
    
    // Deshabilitar botón para evitar doble clic
    const submitButton = document.getElementById('confirmReservation');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
    }
    
    const token = localStorage.getItem('token');
    try {
        // Obtener el ID del usuario desde el token
        const payload = jwt_decode(token);
        const userId = payload.userId;
        
        // Mostrar notificación de carga
        Swal.fire({
            title: 'Procesando',
            text: 'Enviando su reserva...',
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/user/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reservationDetails)
        });
        
        if (!response.ok) {
            throw new Error('Error al crear la reserva');
        }
        
        const result = await response.json();
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Reserva creada!',
                text: 'Su reserva ha sido confirmada exitosamente.',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                window.location.href = 'user-dashboard.html';
            });
        } else {
            throw new Error(result.message || 'Error al crear la reserva');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo crear la reserva. Por favor, intente más tarde.'
        });
        
        // Restaurar el botón en caso de error
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Confirmar Reserva';
        }
        
        // Restaurar la variable de control
        isSubmitting = false;
    }
}

// Cargar información del usuario
async function loadUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const payload = jwt_decode(token);
        document.getElementById('username').textContent = payload.name || 'Usuario';
    } catch (error) {
        console.error('Error decodificando token:', error);
    }
}

// Funciones de utilidad
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function showError(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message
    });
}

// Obtener nombre de una sede por su ID
function getBranchName(branchId) {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Desconocida';
}