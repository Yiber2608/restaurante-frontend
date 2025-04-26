let itemsGlobal = []


async function loadData() {
    const token = localStorage.getItem('token');

    try {
        // Reemplazar la URL directa con la constante global API_BASE_URL
        const response = await fetch(`${window.API_BASE_URL}/api/v1/items/all`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (response.ok && data.success) {
            // Si la respuesta es exitosa
            itemsGlobal = data.data;
            buildTable(itemsGlobal);
            conteoItemsTarjetas();
        } else if (response.status === 401 || response.status === 403) {
            // Token inválido o expirado
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        } else {
            // Manejo de errores específicos del backend
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        // Manejo de errores de red o problemas en la solicitud
        console.error('Error al cargar los datos:', error);
        handleError('Error al cargar los datos. Por favor, intente nuevamente.');
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



//funcio que crea la tabla con tabulator 
function buildTable(data) {
    const tableContainer = document.getElementById("table-container");

    const table = new Tabulator(tableContainer, {
        data: data, // Usa directamente los datos tal cual vienen
        layout: "fitColumns", // Ajusta las columnas al contenedor
        responsiveLayout: "collapse", // Habilita el diseño responsive
        tableClass: "table table-striped table-bordered table-hover",
        pagination: "local", // Paginación local
        paginationSize: 10, // Número de filas por página
        locale: true, // Habilita la localización
        langs: {
            "es-419": { // Configuración en español
                "columns": {
                    "name": "Nombre",
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
                "groups": {
                    "item": "ítem",
                    "items": "ítems",
                },
                "data": {
                    "loading": "Cargando datos...",
                    "error": "Error al cargar datos.",
                },
                "paginationCounter": {
                    "showing": "Mostrando",
                    "of": "de",
                    "pages": "páginas",
                },
            },
        },
        initialLocale: "es-419", // Idioma inicial
        paginationSizeSelector: [10, 20, 50, 100], // Selector de tamaño de página
        columns: [
            { title: "ID", field: "id", width: 80, hozAlign: "center", headerSort: false },
            { title: "Tipo", field: "typeItem", widthGrow: 1 }, // Usar 'typeItem' directamente
            { title: "Nombre", field: "name", widthGrow: 2 }, // Usar 'name' directamente
            {
                title: "Descripción",
                field: "description", // Usar 'description' directamente
                formatter: (cell) => {
                    const text = cell.getValue();
                    return `<div style="white-space: pre-wrap; word-wrap: break-word;">${text}</div>`;
                },
                widthGrow: 3.5
            },
            {
                title: "Precio",
                field: "unitPrice", // Usar 'unitPrice' directamente
                formatter: "money",
                formatterParams: { symbol: "$", precision: 2 },
                widthGrow: 1.2
            },
            {
                title: "Imagen",
                field: "imageUrl", // Usar 'imageUrl' directamente
                formatter: () => `
                    <button class='btn fondo-azul btn-sm view-img-btn'>
                        <i class="bi bi-eye"></i>
                    </button>
                `,
                hozAlign: "center",
                widthGrow: 1.5,
                cellClick: (e, cell) => {
                    const imageUrl = cell.getRow().getData().imageUrl;
                    if (imageUrl) {
                        showImageModal(imageUrl);
                    } else {
                        alert("Este ítem no tiene imagen.");
                    }
                },
            },
            {
                title: "Estado",
                field: "status", // Usar 'status' directamente
                formatter: "tickCross",
                sorter: "boolean",
                hozAlign: "center",
                widthGrow: 1
            },
            {
                title: "Acciones",
                field: "acciones",
                hozAlign: "center",
                formatter: () => `
                    <button class='btn fondo-amarillo btn-sm edit-btn'><i class="bi bi-pencil-square"></i></button>
                    <button class='btn fondo-rojo btn-sm delete-btn'><i class="bi bi-trash3-fill"></i></button>
                `,
                cellClick: (e, cell) => {
                    const target = e.target.closest('button');

                    if (target && target.classList.contains('edit-btn')) {
                        const itemId = cell.getRow().getData().id;
                        loadDataById(itemId);
                    } else if (target && target.classList.contains('delete-btn')) {
                        // Lógica para el botón de eliminación
                        const itemId = cell.getRow().getData().id;
                        deleteItem(itemId, cell.getRow()); // Llama a la función de eliminación
                    }
                }
                ,
                widthGrow: 2
            }
        ],
    });

    console.log("Tabla creada con éxito");
}

// Función de cargar cantidades
function conteoItemsTarjetas() {
    const conteos = {
        total: 0,
        "Entradas": 0,
        "Platos Principales": 0,
        "Postres": 0,
        "Bebidas Calientes": 0,
        "Otras Bebidas": 0
    };

    // Itera sobre itemsGlobal para contar
    for (let item of itemsGlobal) {
        conteos.total++;
        // Usar el valor de 'typeItem' para contar por tipo
        if (conteos[item.typeItem] !== undefined) {
            conteos[item.typeItem]++;
        }
    }

    // Actualiza los contadores en el DOM
    document.getElementById('totalItems').innerText = conteos.total;
    document.getElementById('totalEntradas').innerText = conteos["Entradas"];
    document.getElementById('totalPlatos').innerText = conteos["Platos Principales"];
    document.getElementById('totalPostres').innerText = conteos["Postres"];
    document.getElementById('totalBebidasCalientes').innerText = conteos["Bebidas Calientes"];
    document.getElementById('totalOtrasBebidas').innerText = conteos["Otras Bebidas"];
}




// Función para mostrar la imagen en un modal
function showImageModal(imageUrl) {
    // Actualizar el atributo "src" del <img> en el modal
    const modalImage = document.getElementById("modalImage");
    modalImage.src = imageUrl;

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById("imageModal"));
    modal.show();
}


let searchTimeout; // Variable para almacenar el timeout

document.getElementById("searchInput").addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();

    // Solo realizar la búsqueda si el término tiene al menos 4 caracteres
    if (searchTerm.length < 4) {
        buildTable(itemsGlobal);
        return;
    }

    // Limpiar el timeout anterior para esperar un momento antes de buscar
    clearTimeout(searchTimeout);

    // Establecer un timeout para esperar que el usuario termine de escribir
    searchTimeout = setTimeout(() => {
        const filteredItems = itemsGlobal.filter(item => {
            const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.description && item.description.toLowerCase().includes(searchTerm);

            return nameMatch || descriptionMatch;  // Buscar en nombre o descripción
        });

        if (filteredItems.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No se encontraron resultados',
                text: 'No hay productos que coincidan con tu búsqueda.',
                showConfirmButton: false,
                timer: 1500
            });
            return;
        }

        buildTable(filteredItems);

        // Mostrar alerta cuando se encuentran productos que coinciden
        Swal.fire({
            icon: 'success',
            title: 'Resultados encontrados',
            text: `${filteredItems.length} producto(s) coinciden con tu búsqueda.`,
            showConfirmButton: false,
            timer: 1500
        });
    }, 1500);  // El valor de 300ms puede ajustarse a tu preferencia
});



// Evento de filtro de tarjetas 
document.querySelectorAll('.card-clickeable').forEach(card => {
    card.addEventListener('click', () => {
        const cardId = card.id;

        // Diccionario de tipos para simplificar los filtros
        const tipos = {
            'cardEntradas': 'Entradas',
            'cardPlatosPrincipales': 'Platos Principales',
            'cardPostres': 'Postres',
            'cardBebidasCalientes': 'Bebidas Calientes',
            'cardOtrasBebidas': 'Otras Bebidas',
            'cardTodos': 'Todos'
        };

        // Mostrar spinner de carga
        Swal.fire({
            title: 'Cargando...',
            html: 'Por favor espera mientras se carga la información.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        setTimeout(() => {
            let filteredItems;

            // Si la tarjeta seleccionada es "Todos", no filtra
            if (cardId === 'cardTodos') {
                filteredItems = itemsGlobal;
            } else if (tipos[cardId]) {
                const tipo = tipos[cardId];

                // Filtrar los elementos de acuerdo al tipo de "typeItem" (campo del JSON)
                filteredItems = itemsGlobal.filter(item => item.typeItem === tipo);
            } else {
                Swal.close();
                alert('¡Hiciste clic en otra tarjeta!');
                return;
            }

            Swal.close();

            // Mostrar el resultado del filtro
            if (filteredItems.length > 0) {
                Swal.fire({
                    icon: "success",
                    title: "¡Datos cargados!",
                    text: `Se encontraron ${filteredItems.length} ${tipos[cardId]}${filteredItems.length > 1 ? '' : ''}.`,
                    timer: 2000, // 2 segundos
                    showConfirmButton: false,
                }).then(() => {
                    buildTable(filteredItems);
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Sin resultados",
                    text: `No se encontraron productos del tipo ${tipos[cardId]}.`,
                    timer: 2000, // 2 segundos
                    showConfirmButton: false,
                }).then(() => {
                    buildTable(itemsGlobal); // Mostrar todos los elementos si no hay resultados
                });
            }
        }, 1000); 
    });
});

// Método para ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    buildTable(itemsGlobal); // Llama a la función para crear la tabla
    conteoItemsTarjetas();
    console.log("Tabla creada al cargar la página");
});