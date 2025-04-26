// Configuración para almacenar los datos del menú
let menuData = {};

// Función para obtener los ítems del menú desde el servidor
async function fetchMenuItems() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/items/all`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Procesar los datos del menú
            const items = result.data;
            menuData = groupItemsByCategory(items); // Agrupar ítems por categoría
            createMenuItems(); // Crear los elementos del menú en la UI
        } else {
            // Mostrar el mensaje de error del servidor
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Error al obtener los ítems del menú.',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    } catch (error) {
        // Mostrar un mensaje en caso de un error no controlado
        console.error('Error al obtener los ítems del menú:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Por favor, inténtalo más tarde.',
            timer: 3000,
            showConfirmButton: false,
        });
    }
}

// Función para agrupar los ítems por categoría
function groupItemsByCategory(items) {
    return items.reduce((acc, item) => {
        const category = item.typeItem || 'Otros'; // Usar la categoría o 'Otros' si no está definida
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.unitPrice,
            image: item.imageUrl,
        });
        return acc;
    }, {});
}

// Función para crear los ítems del menú en la UI
function createMenuItems() {
    for (const [category, items] of Object.entries(menuData)) {
        const wrapper = document.querySelector(`#container${category.replace(/\s+/g, '')} .swiper-wrapper`);
        if (wrapper) {
            wrapper.innerHTML = ''; // Limpiar contenido previo
            items.forEach(item => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.innerHTML = `
                    <div class="card h-100 shadow-sm bg-gradient py-1" style="max-height: 400px;">
        <img src="${item.image}" class="card-img-top" alt="${item.name}">
        <div class="card-body d-flex flex-column">
            <h5 class="fw-bold">${item.name}</h5>
            <div class="flex-grow-1 overflow-auto">
                <p class="card-text text-black-50">${item.description}</p>
            </div>
            <p class="card-text text-danger fw-bold">$${item.price.toLocaleString()}</p>
        </div>
    </div>
                `;
                wrapper.appendChild(slide);
            });
        }
    }
}

var swiper = new Swiper(".mySwiper", {
    grabCursor: true,
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    },
    breakpoints: {
        640: {
            slidesPerView: 2,
            spaceBetween: 20,
        },
        768: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 4,
            spaceBetween: 30,
        },
    },
});

// Call this function after the DOM is loaded
document.addEventListener('DOMContentLoaded', fetchMenuItems);