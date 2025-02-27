let branchesTable;
let branchesGlobal = [];

async function loadBranches() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('https://grupouno.click/api/v1/branches', {
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
            { title: "ID", field: "id", width: 80, hozAlign: "center", headerSort: false },
            { title: "Nombre", field: "name", widthGrow: 2 },
            { title: "Dirección", field: "address", widthGrow: 2 },
            { title: "Descripción", field: "description", widthGrow: 3 },
            { title: "Capacidad", field: "capacity", hozAlign: "center", widthGrow: 1 },
            { title: "Usuario", field: "userName", widthGrow: 2 },
            { title: "Fecha de Creación", field: "createdAt", hozAlign: "center", widthGrow: 2, formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm:ss", inputFormat: "iso" } },
            { title: "Fecha de Actualización", field: "updatedAt", hozAlign: "center", widthGrow: 2, formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm:ss", inputFormat: "iso" } },
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
                cellClick: (e, cell) => {
                    const imageUrl = cell.getRow().getData().image;
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
                title: "Acciones",
                field: "acciones",
                hozAlign: "center",
                formatter: (cell) => `
                    <button class='btn fondo-amarillo btn-sm edit-btn'><i class="bi bi-pencil-square"></i></button>
                    <button class='btn fondo-rojo btn-sm delete-btn'><i class="bi bi-trash3-fill"></i></button>
                `,
                cellClick: (e, cell) => {
                    const target = e.target.closest('button');
                    const branchId = cell.getRow().getData().id;

                    if (target && target.classList.contains('edit-btn')) {
                        loadBranchById(branchId);
                    } else if (target && target.classList.contains('delete-btn')) {
                        deleteBranch(branchId, cell.getRow());
                    }
                },
                widthGrow: 2
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

        buildTable(filteredBranches);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    loadBranches();
    console.log("Tabla creada al cargar la página");
});
