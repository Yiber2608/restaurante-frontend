// URLs del backend
const API_REVIEWS = `${window.API_BASE_URL}/api/v1/reviews`;
const API_NEWS = `${window.API_BASE_URL}/api/v1/news`;

// Generar estrellas HTML dinámicas
const generateStars = (rating, editable = false, callback = null) => {
    return Array.from({ length: 5 }, (_, i) => {
        const starClass = i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted';
        return editable
            ? `<i class="bi ${starClass}" data-rating="${i + 1}" style="cursor: pointer;"></i>`
            : `<i class="bi ${starClass}"></i>`;
    }).join('');
};

// Obtener novedades desde el backend
async function loadNews() {
    try {
        const response = await fetch(API_NEWS);
        const data = await response.json();
        if (data.success) {
            loadContent(data.data, 'novedadesContainer', 'novedad');
        } else {
            console.error('Error al cargar novedades:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar novedades:', error);
    }
}

// Obtener reseñas desde el backend
async function loadReviews() {
    try {
        const response = await fetch(API_REVIEWS);
        const data = await response.json();
        if (data.success) {
            loadContent(data.data, 'reviewsContainer', 'review');
        } else {
            console.error('Error al cargar reseñas:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
    }
}

// Guardar reseña (POST)
async function saveReview(reviewData) {
    try {
        const response = await fetch(API_REVIEWS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        const data = await response.json();
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Reseña guardada!',
                text: 'Gracias por tu opinión. Tu reseña ha sido registrada.',
                timer: 2000,
                showConfirmButton: false
            });
            await loadReviews(); // Recargar las reseñas
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar reseña',
                text: data.message || 'Hubo un problema al guardar tu reseña.',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al guardar reseña:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar la reseña. Por favor, intenta nuevamente.',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Mostrar formulario para guardar reseñas con estrellas dinámicas
function showReviewForm() {
    let selectedRating = 0;

    Swal.fire({
        title: 'Deja tu reseña',
        html: `
            <div>
                <label>Tu nombre</label>
                <input type="text" id="reviewName" class="swal2-input" placeholder="Ej. Juan Pérez">
            </div>
            <div>
                <label>Tu correo</label>
                <input type="email" id="reviewEmail" class="swal2-input" placeholder="Ej. juan.perez@example.com">
            </div>
            <div>
                <label>Tu calificación</label>
                <div id="ratingStars" style="font-size: 1.5rem; margin-bottom: 10px;">
                    ${generateStars(0, true)}
                </div>
            </div>
            <div>
                <label>Tu comentario</label>
                <textarea id="reviewComment" class="swal2-textarea" placeholder="Escribe aquí tu comentario"></textarea>
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            const name = document.getElementById('reviewName').value;
            const email = document.getElementById('reviewEmail').value;
            const comment = document.getElementById('reviewComment').value;

            if (!name || !email || !comment || selectedRating === 0) {
                Swal.showValidationMessage('Por favor, completa todos los campos y selecciona una calificación.');
                return false;
            }

            return { name, email, rating: selectedRating, comment };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            saveReview(result.value);
        }
    });

    // Activar clics en las estrellas para cambiar la calificación
    document.getElementById('ratingStars').addEventListener('click', (e) => {
        if (e.target.dataset.rating) {
            selectedRating = parseInt(e.target.dataset.rating);
            document.getElementById('ratingStars').innerHTML = generateStars(selectedRating, true);
        }
    });
}

// Generar tarjeta HTML genérica
const generateCardHTML = (data, type) => {
    if (type === 'review') {
        return `
            <div class="card card-basic h-100 shadow" data-aos="fade-right">
                <div class="card-body d-flex flex-column">
                    <h3 class="card-title h5 mb-3">${data.name}</h3>
                    <div class="mb-3">${generateStars(data.rating)}</div>
                    <p class="card-text flex-grow-1">${data.comment}</p>
                    <small class="text-muted">Publicado el: ${new Date(data.createdAt).toLocaleDateString()}</small>
                </div>
            </div>`;
    } else if (type === 'novedad') {
        return `
            <div class="card card-basic novedades-card border-0" data-aos="fade-right">
                <div class="card-body d-flex flex-column p-4">
                    <h3 class="fw-bold text-primary mb-2">${data.title}</h3>
                    <p class="novedades-card-text text-muted">${data.description}</p>
                    <small class="text-muted mt-auto">Publicado el: ${new Date(data.createdAt).toLocaleDateString()}</small>
                </div>
            </div>`;
    }
};

// Cargar datos en contenedores
const loadContent = (database, containerId, type) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    database.forEach(data => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = generateCardHTML(data, type);
        container.appendChild(slide);
    });
};

// Inicializar Swiper
const initSwiper = (selector, config) => {
    new Swiper(selector, config);
};

// Eventos DOM
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    loadReviews();
    initSwiper('.reviews-swiper', reviewsSwiperConfig);
    initSwiper('.novedades-swiper', novedadesSwiperConfig);
});

// Botón para añadir reseñas
document.getElementById('addReviewButton').addEventListener('click', showReviewForm);

// Configuraciones de Swiper
const reviewsSwiperConfig = {
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    autoplay: { delay: 3000, disableOnInteraction: false },
    breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 20 },
        768: { slidesPerView: 3, spaceBetween: 30 },
        1024: { slidesPerView: 4, spaceBetween: 30 }
    }
};

const novedadesSwiperConfig = {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    coverflowEffect: { rotate: 45, depth: 100, modifier: 1 },
    pagination: { el: ".swiper-pagination" },
    autoplay: { delay: 3000, disableOnInteraction: false }
};

