
// Mapa Leaflet
let map; 
// Marcadores en el mapa
let markers = []; 
// Datos de las sucursales cargadas del backend
let restaurants = []; 

// Inicializar el mapa
function initMap() {
    map = L.map('map').setView([4.6871, -74.0451], 13); // Centrado inicial (Bogotá)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Evento de búsqueda
    document.getElementById('searchButton').addEventListener('click', handleSearch);

    // Hacer el mapa responsive
    makeMapResponsive();
}

// Cargar sucursales desde el backend
async function loadBranches() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/branches`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar las sucursales.');
        }

        const data = await response.json();
        if (data.success) {
            restaurants = data.data.map(branch => ({
                id: branch.id,
                name: branch.name,
                address: branch.address,
                description: branch.description,
                image: branch.image,
                coordinates: [branch.latitude, branch.longitude]
            }));

            // Actualizar marcadores, tarjetas y contador total
            updateMapMarkers();
            createRestaurantsItems(restaurants);
            updateTotalBranches(restaurants.length);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Error desconocido al cargar las sucursales.'
            });
        }
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al cargar las sucursales. Por favor, inténtalo de nuevo.'
        });
    }
}

// Actualizar los marcadores del mapa
function updateMapMarkers() {
    markers.forEach(marker => map.removeLayer(marker)); // Eliminar marcadores existentes
    markers = [];

    restaurants.forEach(restaurant => {
        const marker = L.marker(restaurant.coordinates).addTo(map);
        marker.bindPopup(restaurant.name); // Mostrar el nombre al hacer clic
        marker.on('click', () => updateRestaurantInfo(restaurant)); // Mostrar información detallada
        markers.push(marker);
    });

    if (restaurants.length > 0) {
        map.setView(restaurants[0].coordinates, 13); // Centrar en la primera sucursal
    }
}

// Actualizar información detallada del restaurante
function updateRestaurantInfo(restaurant) {
    const infoContainer = document.getElementById('restaurant-info');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <h3>${restaurant.name}</h3>
            <p><strong>Dirección:</strong> ${restaurant.address}</p>
            <p><strong>Descripción:</strong> ${restaurant.description}</p>
            <img src="${restaurant.image}" alt="${restaurant.name}" style="width: 100%; height: auto;">
        `;
    }
}

// Manejar búsqueda de sucursales
function handleSearch() {
    const searchInput = document.getElementById('searchInput').value;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { boundingbox } = data[0];
                const bounds = [
                    [parseFloat(boundingbox[0]), parseFloat(boundingbox[2])],
                    [parseFloat(boundingbox[1]), parseFloat(boundingbox[3])]
                ];
                map.fitBounds(bounds);

                const nearbyRestaurants = restaurants.filter(restaurant => {
                    const [rlat, rlon] = restaurant.coordinates;
                    return rlat >= bounds[0][0] && rlat <= bounds[1][0] &&
                        rlon >= bounds[0][1] && rlon <= bounds[1][1];
                });

                if (nearbyRestaurants.length > 0) {
                    // Mostrar alerta de búsqueda
                    Swal.fire({
                        title: 'Buscando...',
                        html: `Procesando resultados para "<strong>${searchInput}</strong>". Por favor espera.`,
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading(); // Muestra el spinner de carga
                        }
                    });
                
                    // Simula un tiempo de procesamiento para mostrar la alerta
                    setTimeout(() => {
                        Swal.fire({
                            icon: 'success',
                            title: `¡Búsqueda completa!`,
                            html: `Se encontraron <strong>${nearbyRestaurants.length}</strong> sucursal(es) cerca de "<strong>${searchInput}</strong>".`,
                            timer: 2000, // La alerta se cierra automáticamente
                            showConfirmButton: false,
                            timerProgressBar: true
                        });
                
                        // Actualiza el texto del total en el elemento del DOM
                        document.getElementById("total-branches").textContent = 
                            `Resultados para "${searchInput}" (${nearbyRestaurants.length})`;
                
                        // Genera las tarjetas dinámicamente
                        createRestaurantsItems(nearbyRestaurants);
                    }, 1000); // Tiempo de espera para simular la búsqueda (1 segundo)
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin resultados',
                        text: `No se encontraron sucursales cerca de "${searchInput}".`,
                        timer: 2000, // Se cierra automáticamente
                        showConfirmButton: false,
                        timerProgressBar: true
                    });
                }
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Ubicación no encontrada',
                    text: 'No se encontró la ubicación. Por favor, intenta con otra búsqueda.'
                });
            }
        })
        .catch(error => {
            console.error('Error en la búsqueda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error en la búsqueda. Por favor, intenta de nuevo.'
            });
        });
}

// Crear tarjetas dinámicas para las sucursales
function createRestaurantsItems(items) {
    const wrapper = document.querySelector(`#restaurantSwiper .swiper-wrapper`);
    wrapper.innerHTML = '';

    items.forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">${item.address}</p>
                    <p class="card-text">${item.description}</p>
                    <img src="${item.image}" class="img-fluid restaurant-info-image" alt="${item.name}">
                </div>
            </div>
        `;
        wrapper.appendChild(slide);
    });

    swiper.update(); // Actualizar Swiper
}

// Actualizar la cantidad total de sucursales en el DOM
function updateTotalBranches(total) {
    const totalElement = document.getElementById('total-branches');
    if (totalElement) {
        totalElement.textContent = `Total de sucursales: ${total}`;
    }
}

// Hacer el mapa responsive
function makeMapResponsive() {
    function updateMapSize() {
        map.invalidateSize();
    }

    window.addEventListener('resize', updateMapSize);
    window.addEventListener('orientationchange', updateMapSize);
    window.addEventListener('load', updateMapSize);
}

// Inicializar mapa y cargar sucursales
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadBranches();
});

// Configuración de Swiper
var swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    }
});
