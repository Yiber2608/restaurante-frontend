let reviewsTable; // Variable global para la tabla
let itemsGlobal = []; // Mantener los datos globales

async function loadReviews() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/reviews/private`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (response.ok && data.success) {
            // Asegurarnos de que active sea un booleano
            itemsGlobal = data.data.map(item => ({
                ...item,
                active: Boolean(item.active) // Convertir explícitamente a booleano


            }));

            console.log('Datos cargados:', itemsGlobal);
            buildTable(itemsGlobal);
        } else if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al cargar las reseñas:', error);
        handleError('Error al cargar las reseñas. Por favor, intente nuevamente.');
    }
}

function buildTable(data) {
    const tableContainer = document.getElementById("table-container");
    
    // Si ya existe una tabla, destruirla
    if (reviewsTable) {
        reviewsTable.destroy();
    }

    reviewsTable = new Tabulator(tableContainer, {
        data: data, // Usar directamente los datos pasados
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
                    "email": "Correo electrónico",
                    "rating": "Calificación",
                    "comment": "Comentario",
                    "userName": "Nombre de Usuario",
                    "active": "Activo"
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
            { title: "Correo electrónico", field: "email", widthGrow: 2 },
            { title: "Calificación", field: "rating", hozAlign: "center", formatter: "star", widthGrow: 1.5 },
            {
                title: "Comentario",
                field: "comment",
                formatter: (cell) => {
                    const text = cell.getValue();
                    return `<div style="white-space: pre-wrap; word-wrap: break-word;">${text}</div>`;
                },
                widthGrow: 3
            },
            { title: "Nombre de Usuario", field: "userName", widthGrow: 2 },
            {
                title: "Estado",
                field: "active",
                hozAlign: "center",
                widthGrow: 1,
                formatter: "tickCross",
            },
            {
                title: "Acciones",
                field: "acciones",
                hozAlign: "center",
                formatter: (cell) => {
                    const isActive = cell.getRow().getData().active;
                    return `
                            <i class="bi bi-trash-fill text-white"></i>
                        </button>
                    `;
                },
                cellClick: (e, cell) => {
                    const target = e.target.closest('button');
                    if (!target) return;

                    const resenaId = cell.getRow().getData().id;
                    const currentStatus = cell.getRow().getData().active;
                    
                    if (target.classList.contains('status-btn')) {
                        toggleReviewStatus(resenaId, currentStatus, cell);
                    } else if (target.classList.contains('delete-btn')) {
                        deleteResena(resenaId, cell.getRow());
                    }
                },
                widthGrow: 2
            }
        ],
    });
}

function initializeCardListeners() {
    document.querySelectorAll('.card-clickeable').forEach(card => {
        card.addEventListener('click', () => {
            const cardId = card.id;
            filterReviews(cardId);
        });
    });
}

function filterReviews(cardId) {
    const estrellas = {
        'card1Estrella': 1,
        'card2Estrellas': 2,
        'card3Estrellas': 3,
        'card4Estrellas': 4,
        'card5Estrellas': 5,
        'cardTodos': 'Todos'
    };

    Swal.fire({
        title: 'Cargando...',
        html: 'Por favor espera mientras se filtran los datos.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    setTimeout(() => {
        let resenasFiltradas;
        
        if (cardId === 'cardTodos') {
            resenasFiltradas = itemsGlobal;
        } else {
            const rating = estrellas[cardId];
            resenasFiltradas = itemsGlobal.filter(item => item.rating === rating);
        }

        Swal.close();

        if (resenasFiltradas && resenasFiltradas.length > 0) {
            const mensaje = cardId === 'cardTodos' 
                ? `Se encontraron ${resenasFiltradas.length} reseñas en total.`
                : `Se encontraron ${resenasFiltradas.length} reseñas con ${estrellas[cardId]} ${estrellas[cardId] === 1 ? 'estrella' : 'estrellas'}.`;

            Swal.fire({
                icon: "success",
                title: "¡Datos filtrados!",
                text: mensaje,
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                buildTable(resenasFiltradas);
            });
        } else {
            Swal.fire({
                icon: "info",
                title: "Sin resultados",
                text: `No se encontraron reseñas con ${estrellas[cardId]} ${estrellas[cardId] === 1 ? 'estrella' : 'estrellas'}.`,
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                buildTable(itemsGlobal);
            });
        }
    }, 1000);
}

let searchTimeout; // Definir la variable para el timeout

document.getElementById("searchInput").addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();

    // Limpiar el timeout anterior
    clearTimeout(searchTimeout);

    // Si el campo está vacío, mostrar todos los datos
    if (searchTerm === '') {
        buildTable(itemsGlobal);
        return;
    }

    // Establecer un timeout para esperar que el usuario termine de escribir
    searchTimeout = setTimeout(() => {
        const filteredItems = itemsGlobal.filter(item => {
            // Comparar el término de búsqueda con el nombre, correo y comentario
            const nameMatch = item.name?.toLowerCase().includes(searchTerm);
            const emailMatch = item.email?.toLowerCase().includes(searchTerm);
            const commentMatch = item.comment?.toLowerCase().includes(searchTerm);

            return nameMatch || emailMatch || commentMatch;
        });

        // Actualizar la tabla con los resultados filtrados
        buildTable(filteredItems);

        // Mostrar mensaje apropiado según los resultados
        if (filteredItems.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No se encontraron resultados',
                text: 'No se encontraron reseñas que coincidan con tu búsqueda.',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Resultados encontrados',
                text: `${filteredItems.length} reseña(s) coinciden con tu búsqueda.`,
                showConfirmButton: false,
                timer: 1500
            });
        }
    }, 1500);
});


document.addEventListener("DOMContentLoaded", () => {
    loadReviews();
    initializeCardListeners();
    console.log("Tabla creada al cargar la página");
});

async function toggleReviewStatus(reviewId, currentStatus, cell) {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: "error",
            title: "Autenticación requerida",
            text: "No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.",
        });
        return;
    }

    const newStatus = !currentStatus;
    const statusText = newStatus ? "activar" : "desactivar";

    const result = await Swal.fire({
        title: `¿Estás seguro de que deseas ${statusText} esta reseña?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`https://grupouno.click/api/v1/reviews/private/${reviewId}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ active: newStatus })
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                // Actualizar la fila en la tabla
                cell.getRow().getTable().updateData([{ id: reviewId, active: newStatus }]);

                // Actualizar `itemsGlobal`
                itemsGlobal = itemsGlobal.map(item =>
                    item.id === reviewId ? { ...item, active: newStatus } : item
                );

                // Volver a renderizar la tabla con los datos actualizados
                buildTable(itemsGlobal);

                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: responseData.message || "El estado de la reseña ha sido cambiado con éxito.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                throw new Error(responseData.message || "No se pudo cambiar el estado de la reseña.");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message,
                timer: 2000,
                showConfirmButton: false,
            });
            console.error("Error al cambiar el estado de la reseña:", error);
        }
    }
}


async function deleteResena(reviewId, row) {
    const token = localStorage.getItem("token"); // Obtener el token de autenticación

    if (!token) {
        Swal.fire({
            icon: "error",
            title: "Autenticación requerida",
            text: "No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.",
        });
        return;
    }

    // Mostrar confirmación con SweetAlert
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás recuperar esta reseña después de eliminarla.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            // Realizar la petición de eliminación al backend
            const response = await fetch(`https://grupouno.click/api/v1/reviews/private/${reviewId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`, // Añadir el token al encabezado Authorization
                    "Content-Type": "application/json",
                },
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                // Si usas Tabulator
                if (row.delete) {
                    row.delete();  // Elimina la fila si es Tabulator
                } else {
                    // Si no es Tabulator, intenta eliminar el nodo del DOM de la fila
                    row.getElement().remove(); // Asegúrate de que `getElement()` devuelve el nodo correcto.
                }

                // Mostrar el mensaje del servidor en caso de éxito
                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: responseData.message || "La reseña ha sido eliminada con éxito.",
                    timer: 1500,
                    showConfirmButton: false,
                });

                // Aquí puedes hacer cualquier otra acción, como actualizar el conteo de reseñas
                // Asegúrate de tener la función `conteoResenas` o eliminarla si no la necesitas
                // conteoResenas();  // Elimina esta línea si no tienes esta función.
            } else {
                // Mostrar el mensaje de error desde el servidor
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: responseData.message || "No se pudo eliminar la reseña.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            // Manejo de errores generales
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Ocurrió un problema al intentar eliminar la reseña.",
                timer: 2000,
                showConfirmButton: false,
            });
            console.error("Error al eliminar la reseña:", error);
        }
    }
}