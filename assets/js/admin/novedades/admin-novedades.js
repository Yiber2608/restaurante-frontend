let newsTable;
let newsGlobal = [];

async function loadNews() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/news/private`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (response.ok && data.success) {
            newsGlobal = data.data;
            buildTable(newsGlobal);
            updateCardCounts(newsGlobal);
        } else if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cargar las novedades:', error);
        handleError('Error al cargar las novedades. Por favor, intente nuevamente.');
    }
}

function buildTable(data) {
    const tableContainer = document.getElementById("table-container");

    if (newsTable) {
        newsTable.destroy();
    }

    newsTable = new Tabulator(tableContainer, {
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
                    "title": "Título",
                    "description": "Descripción",
                    "publicationDate": "Fecha de Publicación",
                    "expirationDate": "Fecha de Expiración",
                    "status": "Estado",
                    "userName": "Usuario"
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
            { title: "Título", field: "title", widthGrow: 2 },
            { title: "Descripción", field: "description", widthGrow: 3 },
            { title: "Fecha de Publicación", field: "publicationDate", hozAlign: "center", widthGrow: 2, formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy", inputFormat: "iso" } },
            { title: "Fecha de Expiración", field: "expirationDate", hozAlign: "center", widthGrow: 2, formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy", inputFormat: "iso" } },
            {
                title: "Estado",
                field: "status",
                widthGrow: 1,
                formatter: (cell) => {
                    const status = cell.getValue();
                    let icon;
                    switch (status) {
                        case 'ACTIVE':
                            icon = 'bi-play-fill text-verde';
                            break;
                        case 'WAITING':
                            icon = 'bi-hourglass-split text-amarillo';
                            break;
                        case 'EXPIRED':
                            icon = 'bi-stop-circle-fill text-rojo';
                            break;
                        case 'PAUSED':
                            icon = 'bi-pause-circle text-azul';
                            break;
                        default:
                            icon = 'bi-question-circle-fill text-muted';
                    }
                    return `<i class="bi ${icon}"></i>`;
                }
            },
            { title: "Usuario", field: "userName", widthGrow: 2 },
            {
                title: "Acciones",
                field: "acciones",
                hozAlign: "center",
                formatter: (cell) => {
                    const isPaused = cell.getRow().getData().status === 'PAUSE';
                    return `
                        <button class='btn fondo-azul btn-sm status-btn'>
                            <i class="bi bi-toggle-${isPaused ? 'off' : 'on'} text-white"></i>
                        </button>
                        <button class='btn fondo-amarillo btn-sm edit-btn'><i class="bi bi-pencil-square"></i></button>
                        <button class='btn fondo-rojo btn-sm delete-btn'><i class="bi bi-trash3-fill"></i></button>
                    `;
                },
                cellClick: async (e, cell) => {
                    const target = e.target.closest('button');
                    const newsId = cell.getRow().getData().id;

                    if (target && target.classList.contains('status-btn')) {
                        const currentStatus = cell.getRow().getData().status;
                        const newStatus = currentStatus === 'PAUSE' ? 'ACTIVE' : 'PAUSE';

                        const result = await Swal.fire({
                            title: `¿Estás seguro de que deseas ${newStatus === 'PAUSE' ? 'pausar' : 'activar'} esta novedad?`,
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#3085d6",
                            cancelButtonColor: "#d33",
                            confirmButtonText: "Sí, cambiar",
                            cancelButtonText: "Cancelar",
                        });

                        if (result.isConfirmed) {
                            await toggleNewsStatus(newsId, newStatus);
                            loadNews(); // Recargar la tabla después de cambiar el estado
                        }
                    } else if (target && target.classList.contains('edit-btn')) {
                        loadNewsById(newsId); // Abrir el modal de edición
                    } else if (target && target.classList.contains('delete-btn')) {
                        deleteNews(newsId, cell.getRow());
                    }
                },
                widthGrow: 2
            }
        ],
    });
}

function updateCardCounts(data) {
    const totalItems = data.length;
    const totalActivos = data.filter(item => item.status === 'ACTIVE').length;
    const totalEnProceso = data.filter(item => item.status === 'WAITING').length;
    const totalExpirados = data.filter(item => item.status === 'EXPIRED').length;
    const totalPausados = data.filter(item => item.status === 'PAUSED').length;
    const totalRecientes = data.filter(item => new Date(item.publicationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length; // Últimos 7 días

    document.getElementById('totalItems').innerText = totalItems;
    document.getElementById('totalActivos').innerText = totalActivos;
    document.getElementById('totalEnProceso').innerText = totalEnProceso;
    document.getElementById('totalExpirados').innerText = totalExpirados;
    document.getElementById('totalPausados').innerText = totalPausados;
    document.getElementById('totalRecientes').innerText = totalRecientes;
}

document.getElementById('cardTodos').addEventListener('click', () => buildTable(newsGlobal));
document.getElementById('cardActivos').addEventListener('click', () => buildTable(newsGlobal.filter(item => item.status === 'ACTIVE')));
document.getElementById('cardEnProceso').addEventListener('click', () => buildTable(newsGlobal.filter(item => item.status === 'WAITING')));
document.getElementById('cardExpirados').addEventListener('click', () => buildTable(newsGlobal.filter(item => item.status === 'EXPIRED')));
document.getElementById('cardPausados').addEventListener('click', () => buildTable(newsGlobal.filter(item => item.status === 'PAUSED')));
document.getElementById('cardRecientes').addEventListener('click', () => buildTable(newsGlobal.filter(item => new Date(item.publicationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))));

document.getElementById('searchInput').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredData = newsGlobal.filter(item => 
        item.title.toLowerCase().includes(searchTerm) || 
        item.description.toLowerCase().includes(searchTerm)
    );
    buildTable(filteredData);
});

async function toggleNewsStatus(newsId, newStatus) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`https://grupouno.click/api/v1/news/private/toggle/${newsId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: responseData.message || "El estado de la novedad ha sido cambiado con éxito.",
                timer: 1500,
                showConfirmButton: false,
            });
        } else {
            throw new Error(responseData.message || "No se pudo cambiar el estado de la novedad.");
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message,
            timer: 2000,
            showConfirmButton: false,
        });
        console.error("Error al cambiar el estado de la novedad:", error);
    }
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

document.addEventListener("DOMContentLoaded", () => {
    loadNews();
    console.log("Tabla de novedades creada al cargar la página");
});
