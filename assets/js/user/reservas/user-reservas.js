// Variables globales
let branches = [];
let locationMap;
let markers = [];
let selectedBranchId = null;
let selectedDate = null;
let selectedTime = null;
let datePicker;
let reservationDetails = {};

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeSteps();
    initializeMap();
    loadBranches();
    initializeDatePicker();
    setupFormListeners();
    
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
                window.location.href = 'login.html?redirect=user-reserva.html';
            } else {
                window.location.href = 'index.html';
            }
        });
    } else {
        // Precargar información del usuario
        loadUserInfo();
    }
});

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
        if (!selectedBranchId) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección requerida',
                text: 'Por favor, selecciona una sede para continuar.'
            });
            return;
        }
        
        goToStep(2);
    });
    
    document.getElementById('backToStep1').addEventListener('click', function() {
        goToStep(1);
    });
    
    document.getElementById('nextToStep3').addEventListener('click', function() {
        if (!selectedDate || !selectedTime) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección requerida',
                text: 'Por favor, selecciona una fecha y hora para continuar.'
            });
            return;
        }
        
        goToStep(3);
        updateReservationSummary();
    });
    
    document.getElementById('backToStep2').addEventListener('click', function() {
        goToStep(2);
    });
    
    document.getElementById('nextToStep4').addEventListener('click', function() {
        if (!validateReservationForm()) {
            return;
        }
        
        submitReservation();
    });
}

// Navegar a un paso específico
function goToStep(step) {
    // Ocultar todos los contenidos de paso
    document.getElementById('step1Content').style.display = 'none';
    document.getElementById('step2Content').style.display = 'none';
    document.getElementById('step3Content').style.display = 'none';
    document.getElementById('step4Content').style.display = 'none';
    
    // Quitar clase activa de todos los pasos
    document.querySelectorAll('.step').forEach(item => {
        item.classList.remove('active', 'completed');
    });
    
    // Marcar pasos previos como completados
    for (let i = 1; i < step; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    // Marcar paso actual como activo
    document.getElementById(`step${step}`).classList.add('active');
    
    // Mostrar contenido del paso actual
    document.getElementById(`step${step}Content`).style.display = 'block';
    
    // Acciones específicas para cada paso
    if (step === 2) {
        if (locationMap) {
            setTimeout(() => {
                locationMap.invalidateSize();
            }, 100);
        }
        
        updateSelectedBranchInfo();
        loadAvailableDates();
    } else if (step === 3) {
        updateReservationSummary();
    }
}

// Inicializar el mapa con Leaflet
function initializeMap() {
    locationMap = L.map('locationMap').setView([4.6097, -74.0817], 11); // Bogotá por defecto
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(locationMap);
    
    // Asegurar que el mapa se renderice correctamente
    setTimeout(() => {
        locationMap.invalidateSize();
    }, 100);
}

// Cargar sedes desde la API
async function loadBranches() {
    try {
        const loadingHtml = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando sedes...</span>
                </div>
                <p class="mt-3">Cargando sedes disponibles...</p>
            </div>
        `;
        document.getElementById('locationCards').innerHTML = loadingHtml;
        
        console.log("Iniciando carga de sedes disponibles...");
        console.log("URL de API:", window.API_BASE_URL);
        
        // Para sedes disponibles debemos usar /public ya que no requiere autenticación
        const response = await fetch(`${window.API_BASE_URL}/api/v1/branches/public`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Respuesta recibida:", response.status);
        
        const data = await response.json();
        console.log("Datos recibidos:", data);
        
        if (response.ok && data.success) {
            // Filtrar solo sedes activas
            branches = data.data.filter(branch => branch.status === 'ACTIVE');
            console.log(`Sedes activas encontradas: ${branches.length}`);
            
            if (branches.length === 0) {
                document.getElementById('locationCards').innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-building-x text-muted mb-3" style="font-size: 3rem;"></i>
                        <h5>No hay sedes disponibles</h5>
                        <p class="text-muted">En este momento no hay sedes disponibles para reservas.</p>
                    </div>
                `;
            } else {
                renderBranchSummary(branches);
                renderBranchCards(branches);
                addBranchesToMap(branches);
            }
        } else {
            console.error('Error en la respuesta:', data);
            document.getElementById('locationCards').innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                    <h5>Error al cargar sedes</h5>
                    <p class="text-muted">${data.message || 'No se pudieron cargar las sedes disponibles'}</p>
                    <button class="btn btn-outline-primary mt-3" onclick="loadBranches()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
                    </button>
                </div>
            `;
            showError('Error al cargar las sedes', data.message || 'No se pudieron cargar las sedes disponibles');
        }
    } catch (error) {
        console.error('Error al cargar las sedes:', error);
        document.getElementById('locationCards').innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-wifi-off text-muted mb-3" style="font-size: 3rem;"></i>
                <h5>Error de conexión</h5>
                <p class="text-muted">No se pudieron cargar las sedes. Verifica tu conexión a internet.</p>
                <button class="btn btn-outline-primary mt-3" onclick="loadBranches()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
                </button>
            </div>
        `;
        showError('Error de conexión', 'No se pudieron cargar las sedes. Verifica tu conexión a internet.');
    }
}

// Renderizar resumen de sedes disponibles
function renderBranchSummary(branches) {
    const summaryContainer = document.getElementById('branchSummary');
    if (!summaryContainer) return;
    
    // Obtener estadísticas de sedes
    const totalBranches = branches.length;
    const highCapacityBranches = branches.filter(b => b.maxCapacity > 150).length;
    const mediumCapacityBranches = branches.filter(b => b.maxCapacity <= 150 && b.maxCapacity >= 80).length;
    const lowCapacityBranches = branches.filter(b => b.maxCapacity < 80).length;
    
    // Crear contenido HTML para el resumen
    summaryContainer.innerHTML = `
        <div class="row row-cols-2 row-cols-md-4 g-3 mb-4">
            <div class="col">
                <div class="card h-100 border-0 shadow-sm bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-subtitle mb-1 text-muted">Sedes Disponibles</h6>
                                <h2 class="card-title mb-0">${totalBranches}</h2>
                            </div>
                            <div class="icon-shape bg-primary text-white rounded-circle shadow">
                                <i class="bi bi-building"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 border-0 shadow-sm bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-subtitle mb-1 text-muted">Capacidad Alta</h6>
                                <h2 class="card-title mb-0">${highCapacityBranches}</h2>
                            </div>
                            <div class="icon-shape bg-success text-white rounded-circle shadow">
                                <i class="bi bi-people-fill"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 border-0 shadow-sm bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-subtitle mb-1 text-muted">Capacidad Media</h6>
                                <h2 class="card-title mb-0">${mediumCapacityBranches}</h2>
                            </div>
                            <div class="icon-shape bg-warning text-white rounded-circle shadow">
                                <i class="bi bi-people"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 border-0 shadow-sm bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-subtitle mb-1 text-muted">Capacidad Baja</h6>
                                <h2 class="card-title mb-0">${lowCapacityBranches}</h2>
                            </div>
                            <div class="icon-shape bg-danger text-white rounded-circle shadow">
                                <i class="bi bi-person"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar tarjetas de sucursales con scroll vertical
function renderBranchCards(branches) {
    const locationCards = document.getElementById('locationCards');
    locationCards.innerHTML = '';
    
    // Agregar el contenedor de búsqueda y filtro
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container mb-3';
    searchContainer.innerHTML = `
        <div class="input-group">
            <span class="input-group-text bg-white">
                <i class="bi bi-search"></i>
            </span>
            <input type="text" id="branchSearchInput" class="form-control" placeholder="Buscar por nombre, dirección...">
            <button class="btn btn-outline-primary" type="button" id="filterBranchesBtn">
                <i class="bi bi-funnel"></i> Filtros
            </button>
        </div>
        <div id="filterOptions" class="filter-options mt-2 p-3 border rounded bg-light" style="display: none;">
            <div class="row g-2">
                <div class="col-md-4">
                    <label class="form-label mb-1">Capacidad</label>
                    <select id="capacityFilter" class="form-select form-select-sm">
                        <option value="all">Todas</option>
                        <option value="high">Alta (150+)</option>
                        <option value="medium">Media (80-150)</option>
                        <option value="low">Baja (<80)</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label mb-1">Orden</label>
                    <select id="sortOrder" class="form-select form-select-sm">
                        <option value="nameAsc">Nombre (A-Z)</option>
                        <option value="nameDesc">Nombre (Z-A)</option>
                        <option value="capacityDesc">Mayor capacidad</option>
                        <option value="capacityAsc">Menor capacidad</option>
                    </select>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button id="applyFiltersBtn" class="btn btn-primary btn-sm w-100">Aplicar</button>
                </div>
            </div>
        </div>
    `;
    locationCards.appendChild(searchContainer);
    
    // Contenedor de scroll vertical para las sedes
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'branches-scroll-container';
    cardsContainer.style.maxHeight = '500px';
    cardsContainer.style.overflowY = 'auto';
    cardsContainer.style.paddingRight = '5px';
    locationCards.appendChild(cardsContainer);
    
    if (branches.length === 0) {
        cardsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-building-x text-muted mb-3" style="font-size: 3rem;"></i>
                <h5>No hay sedes disponibles</h5>
                <p class="text-muted">En este momento no hay sedes disponibles para reservas.</p>
            </div>
        `;
        return;
    }
    
    // Crear un contenedor tipo grid para las tarjetas
    const rowContainer = document.createElement('div');
    rowContainer.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3';
    cardsContainer.appendChild(rowContainer);
    
    branches.forEach((branch, index) => {
        // Obtener información de reservas (simulada por ahora)
        const reservationsCount = Math.floor(Math.random() * 15); // Simular conteo de reservas
        
        const card = document.createElement('div');
        card.className = 'col animate__animated animate__fadeIn';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="card h-100 location-card shadow-sm" data-id="${branch.id}">
                <div class="position-relative overflow-hidden branch-img-container">
                    <img src="${branch.imageUrl || 'https://via.placeholder.com/400x200?text=Sin+Imagen'}" 
                         class="card-img-top" alt="${branch.name}">
                    <div class="branch-details">
                        <h5 class="text-white mb-1">${branch.name}</h5>
                        <p class="text-white-50 mb-0"><i class="bi bi-geo-alt me-1"></i>${branch.address}</p>
                    </div>
                    <span class="reservation-badge">${reservationsCount} reservas hoy</span>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge bg-light text-dark"><i class="bi bi-people me-1"></i>${branch.maxCapacity} personas</span>
                        <span class="badge bg-light text-dark"><i class="bi bi-clock me-1"></i>${formatTime(branch.openingTime || '11:00:00')} - ${formatTime(branch.closingTime || '23:00:00')}</span>
                    </div>
                    <p class="card-text small mb-3 branch-description">${branch.description || 'Sin descripción disponible'}</p>
                    <div class="capacity-indicator mb-2">
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar ${reservationsCount > 10 ? 'bg-danger' : reservationsCount > 5 ? 'bg-warning' : 'bg-success'}" 
                                 style="width: ${(reservationsCount / 15) * 100}%"></div>
                        </div>
                        <div class="d-flex justify-content-between small text-muted mt-1">
                            <span>Disponibilidad: ${Math.max(0, 15 - reservationsCount)} espacios</span>
                            <span>${Math.round(100 - (reservationsCount / 15) * 100)}%</span>
                        </div>
                    </div>
                    <button class="btn btn-primary w-100 select-branch-btn">
                        <i class="bi bi-check-circle me-2"></i>Seleccionar esta sede
                    </button>
                </div>
            </div>
        `;
        
        rowContainer.appendChild(card);
    });
    
    // Añadir eventos a los botones de selección
    document.querySelectorAll('.select-branch-btn').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.location-card');
            const branchId = card.dataset.id;
            
            // Quitar selección previa
            document.querySelectorAll('.location-card').forEach(c => {
                c.classList.remove('border-primary');
            });
            
            // Marcar como seleccionada
            card.classList.add('border-primary');
            
            // Activar el botón de continuar
            document.getElementById('nextToStep2').disabled = false;
            
            // Guardar la selección
            selectedBranchId = branchId;
            
            // Centrar el mapa en la sede seleccionada
            centerMapOnBranch(branchId);
            
            // Actualizar marcadores en el mapa
            updateMarkerSelection(branchId);
        });
    });
    
    // Implementar funcionalidad de búsqueda
    const searchInput = document.getElementById('branchSearchInput');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        filterBranches(searchTerm);
    });
    
    // Implementar funcionalidad de filtros
    document.getElementById('filterBranchesBtn').addEventListener('click', function() {
        const filterOptions = document.getElementById('filterOptions');
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('branchSearchInput').value.trim().toLowerCase();
        const capacityFilter = document.getElementById('capacityFilter').value;
        const sortOrder = document.getElementById('sortOrder').value;
        
        let filteredBranches = [...branches];
        
        // Aplicar filtro de capacidad
        if (capacityFilter !== 'all') {
            switch (capacityFilter) {
                case 'high':
                    filteredBranches = filteredBranches.filter(b => b.maxCapacity > 150);
                    break;
                case 'medium':
                    filteredBranches = filteredBranches.filter(b => b.maxCapacity <= 150 && b.maxCapacity >= 80);
                    break;
                case 'low':
                    filteredBranches = filteredBranches.filter(b => b.maxCapacity < 80);
                    break;
            }
        }
        
        // Aplicar ordenamiento
        switch (sortOrder) {
            case 'nameAsc':
                filteredBranches.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                filteredBranches.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'capacityDesc':
                filteredBranches.sort((a, b) => b.maxCapacity - a.maxCapacity);
                break;
            case 'capacityAsc':
                filteredBranches.sort((a, b) => a.maxCapacity - b.maxCapacity);
                break;
        }
        
        // Renderizar las sedes filtradas
        renderBranchCards(filteredBranches);
        
        // Cerrar el panel de filtros
        document.getElementById('filterOptions').style.display = 'none';
    });
}

// Filtrar sedes por término de búsqueda
function filterBranches(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        // Mostrar todas las sedes
        document.querySelectorAll('.location-card').forEach(card => {
            card.closest('.col').style.display = '';
        });
        return;
    }
    
    document.querySelectorAll('.location-card').forEach(card => {
        const branchName = card.querySelector('h5').textContent.toLowerCase();
        const branchAddress = card.querySelector('.branch-details p').textContent.toLowerCase();
        const branchDescription = card.querySelector('.branch-description').textContent.toLowerCase();
        
        if (branchName.includes(searchTerm) || 
            branchAddress.includes(searchTerm) || 
            branchDescription.includes(searchTerm)) {
            card.closest('.col').style.display = '';
        } else {
            card.closest('.col').style.display = 'none';
        }
    });
}

// Añadir sedes al mapa
function addBranchesToMap(branches) {
    // Limpiar marcadores anteriores
    markers.forEach(marker => locationMap.removeLayer(marker));
    markers = [];
    
    // Bounds para ajustar el zoom
    const bounds = L.latLngBounds();
    
    branches.forEach(branch => {
        if (branch.latitude && branch.longitude) {
            // Crear un elemento HTML personalizado para el marcador
            const markerHtml = `
                <div class="branch-marker" data-id="${branch.id}">
                    <i class="bi bi-geo-alt-fill"></i>
                </div>
            `;
            
            const customIcon = L.divIcon({
                html: markerHtml,
                className: '',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });
            
            const marker = L.marker([branch.latitude, branch.longitude], { 
                icon: customIcon,
                title: branch.name
            }).addTo(locationMap);
            
            // Crear popup personalizado
            const popupContent = `
                <div class="branch-marker-popup">
                    <h6>${branch.name}</h6>
                    <p class="small text-muted mb-2">${branch.address}</p>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge bg-light text-dark"><i class="bi bi-people me-1"></i>${branch.maxCapacity}</span>
                        <span class="badge bg-light text-dark"><i class="bi bi-clock me-1"></i>${branch.openingTime || '11:00'} - ${branch.closingTime || '23:00'}</span>
                    </div>
                    <button class="btn btn-primary btn-sm w-100 select-map-branch-btn" 
                            data-id="${branch.id}">
                        Seleccionar
                    </button>
                </div>
            `;
            
            const popup = L.popup({
                closeButton: true,
                className: 'branch-popup',
                maxWidth: 300
            }).setContent(popupContent);
            
            marker.bindPopup(popup);
            
            // Añadir evento al botón dentro del popup
            marker.on('popupopen', () => {
                const popupEl = marker.getPopup().getElement();
                if (popupEl) {
                    const selectBtn = popupEl.querySelector('.select-map-branch-btn');
                    if (selectBtn) {
                        selectBtn.addEventListener('click', () => {
                            selectBranchFromMap(branch.id);
                        });
                    }
                }
            });
            
            // Añadir evento click al marcador
            marker.on('click', () => {
                // Guardar referencia para el popup
                marker._branchId = branch.id;
            });
            
            markers.push(marker);
            bounds.extend([branch.latitude, branch.longitude]);
        }
    });
    
    // Ajustar el mapa para que se vean todos los marcadores
    if (bounds.isValid()) {
        locationMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Actualizar la selección de marcadores en el mapa
function updateMarkerSelection(selectedId) {
    // Actualizar estilo de los marcadores
    markers.forEach(marker => {
        const markerElement = marker.getElement();
        if (markerElement) {
            const markerIcon = markerElement.querySelector('.branch-marker');
            if (markerIcon) {
                const markerId = markerIcon.dataset.id;
                
                if (markerId === selectedId) {
                    markerIcon.classList.add('selected');
                } else {
                    markerIcon.classList.remove('selected');
                }
            }
        }
    });
}

// Centrar el mapa en una sede específica
function centerMapOnBranch(branchId) {
    const branch = branches.find(b => b.id.toString() === branchId.toString());
    
    if (branch && branch.latitude && branch.longitude) {
        locationMap.setView([branch.latitude, branch.longitude], 15);
        
        // Encontrar y abrir el popup del marcador
        markers.forEach(marker => {
            if (marker._branchId === branch.id) {
                marker.openPopup();
            }
        });
    }
}

// Cargar fechas disponibles para la sede seleccionada
async function loadAvailableDates() {
    if (!selectedBranchId) return;
    
    try {
        // Para BurgerBoom, necesitamos extraer las fechas disponibles basándonos en los horarios de atención
        const response = await fetch(`${window.API_BASE_URL}/api/business-hours/branch/${selectedBranchId}/schedule`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Extraer días de la semana abiertos
            const openDays = data.data.schedule
                .filter(day => day.isOpen)
                .map(day => day.dayOfWeek);
            
            // Generar fechas disponibles para los próximos 60 días
            const availableDates = [];
            const today = new Date();
            
            for (let i = 0; i < 60; i++) {
                const date = new Date();
                date.setDate(today.getDate() + i);
                
                // Convertir el día de la semana al formato esperado (MONDAY, TUESDAY, etc.)
                const dayOfWeek = date.toLocaleString('en-us', {weekday: 'long'}).toUpperCase();
                
                if (openDays.includes(dayOfWeek)) {
                    availableDates.push(date.toISOString().split('T')[0]);
                }
            }
            
            // Actualizar el calendario con las fechas disponibles
            datePicker.set('disable', [
                function(date) {
                    // Deshabilitar fechas que no están en la lista de disponibles
                    const dateString = date.toISOString().split('T')[0];
                    return !availableDates.includes(dateString);
                }
            ]);
            
            // Si no hay fechas disponibles, mostrar mensaje
            if (availableDates.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin fechas disponibles',
                    text: 'No hay fechas disponibles para reservar en esta sede.'
                });
            }
        } else {
            showError('Error al cargar fechas disponibles:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar fechas disponibles:', error);
        showError('Error de conexión', 'No se pudieron cargar las fechas disponibles.');
    }
}

// Actualizar fechas disponibles cuando cambia el mes
function updateAvailableDates() {
    if (selectedBranchId) {
        loadAvailableDates();
    }
}

// Cargar horarios disponibles para una fecha específica
async function loadTimeSlotsForDate(date) {
    if (!selectedBranchId || !date) return;
    
    document.getElementById('noDateSelected').classList.add('d-none');
    
    // Mostrar indicador de carga
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.classList.remove('d-none');
    timeSlotsContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando horarios...</span>
            </div>
            <p class="mt-3">Cargando horarios disponibles...</p>
        </div>
    `;
    
    try {
        // Verificar capacidad disponible para la fecha
        const capacityResponse = await fetch(`${window.API_BASE_URL}/api/v1/branches/${selectedBranchId}/capacity?date=${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const capacityData = await capacityResponse.json();
        
        // Obtener horarios de la sede para ese día
        const scheduleResponse = await fetch(`${window.API_BASE_URL}/api/business-hours/branch/${selectedBranchId}/schedule`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const scheduleData = await scheduleResponse.json();
        
        if (capacityResponse.ok && scheduleResponse.ok && 
            capacityData.success && scheduleData.success) {
            
            // Obtener el día de la semana para la fecha seleccionada
            const selectedDay = new Date(date).toLocaleString('en-us', {weekday: 'long'}).toUpperCase();
            
            // Encontrar horario para ese día
            const daySchedule = scheduleData.data.schedule.find(day => day.dayOfWeek === selectedDay);
            
            if (!daySchedule || !daySchedule.isOpen) {
                timeSlotsContainer.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-calendar-x text-muted" style="font-size: 2rem;"></i>
                        <p class="mt-3">Este día está cerrado y no hay horarios disponibles.</p>
                    </div>
                `;
                return;
            }
            
            // Generar slots de tiempo disponibles
            const branch = branches.find(b => b.id === selectedBranchId);
            const availableCapacity = capacityData.data || 0;
            const totalCapacity = branch.maxCapacity || 100;
            
            // Información para mostrar
            const scheduleInfo = {
                totalCapacity: totalCapacity,
                usedCapacity: totalCapacity - availableCapacity,
                slots: generateTimeSlots(daySchedule.openingTime, daySchedule.closingTime, date)
            };
            
            renderTimeSlots(scheduleInfo);
        } else {
            showError('Error al cargar horarios:', 
                capacityData.message || scheduleData.message || 'No se pudieron obtener los horarios');
            timeSlotsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                    <p class="mt-3">No se pudieron cargar los horarios para esta fecha.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        showError('Error de conexión', 'No se pudieron cargar los horarios disponibles.');
        timeSlotsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-wifi-off text-muted" style="font-size: 2rem;"></i>
                <p class="mt-3">Error de conexión. Por favor, intenta de nuevo.</p>
            </div>
        `;
    }
}

// Generar slots de tiempo a partir de horarios de apertura y cierre
function generateTimeSlots(openingTime, closingTime, date) {
    // Crear slots de 1 hora entre el horario de apertura y cierre
    const slots = [];
    
    // Añadir 30 minutos de margen al inicio y fin del horario
    const startTime = new Date(`2000-01-01T${openingTime}`);
    startTime.setMinutes(startTime.getMinutes() + 30);
    
    const endTime = new Date(`2000-01-01T${closingTime}`);
    endTime.setMinutes(endTime.getMinutes() - 30);
    
    const currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
        const timeString = currentTime.toTimeString().substring(0, 8);
        
        // En una aplicación real, aquí verificaríamos la capacidad disponible para cada slot
        // usando el endpoint adecuado de BurgerBoom
        const remainingCapacity = 10; // Este es un valor ficticio
        
        slots.push({
            time: timeString,
            available: remainingCapacity > 0,
            remainingCapacity: remainingCapacity
        });
        
        // Avanzar 1 hora
        currentTime.setHours(currentTime.getHours() + 1);
    }
    
    return slots;
}

// Renderizar slots de horarios disponibles
function renderTimeSlots(scheduleData) {
    const timeSlots = document.getElementById('timeSlots');
    const hourSlots = document.getElementById('hourSlots');
    
    // Si no hay datos de horario
    if (!scheduleData || !scheduleData.slots || scheduleData.slots.length === 0) {
        timeSlots.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-calendar-x text-muted" style="font-size: 2rem;"></i>
                <p class="mt-3">No hay horarios disponibles para esta fecha.</p>
            </div>
        `;
        return;
    }
    
    timeSlots.classList.remove('d-none');
    hourSlots.innerHTML = '';
    
    // Actualizar información de capacidad
    const totalCapacity = scheduleData.totalCapacity || 0;
    const usedCapacity = scheduleData.usedCapacity || 0;
    const availableCapacity = totalCapacity - usedCapacity;
    const availabilityPercentage = totalCapacity > 0 ? Math.round((availableCapacity / totalCapacity) * 100) : 0;
    
    document.getElementById('dateAvailability').textContent = `${availabilityPercentage}%`;
    document.getElementById('dateCapacity').textContent = `${availableCapacity} de ${totalCapacity} lugares disponibles`;
    
    // Actualizar barra de progreso
    const capacityBar = document.getElementById('dateCapacityBar');
    capacityBar.style.width = `${100 - availabilityPercentage}%`;
    
    // Cambiar clase según disponibilidad
    capacityBar.className = 'capacity-progress';
    if (availabilityPercentage < 30) {
        capacityBar.classList.add('danger');
    } else if (availabilityPercentage < 60) {
        capacityBar.classList.add('warning');
    } else {
        capacityBar.classList.add('info');
    }
    
    // Crear slots de horario con animación
    scheduleData.slots.forEach((slot, index) => {
        const time = slot.time;
        const available = slot.available;
        const remainingCapacity = slot.remainingCapacity || 0;
        
        const slotElement = document.createElement('div');
        slotElement.className = 'col animate__animated animate__fadeIn';
        slotElement.style.animationDelay = `${index * 0.05}s`;
        
        const timeSlotClass = available ? 'time-slot' : 'time-slot disabled';
        
        slotElement.innerHTML = `
            <div class="${timeSlotClass}" data-time="${time}">
                ${formatTime(time)}
                ${available ? `<small class="d-block text-muted">${remainingCapacity} disponibles</small>` : ''}
            </div>
        `;
        
        hourSlots.appendChild(slotElement);
    });
    
    // Añadir eventos a los slots de tiempo
    document.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
        slot.addEventListener('click', function() {
            // Desmarcar selección previa
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            
            // Marcar como seleccionado
            this.classList.add('selected');
            
            // Guardar tiempo seleccionado
            selectedTime = this.dataset.time;
            
            // Activar botón de continuar
            document.getElementById('nextToStep3').disabled = false;
        });
    });
}

// Actualizar información de la sede seleccionada
function updateSelectedBranchInfo() {
    if (!selectedBranchId) return;
    
    const branch = branches.find(b => b.id.toString() === selectedBranchId.toString());
    if (!branch) return;
    
    const infoElement = document.getElementById('selectedBranchInfo');
    infoElement.innerHTML = `
        <strong>${branch.name}</strong> - ${branch.address}
        <div class="small text-muted mt-1">
            <i class="bi bi-clock me-1"></i>${branch.openingTime || '11:00'} - ${branch.closingTime || '23:00'} |
            <i class="bi bi-people me-1"></i>Capacidad: ${branch.maxCapacity} personas
        </div>
    `;
}

// Actualizar resumen de reserva
function updateReservationSummary() {
    if (!selectedBranchId || !selectedDate || !selectedTime) return;
    
    const branch = branches.find(b => b.id.toString() === selectedBranchId.toString());
    if (!branch) return;
    
    document.getElementById('summaryBranchName').textContent = branch.name;
    document.getElementById('summaryBranchAddress').textContent = branch.address;
    
    document.getElementById('summaryDate').textContent = formatDate(selectedDate);
    document.getElementById('summaryTime').textContent = formatTime(selectedTime);
    
    // Actualizar número de personas si ya está seleccionado
    const guestCount = document.getElementById('guestCount').value;
    if (guestCount) {
        document.getElementById('summaryGuests').textContent = `${guestCount} personas`;
    } else {
        document.getElementById('summaryGuests').textContent = 'Pendiente de seleccionar';
    }
}

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${window.API_BASE_URL}/api/v1/user/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const user = data.data;
            
            // Prellenar formulario con datos del usuario
            document.getElementById('guestName').value = user.name || '';
            document.getElementById('guestEmail').value = user.email || '';
            document.getElementById('guestPhone').value = user.phone || '';
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

// Configurar listeners para el formulario
function setupFormListeners() {
    // Actualizar resumen cuando cambia el número de personas
    document.getElementById('guestCount').addEventListener('change', function() {
        const guests = this.value;
        if (guests) {
            document.getElementById('summaryGuests').textContent = guests === '9+' ? 'Más de 9 personas' : `${guests} personas`;
        }
    });
    
    // Mostrar términos y condiciones cuando se hace clic en el enlace
    document.querySelector('a[data-bs-toggle="modal"]').addEventListener('click', function(e) {
        e.preventDefault();
        const termsModal = new bootstrap.Modal(document.getElementById('termsModal'));
        termsModal.show();
    });
}

// Validar formulario de reserva
function validateReservationForm() {
    const form = document.getElementById('reservationForm');
    
    if (form.checkValidity() === false) {
        form.classList.add('was-validated');
        return false;
    }
    
    // Validaciones adicionales
    const name = document.getElementById('guestName').value.trim();
    const email = document.getElementById('guestEmail').value.trim();
    const phone = document.getElementById('guestPhone').value.trim();
    const guests = document.getElementById('guestCount').value;
    const termsCheck = document.getElementById('termsCheck').checked;
    
    if (name.length < 3) {
        showError('Validación', 'El nombre debe tener al menos 3 caracteres.');
        return false;
    }
    
    if (!validateEmail(email)) {
        showError('Validación', 'Por favor, ingresa un correo electrónico válido.');
        return false;
    }
    
    if (phone.length < 7) {
        showError('Validación', 'El número de teléfono debe tener al menos 7 dígitos.');
        return false;
    }
    
    if (!guests) {
        showError('Validación', 'Debes seleccionar el número de personas.');
        return false;
    }
    
    if (!termsCheck) {
        showError('Validación', 'Debes aceptar los términos y condiciones para continuar.');
        return false;
    }
    
    return true;
}

// Enviar reserva al servidor
async function submitReservation() {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            showError('Error de autenticación', 'Debes iniciar sesión para realizar una reserva.');
            return;
        }
        
        // Mostrar loading
        Swal.fire({
            title: 'Procesando tu reserva',
            html: 'Estamos confirmando tu reserva, por favor espera...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Recopilar datos del formulario
        const name = document.getElementById('guestName').value.trim();
        const email = document.getElementById('guestEmail').value.trim();
        const phone = document.getElementById('guestPhone').value.trim();
        let guests = document.getElementById('guestCount').value;
        const specialRequests = document.getElementById('specialRequests').value.trim();
        
        // Convertir '9+' a un número
        if (guests === '9+') guests = 10;
        
        // Calcular hora de fin (2 horas después de la hora de inicio)
        const startTime = selectedTime;
        const startDate = new Date(`2000-01-01T${startTime}`);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 2);
        const endTime = endDate.toTimeString().substring(0, 8);
        
        // Crear objeto de reserva adaptado al formato de BurgerBoom
        const reservationData = {
            branchId: selectedBranchId,
            reservationDate: selectedDate,
            startTime: startTime,
            endTime: endTime,
            numGuests: parseInt(guests),
            specialRequests: specialRequests
        };
        
        // Endpoint adaptado según la documentación de BurgerBoom
        const response = await fetch(`${window.API_BASE_URL}/api/reservations/user/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservationData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Guardar detalles de la reserva para la pantalla de confirmación
            reservationDetails = {
                id: data.data.id,
                branchName: getBranchName(selectedBranchId),
                date: formatDate(selectedDate),
                time: formatTime(startTime),
                guests: guests
            };
            
            // Actualizar pantalla de confirmación
            document.getElementById('reservationCode').textContent = data.data.id.substring(0, 8);
            document.getElementById('confirmationDateTime').textContent = `${formatDate(selectedDate)}, ${formatTime(startTime)}`;
            document.getElementById('confirmationBranch').textContent = getBranchName(selectedBranchId);
            document.getElementById('confirmationGuests').textContent = guests === '9+' ? 'Más de 9 personas' : `${guests} personas`;
            
            // Avanzar al paso 4 (confirmación)
            goToStep(4);
            
            // Cerrar el modal de carga
            Swal.close();
        } else {
            showError('Error al procesar la reserva', data.message || 'No se pudo completar la reserva. Por favor, intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error al enviar la reserva:', error);
        showError('Error de conexión', 'Hubo un problema al procesar tu reserva. Por favor, verifica tu conexión a internet e intenta de nuevo.');
    }
}

// Obtener nombre de una sede por su ID
function getBranchName(branchId) {
    const branch = branches.find(b => b.id.toString() === branchId.toString());
    return branch ? branch.name : 'Sede desconocida';
}

// Funciones de utilidad
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = deg2rad(lat2-lat1);
    const dLon = deg2rad(lon2-lon1); 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distancia en km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
}

function formatTime(timeString) {
    if (!timeString) return '';
    
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    
    return `${parts[0]}:${parts[1]}`;
}

function showError(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'Entendido'
    });
}