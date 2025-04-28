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

document.addEventListener("DOMContentLoaded", () => {
    loadBranches();
    console.log("Tabla creada al cargar la página");
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

    daysOfWeek.forEach(day => {
        const existingHour = businessHours.find(hour => hour.dayOfWeek === day);
        const isOpen = existingHour ? existingHour.isOpen : false;
        const openingTime = existingHour ? existingHour.openingTime : '11:00'; // Hora de apertura por defecto
        const closingTime = existingHour ? existingHour.closingTime : '23:00'; // Hora de cierre por defecto

        const card = document.createElement('div');
        card.className = `col-md-3 mb-3`;
        card.innerHTML = `
            <div class="card ${isOpen ? 'bg-success text-white' : 'bg-light'}">
                <div class="card-body">
                    <h5 class="card-title">${day}</h5>
                    <div class="form-check form-switch">
                        <input class="form-check-input toggle-day" type="checkbox" ${isOpen ? 'checked' : ''} data-day="${day}">
                        <label class="form-check-label">Activar</label>
                    </div>
                    <div class="mt-3">
                        <label>Apertura</label>
                        <input type="time" class="form-control opening-time" value="${openingTime}" ${isOpen ? '' : 'disabled'}>
                    </div>
                    <div class="mt-3">
                        <label>Cierre</label>
                        <input type="time" class="form-control closing-time" value="${closingTime}" ${isOpen ? '' : 'disabled'}>
                    </div>
                </div>
            </div>
        `;
        scheduleTimeline.appendChild(card);
    });

    document.querySelectorAll('.toggle-day').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const card = this.closest('.card');
            const isChecked = this.checked;
            card.classList.toggle('bg-success', isChecked);
            card.classList.toggle('text-white', isChecked);
            card.querySelector('.opening-time').disabled = !isChecked;
            card.querySelector('.closing-time').disabled = !isChecked;
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

    document.querySelectorAll('.card').forEach(card => {
        const toggleDay = card.querySelector('.toggle-day');
        const openingTimeInput = card.querySelector('.opening-time');
        const closingTimeInput = card.querySelector('.closing-time');

        // Validar que los elementos existen antes de acceder a sus propiedades
        if (toggleDay && toggleDay.checked) {
            const dayOfWeek = card.querySelector('.card-title').textContent;
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

document.querySelectorAll('.update-hour-btn').forEach(button => {
    button.addEventListener('click', async function () {
        const id = this.dataset.id;
        const card = this.closest('.card');
        const openingTime = card.querySelector('.opening-time').value;
        const closingTime = card.querySelector('.closing-time').value;
        const isOpen = card.querySelector('.toggle-day').checked;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/business-hours/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dayOfWeek: card.querySelector('.card-title').textContent, openingTime, closingTime, isOpen }),
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
    const response = await fetch(`http://localhost:8080/api/tables/branch/${branchId}`);
    const data = await response.json();

    if (response.ok && data.success) {
        populateTablesModal(branchId, data.data); // Llenar el modal con las mesas
        const tablesModal = new bootstrap.Modal(document.getElementById('tablesModal'));
        tablesModal.show();
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'No se pudieron cargar las mesas.',
        });
    }
}

function populateTablesModal(branchId, tables) {
    const tablesContainer = document.getElementById('tablesContainer');
    tablesContainer.innerHTML = '';

    tables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = 'table-card';
        tableCard.innerHTML = `
            <div class="table-card-content">
                <img src="./assets/img/mesa.png" alt="Mesa" class="table-image">
                <div class="table-info">
                    <h5>Mesa ${table.tableNumber}</h5>
                    <p><strong>Capacidad:</strong> ${table.capacity}</p>
                    <p><strong>Ubicación:</strong> ${table.location}</p>
                    <p><strong>Estado:</strong> ${table.status}</p>
                </div>
                <div class="table-actions">
                    <button class="btn btn-warning edit-table-btn" data-id="${table.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger delete-table-btn" data-id="${table.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        tablesContainer.appendChild(tableCard);
    });

    document.querySelectorAll('.edit-table-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tableId = button.dataset.id;
            openEditTableModal(branchId, tableId);
        });
    });

    document.querySelectorAll('.delete-table-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tableId = button.dataset.id;
            deleteTable(branchId, tableId);
        });
    });
}

function openEditTableModal(branchId, tableId) {
    // Lógica para abrir el modal de edición de mesas
    const editTableModal = new bootstrap.Modal(document.getElementById('editTableModal'));
    editTableModal.show();
}

function deleteTable(branchId, tableId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará la mesa seleccionada.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
    }).then(async (result) => {
        if (result.isConfirmed) {
            const response = await fetch(`http://localhost:8080/api/tables/${tableId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Mesa eliminada',
                    text: 'La mesa ha sido eliminada correctamente.',
                });
                openTablesModal(branchId); // Recargar las mesas
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la mesa.',
                });
            }
        }
    });
}

document.getElementById('addTableButton').addEventListener('click', () => {
    openCreateTableModal();
});

function openCreateTableModal() {
    const createTableModal = document.getElementById('createTableModal');
    createTableModal.style.display = 'flex'; // Mostrar el modal
}

document.getElementById('closeCreateTableModal').addEventListener('click', () => {
    const createTableModal = document.getElementById('createTableModal');
    createTableModal.style.display = 'none'; // Ocultar el modal
});

document.getElementById('saveTableButton').addEventListener('click', async () => {
    const branchId = document.getElementById('tablesModal').dataset.branchId; // Obtener el branchId del modal de mesas
    const tableNumber = document.getElementById('tableNumber').value;
    const capacity = document.getElementById('tableCapacity').value;
    const location = document.getElementById('tableLocation').value;
    const status = document.getElementById('tableStatus').value;

    if (!tableNumber || !capacity || !location || !status) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor, completa todos los campos antes de guardar.',
        });
        return;
    }

    const tableData = {
        tableNumber: parseInt(tableNumber),
        capacity: parseInt(capacity),
        location: location.trim(),
        status: status,
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/tables/branch/${branchId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tableData),
        });

        const responseData = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Mesa creada',
                text: 'La mesa ha sido creada exitosamente.',
            });
            document.getElementById('createTableModal').style.display = 'none'; // Ocultar el modal
            openTablesModal(branchId); // Recargar las mesas
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al crear la mesa',
                text: responseData.message || 'No se pudo crear la mesa.',
            });
        }
    } catch (error) {
        console.error('Error al crear la mesa:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al intentar crear la mesa.',
        });
    }
});
