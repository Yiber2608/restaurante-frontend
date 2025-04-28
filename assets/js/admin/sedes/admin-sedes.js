let branchesTable;
let branchesGlobal = [];

async function loadBranches() {
    const token = localStorage.getItem('token');

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
            buildTable(branchesGlobal);
            conteoItemsTarjetas();
        } else if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cargar las sedes:', error);
        handleError('Error al cargar las sedes. Por favor, intente nuevamente.');
    }
}

function buildTable(data) {
    const tableContainer = document.getElementById("table-container");

    if (branchesTable) {
        branchesTable.destroy();
    }

    branchesTable = new Tabulator(tableContainer, {
        data: data,
        layout: "fitColumns",
        responsiveLayout: "collapse",
        tableClass: "table table-striped table-bordered table-hover",
        pagination: "local",
        paginationSize: 10,
        locale: true,
        langs: {
            "es-419": {
                "columns": {
                    "name": "Nombre",
                    "address": "Dirección",
                    "description": "Descripción",
                    "capacity": "Capacidad",
                    "userName": "Usuario",
                    "createdAt": "Fecha de Creación",
                    "updatedAt": "Fecha de Actualización",
                    "image": "Imagen"
                },
                "pagination": {
                    "first": "Primera",
                    "first_title": "Primera página",
                    "last": "Última",
                    "last_title": "Última página",
                    "prev": "Anterior",
                    "prev_title": "Página anterior",
                    "next": "Siguiente",
                    "next_title": "Página siguiente",
                    "page_size": "Tamaño de página",
                },
                "data": {
                    "loading": "Cargando datos...",
                    "error": "Error al cargar datos.",
                }
            },
        },
        initialLocale: "es-419",
        paginationSizeSelector: [10, 20, 50, 100],
        columns: [
            { title: "ID", field: "id", width: 80, hozAlign: "center", responsive: 0 }, // Siempre visible
            { title: "Nombre", field: "name", widthGrow: 2, responsive: 0 }, // Siempre visible
            { title: "Dirección", field: "address", widthGrow: 2, responsive: 1 }, // Ocultar en pantallas muy pequeñas
            { title: "Teléfono", field: "phone", widthGrow: 1.5, visible: false, responsive: 2 }, // Ocultar en pantallas pequeñas
            { title: "Correo", field: "email", widthGrow: 2, visible: false, responsive: 2 }, // Ocultar en pantallas pequeñas
            { title: "Descripción", field: "description", widthGrow: 3, visible: false, responsive: 3 }, // Ocultar en pantallas medianas
            { title: "Capacidad", field: "maxCapacity", hozAlign: "center", widthGrow: 1, responsive: 0 }, // Siempre visible
            { title: "Apertura", field: "openingTime", hozAlign: "center", widthGrow: 1, responsive: 1 }, // Ocultar en pantallas muy pequeñas
            { title: "Cierre", field: "closingTime", hozAlign: "center", widthGrow: 1, responsive: 1 }, // Ocultar en pantallas muy pequeñas
            { title: "Usuario", field: "userManagerName", widthGrow: 2, responsive: 2 }, // Ocultar en pantallas pequeñas
            { title: "Fecha de Creación", field: "createdAt", hozAlign: "center", widthGrow: 2, formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm:ss", inputFormat: "iso" }, visible: false, responsive: 3 }, // Ocultar en pantallas medianas
            { title: "Fecha de Actualización", field: "updatedAt", hozAlign: "center", widthGrow: 2, formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm:ss", inputFormat: "iso" }, visible: false, responsive: 3 }, // Ocultar en pantallas medianas
            {
                title: "Imagen",
                field: "image",
                formatter: (cell) => `
                    <button class='btn fondo-azul btn-sm view-img-btn'>
                        <i class="bi bi-eye"></i>
                    </button>
                `,
                hozAlign: "center",
                widthGrow: 1.5,
                responsive: 0, // Siempre visible
                cellClick: (e, cell) => {
                    const imageUrl = cell.getRow().getData().imageUrl;
                    if (imageUrl) {
                        Swal.fire({
                            title: 'Imagen de la Sede',
                            imageUrl: imageUrl,
                            imageAlt: 'Imagen de la Sede',
                            showCloseButton: true,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire({
                            icon: 'info',
                            title: 'Sin imagen',
                            text: 'Esta sede no tiene una imagen asociada.',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                },
            },
            {
                title: "Estado",
                field: "status",
                hozAlign: "center",
                widthGrow: 1.5,
                responsive: 0, // Siempre visible
                formatter: (cell) => {
                    const status = cell.getValue();
                    if (status === "ACTIVE") {
                        return `<i class="bi bi-check-circle-fill text-verde" title="Activo"></i>`;
                    } else if (status === "INACTIVE") {
                        return `<i class="bi bi-x-circle-fill text-rojo" title="Inactivo"></i>`;
                    } else if (status === "MAINTENANCE") {
                        return `<i class="bi bi-exclamation-circle-fill text-naranja" title="En Mantenimiento"></i>`;
                    } else {
                        return `<i class="bi bi-question-circle text-secondary" title="Desconocido"></i>`;
                    }
                },
                tooltip: true
            },
            {
                title: "Acciones",
                field: "acciones",
                hozAlign: "center",
                widthGrow: 3,
                formatter: (cell) => `
                    <button class='btn fondo-amarillo btn-sm edit-btn'><i class="bi bi-pencil-square"></i></button>
                    <button class='btn fondo-rojo btn-sm delete-btn'><i class="bi bi-trash3-fill"></i></button>
                    <button class='btn fondo-naranja btn-sm maintenance-btn'><i class="bi bi-tools"></i></button>
                    <button class='btn fondo-azul btn-sm schedule-btn'><i class="bi bi-calendar-event"></i></button>
                    <button class='btn fondo-verde btn-sm tables-btn'><i class="bi bi-table"></i></button>
                `,
                cellClick: async (e, cell) => {
                    const target = e.target.closest('button');
                    const branchId = cell.getRow().getData().id;

                    if (target && target.classList.contains('tables-btn')) {
                        openTablesModal(branchId); // Abrir modal de mesas
                    } else if (target && target.classList.contains('edit-btn')) {
                        loadBranchById(branchId);
                    } else if (target && target.classList.contains('delete-btn')) {
                        deleteBranch(branchId, cell.getRow());
                    } else if (target && target.classList.contains('maintenance-btn')) {
                        const newStatus = currentStatus === "MAINTENANCE" ? "INACTIVE" : "MAINTENANCE";
                        const confirmation = await Swal.fire({
                            title: `¿Estás seguro de cambiar el estado a ${newStatus}?`,
                            text: `Esta acción cambiará el estado de la sede a ${newStatus}.`,
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#3085d6",
                            cancelButtonColor: "#d33",
                            confirmButtonText: "Sí, cambiar",
                            cancelButtonText: "Cancelar",
                        });

                        if (confirmation.isConfirmed) {
                            try {
                                const token = localStorage.getItem('token');
                                const response = await fetch(`http://localhost:8080/api/v1/branches/${branchId}/status?status=${newStatus}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                if (response.ok) {
                                    Swal.fire({
                                        icon: "success",
                                        title: "¡Éxito!",
                                        text: `El estado de la sede se cambió a ${newStatus}.`,
                                        timer: 1500,
                                        showConfirmButton: false,
                                    });
                                    loadBranches(); // Recargar la tabla para reflejar los cambios
                                } else {
                                    const errorData = await response.json();
                                    Swal.fire({
                                        icon: "error",
                                        title: "Error",
                                        text: errorData.message || "No se pudo cambiar el estado de la sede.",
                                    });
                                }
                            } catch (error) {
                                console.error("Error al cambiar el estado de la sede:", error);
                                Swal.fire({
                                    icon: "error",
                                    title: "Error",
                                    text: "Ocurrió un problema al intentar cambiar el estado de la sede.",
                                });
                            }
                        }
                    } else if (target && target.classList.contains('schedule-btn')) {
                        openScheduleModal(branchId); // Abrir modal de horarios
                    }
                }
            }
        ],
    });
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

function conteoItemsTarjetas() {
    const conteos = {
        total: branchesGlobal.length,
        alta: branchesGlobal.filter(branch => branch.maxCapacity > 250).length,
        media: branchesGlobal.filter(branch => branch.maxCapacity <= 250 && branch.maxCapacity > 100).length, // Corregido
        baja: branchesGlobal.filter(branch => branch.maxCapacity <= 100).length,
        recientes: branchesGlobal.filter(branch => new Date(branch.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
    };

    document.getElementById('totalItems').innerText = conteos.total;
    document.getElementById('totalCapacidadAlta').innerText = conteos.alta;
    document.getElementById('totalCapacidadMedia').innerText = conteos.media; // Mostrar conteo corregido
    document.getElementById('totalCapacidadBaja').innerText = conteos.baja;
    document.getElementById('totalRecientes').innerText = conteos.recientes;
}

let searchTimeout;

document.getElementById("searchInput").addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();

    clearTimeout(searchTimeout);

    if (searchTerm.length < 3) {
        buildTable(branchesGlobal);
        return;
    }

    searchTimeout = setTimeout(() => {
        const filteredBranches = branchesGlobal.filter(branch => {
            return branch.name.toLowerCase().includes(searchTerm) ||
                branch.address.toLowerCase().includes(searchTerm) ||
                branch.description.toLowerCase().includes(searchTerm);
        });

        buildTable(filteredBranches);

        if (filteredBranches.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No se encontraron resultados',
                text: 'No hay sedes que coincidan con tu búsqueda.',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Resultados encontrados',
                text: `${filteredBranches.length} sede(s) coinciden con tu búsqueda.`,
                showConfirmButton: false,
                timer: 1500
            });
        }
    }, 500);
});

document.querySelectorAll('.card-clickeable').forEach(card => {
    card.addEventListener('click', () => {
        const cardId = card.id;

        let filteredBranches;
        if (cardId === 'cardTodos') {
            filteredBranches = branchesGlobal; // Mostrar todas las sedes
        } else if (cardId === 'cardCapacidadAlta') {
            filteredBranches = branchesGlobal.filter(branch => branch.maxCapacity > 250); // Capacidad mayor a 250
        } else if (cardId === 'cardCapacidadMedia') {
            filteredBranches = branchesGlobal.filter(branch => branch.maxCapacity <= 250 && branch.maxCapacity > 100); // Capacidad entre 101 y 250
        } else if (cardId === 'cardCapacidadBaja') {
            filteredBranches = branchesGlobal.filter(branch => branch.maxCapacity <= 100); // Capacidad menor o igual a 100
        } else if (cardId === 'cardRecientes') {
            filteredBranches = branchesGlobal.filter(branch => {
                const createdAt = new Date(branch.createdAt);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 días
                return createdAt > thirtyDaysAgo;
            });
        }

        buildTable(filteredBranches); // Reconstruir la tabla con los datos filtrados
    });
});

document.addEventListener('DOMContentLoaded', function() {
    loadBranches();
    console.log("Tabla creada al cargar la página");

    // Manejador para limpiar correctamente el backdrop cuando se cierra el modal de mesas
    const tablesModal = document.getElementById('tablesModal');
    if (tablesModal) {
        tablesModal.addEventListener('hidden.bs.modal', function() {
            // Eliminar cualquier backdrop que pueda haber quedado
            const backdrops = document.getElementsByClassName('modal-backdrop');
            while (backdrops[0]) {
                backdrops[0].parentNode.removeChild(backdrops[0]);
            }
            // Asegurarse de que el body no tenga la clase 'modal-open'
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }
});

async function openScheduleModal(branchId) {
    const branch = branchesGlobal.find(branch => branch.id === branchId);

    if (!branch) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró la sede seleccionada.',
        });
        return;
    }

    const businessHours = branch.businessHours || []; // Obtener horarios de la sede
    populateScheduleModal(branchId, businessHours); // Precargar horarios en el modal

    // Asignar el branchId al dataset del modal
    const scheduleModalElement = document.getElementById('scheduleModal');
    scheduleModalElement.dataset.branchId = branchId;

    const scheduleModal = new bootstrap.Modal(scheduleModalElement);
    scheduleModal.show();
}

function populateScheduleModal(branchId, businessHours) {
    const scheduleTimeline = document.getElementById('scheduleTimeline');
    scheduleTimeline.innerHTML = '';

    const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const dayIcons = ["bi-calendar-check", "bi-calendar-date", "bi-calendar-day", "bi-calendar-event", "bi-calendar-heart", "bi-calendar-weekend", "bi-calendar-week"];

    daysOfWeek.forEach((day, index) => {
        const existingHour = businessHours.find(hour => hour.dayOfWeek === day);
        const isOpen = existingHour ? existingHour.isOpen : false;
        const openingTime = existingHour ? existingHour.openingTime : '11:00'; 
        const closingTime = existingHour ? existingHour.closingTime : '23:00';

        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card schedule-card ${isOpen ? 'active' : 'inactive'} border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="bi ${dayIcons[index]} fs-4 me-2 ${isOpen ? 'text-success' : 'text-secondary'}"></i>
                        <h5 class="day-label m-0">${dayNames[index]}</h5>
                        <div class="form-check form-switch ms-auto">
                            <input class="form-check-input toggle-day" type="checkbox" ${isOpen ? 'checked' : ''} data-day="${day}">
                        </div>
                    </div>
                    <div class="schedule-controls">
                        <div class="mb-3">
                            <label class="form-label small text-muted">Horario de apertura</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-light border-0">
                                    <i class="bi bi-clock"></i>
                                </span>
                                <input type="time" class="form-control opening-time" value="${openingTime}" ${isOpen ? '' : 'disabled'}>
                            </div>
                        </div>
                        <div class="mb-0">
                            <label class="form-label small text-muted">Horario de cierre</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-light border-0">
                                    <i class="bi bi-clock-history"></i>
                                </span>
                                <input type="time" class="form-control closing-time" value="${closingTime}" ${isOpen ? '' : 'disabled'}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        scheduleTimeline.appendChild(card);
    });

    document.querySelectorAll('.toggle-day').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const card = this.closest('.schedule-card');
            const isChecked = this.checked;
            
            if (isChecked) {
                card.classList.remove('inactive');
                card.classList.add('active');
                card.querySelectorAll('input[type="time"]').forEach(input => {
                    input.disabled = false;
                });
            } else {
                card.classList.remove('active');
                card.classList.add('inactive');
                card.querySelectorAll('input[type="time"]').forEach(input => {
                    input.disabled = true;
                });
            }
        });
    });
}

document.getElementById('saveScheduleButton').addEventListener('click', async () => {
    const scheduleModalElement = document.getElementById('scheduleModal');
    const branchId = scheduleModalElement.dataset.branchId; // Recuperar el branchId del dataset

    if (!branchId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo identificar la sede. Por favor, inténtalo de nuevo.',
        });
        return;
    }

    const newHours = [];

    // Usar un selector más específico para obtener solo las tarjetas de horario
    document.querySelectorAll('#scheduleTimeline .schedule-card').forEach(card => {
        const toggleDay = card.querySelector('.toggle-day');
        const openingTimeInput = card.querySelector('.opening-time');
        const closingTimeInput = card.querySelector('.closing-time');

        // Validar que los elementos existen antes de acceder a sus propiedades
        if (toggleDay && toggleDay.checked) {
            // Usar el atributo data-day para obtener el día en lugar de buscar un elemento de texto
            const dayOfWeek = toggleDay.getAttribute('data-day');
            const openingTime = openingTimeInput ? openingTimeInput.value : '';
            const closingTime = closingTimeInput ? closingTimeInput.value : '';

            // Asegurarse de que los horarios no estén vacíos
            if (openingTime && closingTime) {
                newHours.push({ dayOfWeek, openingTime, closingTime, isOpen: true });
            } else {
                console.warn(`Horarios incompletos para el día ${dayOfWeek}.`);
            }
        }
    });

    if (newHours.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin horarios seleccionados',
            text: 'Por favor, selecciona al menos un día con horarios válidos.',
        });
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/business-hours/branch/${branchId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newHours),
        });

        const responseData = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Horarios guardados',
                text: 'Los horarios se guardaron correctamente.',
            });
            const scheduleModal = bootstrap.Modal.getInstance(scheduleModalElement);
            scheduleModal.hide();
            loadBranches(); // Recargar la tabla para obtener la información actualizada
        } else if (responseData.status === "CONFLICT") {
            Swal.fire({
                icon: 'error',
                title: 'Conflicto con reservas',
                text: responseData.message || 'No se pueden modificar los horarios debido a reservas confirmadas.',
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: responseData.message || 'No se pudieron guardar los horarios.',
            });
        }
    } catch (error) {
        console.error('Error al guardar los horarios:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al intentar guardar los horarios.',
        });
    }
});

// También necesitamos corregir la función para actualizar horarios
document.querySelectorAll('.update-hour-btn').forEach(button => {
    button.addEventListener('click', async function () {
        const id = this.dataset.id;
        const card = this.closest('.schedule-card');
        const openingTime = card.querySelector('.opening-time').value;
        const closingTime = card.querySelector('.closing-time').value;
        const isOpen = card.querySelector('.toggle-day').checked;
        const dayOfWeek = card.querySelector('.toggle-day').getAttribute('data-day');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/business-hours/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dayOfWeek, openingTime, closingTime, isOpen }),
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Horario actualizado',
                    text: 'El horario se actualizó correctamente.',
                });
                loadBranches(); // Recargar la tabla para obtener la información actualizada
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo actualizar el horario.',
                });
            }
        } catch (error) {
            console.error('Error al actualizar el horario:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un problema al intentar actualizar el horario.',
            });
        }
    });
});

async function openTablesModal(branchId) {
    try {
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Cargando mesas',
            html: 'Obteniendo información de mesas...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/tables/branch/${branchId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        Swal.close(); // Cerrar indicador de carga

        if (response.ok && data.success) {
            // Guardar el ID de la sede y datos de capacidad en el modal
            const tablesModal = document.getElementById('tablesModal');
            tablesModal.dataset.branchId = branchId;
            tablesModal.dataset.currentCapacity = data.data.currentTablesCapacity || 0;
            tablesModal.dataset.maxCapacity = data.data.maxBranchCapacity || 0;
            
            // Llenar el modal con las mesas
            populateTablesModal(branchId, data.data);
            
            // Limpiar el formulario de creación y añadir evento de validación
            const createTableForm = document.getElementById('createTableForm');
            createTableForm.reset();
            document.getElementById('tableQuantity').value = "1";
            
            // Añadir elemento para mostrar feedback de capacidad
            if (!document.getElementById('capacityFeedback')) {
                const capacityField = document.getElementById('tableCapacity').parentNode.parentNode;
                const feedbackDiv = document.createElement('div');
                feedbackDiv.id = 'capacityFeedback';
                feedbackDiv.className = 'form-text';
                capacityField.appendChild(feedbackDiv);
            }
            
            // Añadir eventos para validación en tiempo real
            document.getElementById('tableCapacity').addEventListener('input', validateCapacity);
            document.getElementById('tableQuantity').addEventListener('input', validateCapacity);
            
            // Validar capacidad inicial
            validateCapacity();
            
            // Mostrar el modal
            const modal = new bootstrap.Modal(tablesModal);
            modal.show();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudieron cargar las mesas.'
            });
        }
    } catch (error) {
        console.error('Error al cargar las mesas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Ocurrió un problema al cargar las mesas. Por favor, intenta de nuevo.'
        });
    }
}

function populateTablesModal(branchId, branchData) {
    const tablesContainer = document.getElementById('tablesContainer');
    tablesContainer.innerHTML = '';

    // Crear un indicador de capacidad
    const currentCapacity = branchData.currentTablesCapacity || 0;
    const maxCapacity = branchData.maxBranchCapacity || 0;
    const remainingCapacity = maxCapacity - currentCapacity;
    const capacityPercentage = Math.min(100, Math.round((currentCapacity / maxCapacity) * 100));
    
    let alertClass = "info";
    if (capacityPercentage >= 90) {
        alertClass = "danger";
    } else if (capacityPercentage >= 70) {
        alertClass = "warning";
    }

    // Crear el elemento de información de capacidad
    const capacityInfo = document.createElement('div');
    capacityInfo.className = `capacity-alert ${alertClass}`;
    capacityInfo.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong>Capacidad actual:</strong> ${currentCapacity} de ${maxCapacity} personas 
                (${capacityPercentage}%)
            </div>
            <div>
                <strong>Disponible:</strong> ${remainingCapacity} personas
            </div>
        </div>
        <div class="capacity-meter">
            <div class="capacity-progress ${alertClass}" style="width: ${capacityPercentage}%"></div>
        </div>
    `;
    tablesContainer.appendChild(capacityInfo);

    // Si no hay mesas o el array está vacío
    if (!branchData.tables || branchData.tables.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'w-100 text-center p-5';
        emptyState.innerHTML = `
            <img src="./assets/img/mesa.png" alt="Sin mesas" style="width: 80px; opacity: 0.3;">
            <h5 class="mt-3 text-muted">No hay mesas registradas</h5>
            <p class="text-muted">Utiliza el formulario para crear una nueva mesa.</p>
        `;
        tablesContainer.appendChild(emptyState);
        return;
    }

    // Crear contenedor de mesas
    const tablesGrid = document.createElement('div');
    tablesGrid.className = 'd-flex flex-wrap justify-content-start mt-3';
    tablesContainer.appendChild(tablesGrid);

    // Crear tarjetas de mesa con animación
    branchData.tables.forEach((table, index) => {
        const statusClass = getStatusClass(table.status);
        const statusText = getStatusText(table.status);
        
        const tableCard = document.createElement('div');
        tableCard.className = 'table-card animate__fadeIn';
        tableCard.style.animationDelay = `${index * 0.05}s`;
        
        tableCard.innerHTML = `
            <div class="table-card-header">
                <h5>Mesa ${table.tableNumber}</h5>
                <div class="table-header-actions">
                    <button class="btn btn-status-change" data-id="${table.id}" data-status="${table.status}" title="Cambiar estado">
                        <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="btn btn-table-delete" data-id="${table.id}" title="Eliminar mesa">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="table-card-content">
                <img src="./assets/img/mesa.png" alt="Mesa" class="table-image">
                <div class="table-info">
                    <p><strong>Capacidad:</strong> ${table.capacity} personas</p>
                    <p><strong>Ubicación:</strong> ${table.location}</p>
                    <p><span class="badge-table-status ${statusClass}">${statusText}</span></p>
                </div>
            </div>
        `;
        
        tablesGrid.appendChild(tableCard);
    });

    // Añadir eventos a los botones
    document.querySelectorAll('.btn-status-change').forEach(button => {
        button.addEventListener('click', () => {
            const tableId = button.dataset.id;
            const currentStatus = button.dataset.status;
            changeTableStatus(branchId, tableId, currentStatus);
        });
    });

    document.querySelectorAll('.btn-table-delete').forEach(button => {
        button.addEventListener('click', () => {
            const tableId = button.dataset.id;
            deleteTable(branchId, tableId);
        });
    });

    // Añadir evento de búsqueda
    document.getElementById('searchTableInput').addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        document.querySelectorAll('.table-card').forEach(card => {
            const tableNumber = card.querySelector('h5').textContent.toLowerCase();
            const tableInfo = card.querySelector('.table-info').textContent.toLowerCase();
            
            if (tableNumber.includes(searchText) || tableInfo.includes(searchText)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Función para obtener la clase CSS según el estado
function getStatusClass(status) {
    switch(status) {
        case 'AVAILABLE': return 'badge-available';
        case 'OCCUPIED': return 'badge-occupied';
        case 'RESERVED': return 'badge-reserved';
        default: return 'badge-secondary';
    }
}

// Función para obtener texto legible según el estado
function getStatusText(status) {
    switch(status) {
        case 'AVAILABLE': return 'Disponible';
        case 'OCCUPIED': return 'Ocupada';
        case 'RESERVED': return 'Reservada';
        default: return 'Desconocido';
    }
}

// Función para validar capacidad en tiempo real
function validateCapacity() {
    const tablesModal = document.getElementById('tablesModal');
    const currentCapacity = parseInt(tablesModal.dataset.currentCapacity) || 0;
    const maxCapacity = parseInt(tablesModal.dataset.maxCapacity) || 0;
    const remainingCapacity = maxCapacity - currentCapacity;
    
    const capacity = parseInt(document.getElementById('tableCapacity').value) || 0;
    const quantity = parseInt(document.getElementById('tableQuantity').value) || 1;
    const totalNewCapacity = capacity * quantity;
    
    const capacityFeedback = document.getElementById('capacityFeedback');
    const submitButton = document.querySelector('#createTableForm button[type="submit"]');
    
    if (!capacityFeedback || !submitButton) return;
    
    if (totalNewCapacity > remainingCapacity) {
        capacityFeedback.textContent = `¡Excede la capacidad disponible! (${remainingCapacity} personas)`;
        capacityFeedback.className = 'form-text text-danger';
        submitButton.disabled = true;
    } else if (totalNewCapacity > 0) {
        capacityFeedback.textContent = `Capacidad total a agregar: ${totalNewCapacity} de ${remainingCapacity} disponibles`;
        capacityFeedback.className = 'form-text text-success';
        submitButton.disabled = false;
    } else {
        capacityFeedback.textContent = 'Por favor, ingresa valores válidos de capacidad y cantidad';
        capacityFeedback.className = 'form-text text-muted';
        submitButton.disabled = true;
    }
}

// Función para cambiar el estado de una mesa
async function changeTableStatus(branchId, tableId, currentStatus) {
    // Determinar el siguiente estado en la rotación
    let nextStatus;
    switch(currentStatus) {
        case 'AVAILABLE':
            nextStatus = 'OCCUPIED';
            break;
        case 'OCCUPIED':
            nextStatus = 'RESERVED';
            break;
        case 'RESERVED':
        default:
            nextStatus = 'AVAILABLE';
            break;
    }

    const result = await Swal.fire({
        title: 'Cambiar estado',
        html: `¿Deseas cambiar el estado de la mesa de <b>${getStatusText(currentStatus)}</b> a <b>${getStatusText(nextStatus)}</b>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/tables/${tableId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Estado actualizado',
                    text: `El estado de la mesa se cambió a ${getStatusText(nextStatus)}.`,
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Recargar las mesas
                openTablesModal(branchId);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo actualizar el estado de la mesa.'
                });
            }
        } catch (error) {
            console.error('Error al cambiar el estado de la mesa:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un problema al intentar cambiar el estado de la mesa.'
            });
        }
    }
}

// Función para eliminar una mesa
async function deleteTable(branchId, tableId) {
    const result = await Swal.fire({
        title: '¿Eliminar mesa?',
        text: 'Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta mesa?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/tables/${tableId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Mesa eliminada',
                    text: 'La mesa se ha eliminado correctamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Recargar las mesas
                openTablesModal(branchId);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la mesa.'
                });
            }
        } catch (error) {
            console.error('Error al eliminar la mesa:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un problema al intentar eliminar la mesa.'
            });
        }
    }
}

// Manejar la creación de mesas desde el formulario integrado
document.addEventListener('DOMContentLoaded', function() {
    const createTableForm = document.getElementById('createTableForm');
    
    if (createTableForm) {
        createTableForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const branchId = document.getElementById('tablesModal').dataset.branchId;
            const tableNumber = parseInt(document.getElementById('tableNumber').value);
            const capacity = parseInt(document.getElementById('tableCapacity').value);
            const location = document.getElementById('tableLocation').value.trim();
            const status = document.getElementById('tableStatus').value;
            const quantity = parseInt(document.getElementById('tableQuantity').value) || 1;
            
            // Validaciones básicas
            if (!branchId) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo identificar la sede.',
                });
                return;
            }
            
            if (isNaN(tableNumber) || tableNumber < 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'El número de mesa debe ser mayor a cero.',
                });
                return;
            }
            
            if (isNaN(capacity) || capacity < 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La capacidad debe ser mayor a cero.',
                });
                return;
            }
            
            if (!location || location.length < 3) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La ubicación debe tener al menos 3 caracteres.',
                });
                return;
            }
            
            // Validar cantidad
            if (isNaN(quantity) || quantity < 1 || quantity > 20) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La cantidad debe ser un número entre 1 y 20.',
                });
                return;
            }
            
            // Validar capacidad disponible
            const tablesModal = document.getElementById('tablesModal');
            const currentCapacity = parseInt(tablesModal.dataset.currentCapacity) || 0;
            const maxCapacity = parseInt(tablesModal.dataset.maxCapacity) || 0;
            const remainingCapacity = maxCapacity - currentCapacity;
            const totalNewCapacity = capacity * quantity;
            
            if (totalNewCapacity > remainingCapacity) {
                Swal.fire({
                    icon: 'error',
                    title: 'Capacidad excedida',
                    html: `
                        La capacidad total de las nuevas mesas (${totalNewCapacity} personas) 
                        excede la capacidad disponible (${remainingCapacity} personas).<br><br>
                        <ul>
                            <li>Reduce la cantidad de mesas (${quantity})</li>
                            <li>Reduce la capacidad por mesa (${capacity})</li>
                            <li>O aumenta la capacidad máxima de la sede</li>
                        </ul>
                    `
                });
                return;
            }
            
            try {
                // Mostrar indicador de carga
                Swal.fire({
                    title: `Creando ${quantity} mesa(s)`,
                    html: 'Procesando solicitud...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                const token = localStorage.getItem('token');
                let successCount = 0;
                let errorCount = 0;
                let errorMessages = [];
                
                // Crear array de promesas para cada mesa
                const createPromises = [];
                
                for (let i = 0; i < quantity; i++) {
                    // Incrementar el número de mesa si se crean múltiples
                    const currentTableNumber = quantity > 1 ? tableNumber + i : tableNumber;
                    
                    const tableData = {
                        tableNumber: currentTableNumber,
                        capacity: capacity,
                        location: location,
                        status: status,
                    };
                    
                    const promise = fetch(`http://localhost:8080/api/tables/branch/${branchId}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(tableData),
                    }).then(response => response.json())
                      .then(data => {
                          if (data.success) {
                              successCount++;
                              return { success: true };
                          } else {
                              errorCount++;
                              errorMessages.push(`Mesa ${currentTableNumber}: ${data.message || 'Error desconocido'}`);
                              return { success: false, message: data.message };
                          }
                      })
                      .catch(error => {
                          errorCount++;
                          errorMessages.push(`Mesa ${currentTableNumber}: Error de conexión`);
                          return { success: false, message: 'Error de conexión' };
                      });
                    
                    createPromises.push(promise);
                }
                
                // Ejecutar todas las creaciones
                await Promise.all(createPromises);
                
                if (successCount > 0) {
                    let message = `Se han creado ${successCount} de ${quantity} mesas exitosamente.`;
                    
                    if (errorCount > 0) {
                        message += ` Hubo ${errorCount} errores.`;
                        
                        if (errorMessages.length > 0) {
                            message += '<br><br><strong>Detalles de errores:</strong><br>';
                            message += errorMessages.slice(0, 3).join('<br>');
                            
                            if (errorMessages.length > 3) {
                                message += `<br>... y ${errorMessages.length - 3} más.`;
                            }
                        }
                    }
                    
                    Swal.fire({
                        icon: successCount === quantity ? 'success' : 'warning',
                        title: successCount === quantity ? 'Mesas creadas' : 'Algunas mesas creadas',
                        html: message,
                        confirmButtonText: 'Entendido'
                    });
                    
                    // Limpiar el formulario
                    createTableForm.reset();
                    document.getElementById('tableQuantity').value = "1";
                    
                    // Recargar las mesas
                    openTablesModal(branchId);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al crear mesas',
                        html: `No se pudo crear ninguna mesa.<br><br><strong>Errores:</strong><br>${errorMessages.join('<br>')}`,
                    });
                }
            } catch (error) {
                console.error('Error al crear las mesas:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un problema al intentar crear las mesas.',
                });
            }
        });
    }
});
