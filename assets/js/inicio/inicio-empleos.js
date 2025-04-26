
// Simulación de datos de empleos
const jobs = [
    { 
        id: 1,
        title: "Desarrollador Web", 
        company: "Nuestra Empresa", 
        location: "Bogotá, Colombia",
        employeesNeeded: 3,
        publishDate: "2023-05-01", 
        expiryDate: "2023-06-01",
        description: "Buscamos desarrolladores web con experiencia en React y Node.js para nuestro equipo de innovación.",
        fullDescription: "Estamos en busca de desarrolladores web talentosos para unirse a nuestro equipo de innovación en Bogotá. Los candidatos ideales deben tener experiencia sólida en React para el frontend y Node.js para el backend. Valoramos la capacidad de trabajar en equipo y la pasión por mantenerse actualizado con las últimas tendencias tecnológicas. Se ofrecen excelentes beneficios y oportunidades de crecimiento dentro de la empresa."
    },
    { 
        id: 2,
        title: "Diseñador UX/UI", 
        company: "Nuestra Empresa", 
        location: "Medellín, Colombia",
        employeesNeeded: 2,
        publishDate: "2023-05-05", 
        expiryDate: "2023-06-05",
        description: "Se buscan diseñadores UX/UI creativos con experiencia en Figma para nuestro departamento de diseño.",
        fullDescription: "Nuestra Empresa está en busca de diseñadores UX/UI creativos y apasionados para unirse a nuestro equipo en Medellín. Los candidatos ideales deben tener un excelente dominio de Figma y una sólida comprensión de los principios de diseño centrado en el usuario. Se valorará la experiencia en la creación de prototipos interactivos y la capacidad de colaborar estrechamente con equipos de desarrollo. Ofrecemos un ambiente de trabajo dinámico y proyectos desafiantes."
    },
    { 
        id: 3,
        title: "Gerente de Proyecto", 
        company: "Nuestra Empresa", 
        location: "Cali, Colombia",
        employeesNeeded: 1,
        publishDate: "2023-05-10", 
        expiryDate: "2023-06-10",
        description: "Buscamos un gerente de proyecto con certificación PMP y experiencia en metodologías ágiles para liderar nuestros proyectos estratégicos.",
        fullDescription: "Nuestra Empresa busca un gerente de proyecto experimentado para liderar equipos multidisciplinarios en Cali. El candidato ideal debe tener certificación PMP y amplia experiencia en metodologías ágiles, especialmente Scrum. Se requieren excelentes habilidades de comunicación y la capacidad de gestionar múltiples proyectos simultáneamente. Esta posición ofrece la oportunidad de trabajar en proyectos estratégicos clave para el crecimiento de la empresa."
    },
    { 
        id: 2,
        title: "Diseñador UX/UI", 
        company: "Nuestra Empresa", 
        location: "Medellín, Colombia",
        employeesNeeded: 2,
        publishDate: "2023-05-05", 
        expiryDate: "2023-06-05",
        description: "Se buscan diseñadores UX/UI creativos con experiencia en Figma para nuestro departamento de diseño.",
        fullDescription: "Nuestra Empresa está en busca de diseñadores UX/UI creativos y apasionados para unirse a nuestro equipo en Medellín. Los candidatos ideales deben tener un excelente dominio de Figma y una sólida comprensión de los principios de diseño centrado en el usuario. Se valorará la experiencia en la creación de prototipos interactivos y la capacidad de colaborar estrechamente con equipos de desarrollo. Ofrecemos un ambiente de trabajo dinámico y proyectos desafiantes."
    },
    { 
        id: 3,
        title: "Gerente de Proyecto", 
        company: "Nuestra Empresa", 
        location: "Cali, Colombia",
        employeesNeeded: 1,
        publishDate: "2023-05-10", 
        expiryDate: "2023-06-10",
        description: "Buscamos un gerente de proyecto con certificación PMP y experiencia en metodologías ágiles para liderar nuestros proyectos estratégicos.",
        fullDescription: "Nuestra Empresa busca un gerente de proyecto experimentado para liderar equipos multidisciplinarios en Cali. El candidato ideal debe tener certificación PMP y amplia experiencia en metodologías ágiles, especialmente Scrum. Se requieren excelentes habilidades de comunicación y la capacidad de gestionar múltiples proyectos simultáneamente. Esta posición ofrece la oportunidad de trabajar en proyectos estratégicos clave para el crecimiento de la empresa."
    },
    { 
        id: 2,
        title: "Diseñador UX/UI", 
        company: "Nuestra Empresa", 
        location: "Medellín, Colombia",
        employeesNeeded: 2,
        publishDate: "2023-05-05", 
        expiryDate: "2023-06-05",
        description: "Se buscan diseñadores UX/UI creativos con experiencia en Figma para nuestro departamento de diseño.",
        fullDescription: "Nuestra Empresa está en busca de diseñadores UX/UI creativos y apasionados para unirse a nuestro equipo en Medellín. Los candidatos ideales deben tener un excelente dominio de Figma y una sólida comprensión de los principios de diseño centrado en el usuario. Se valorará la experiencia en la creación de prototipos interactivos y la capacidad de colaborar estrechamente con equipos de desarrollo. Ofrecemos un ambiente de trabajo dinámico y proyectos desafiantes."
    },
    { 
        id: 3,
        title: "Gerente de Proyecto", 
        company: "Nuestra Empresa", 
        location: "Cali, Colombia",
        employeesNeeded: 1,
        publishDate: "2023-05-10", 
        expiryDate: "2023-06-10",
        description: "Buscamos un gerente de proyecto con certificación PMP y experiencia en metodologías ágiles para liderar nuestros proyectos estratégicos.",
        fullDescription: "Nuestra Empresa busca un gerente de proyecto experimentado para liderar equipos multidisciplinarios en Cali. El candidato ideal debe tener certificación PMP y amplia experiencia en metodologías ágiles, especialmente Scrum. Se requieren excelentes habilidades de comunicación y la capacidad de gestionar múltiples proyectos simultáneamente. Esta posición ofrece la oportunidad de trabajar en proyectos estratégicos clave para el crecimiento de la empresa."
    },
    { 
        id: 2,
        title: "Diseñador UX/UI", 
        company: "Nuestra Empresa", 
        location: "Medellín, Colombia",
        employeesNeeded: 2,
        publishDate: "2023-05-05", 
        expiryDate: "2023-06-05",
        description: "Se buscan diseñadores UX/UI creativos con experiencia en Figma para nuestro departamento de diseño.",
        fullDescription: "Nuestra Empresa está en busca de diseñadores UX/UI creativos y apasionados para unirse a nuestro equipo en Medellín. Los candidatos ideales deben tener un excelente dominio de Figma y una sólida comprensión de los principios de diseño centrado en el usuario. Se valorará la experiencia en la creación de prototipos interactivos y la capacidad de colaborar estrechamente con equipos de desarrollo. Ofrecemos un ambiente de trabajo dinámico y proyectos desafiantes."
    },
    { 
        id: 3,
        title: "Gerente de Proyecto", 
        company: "Nuestra Empresa", 
        location: "Cali, Colombia",
        employeesNeeded: 1,
        publishDate: "2023-05-10", 
        expiryDate: "2023-06-10",
        description: "Buscamos un gerente de proyecto con certificación PMP y experiencia en metodologías ágiles para liderar nuestros proyectos estratégicos.",
        fullDescription: "Nuestra Empresa busca un gerente de proyecto experimentado para liderar equipos multidisciplinarios en Cali. El candidato ideal debe tener certificación PMP y amplia experiencia en metodologías ágiles, especialmente Scrum. Se requieren excelentes habilidades de comunicación y la capacidad de gestionar múltiples proyectos simultáneamente. Esta posición ofrece la oportunidad de trabajar en proyectos estratégicos clave para el crecimiento de la empresa."
    },
    { 
        id: 2,
        title: "Diseñador UX/UI", 
        company: "Nuestra Empresa", 
        location: "Medellín, Colombia",
        employeesNeeded: 2,
        publishDate: "2023-05-05", 
        expiryDate: "2023-06-05",
        description: "Se buscan diseñadores UX/UI creativos con experiencia en Figma para nuestro departamento de diseño.",
        fullDescription: "Nuestra Empresa está en busca de diseñadores UX/UI creativos y apasionados para unirse a nuestro equipo en Medellín. Los candidatos ideales deben tener un excelente dominio de Figma y una sólida comprensión de los principios de diseño centrado en el usuario. Se valorará la experiencia en la creación de prototipos interactivos y la capacidad de colaborar estrechamente con equipos de desarrollo. Ofrecemos un ambiente de trabajo dinámico y proyectos desafiantes."
    },
    { 
        id: 3,
        title: "Gerente de Proyecto", 
        company: "Nuestra Empresa", 
        location: "Cali, Colombia",
        employeesNeeded: 1,
        publishDate: "2023-05-10", 
        expiryDate: "2023-06-10",
        description: "Buscamos un gerente de proyecto con certificación PMP y experiencia en metodologías ágiles para liderar nuestros proyectos estratégicos.",
        fullDescription: "Nuestra Empresa busca un gerente de proyecto experimentado para liderar equipos multidisciplinarios en Cali. El candidato ideal debe tener certificación PMP y amplia experiencia en metodologías ágiles, especialmente Scrum. Se requieren excelentes habilidades de comunicación y la capacidad de gestionar múltiples proyectos simultáneamente. Esta posición ofrece la oportunidad de trabajar en proyectos estratégicos clave para el crecimiento de la empresa."
    },
];

// Función para cargar los empleos
function loadJobs(filter = '') {
    const jobsContainer = document.getElementById('jobs');
    jobsContainer.innerHTML = ''; // Limpiar el contenedor antes de cargar los empleos filtrados
    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(filter.toLowerCase()) ||
        job.location.toLowerCase().includes(filter.toLowerCase()) ||
        job.description.toLowerCase().includes(filter.toLowerCase())
    );
    filteredJobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'col';
        jobCard.innerHTML = `
            <div class="card h-100 job-card" data-aos="fade-up" data-aos-duration="1000">
                <div class="card-body">
                    <h5 class="card-title">${job.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${job.company}</h6>
                    <p class="card-text">${job.description}</p>
                    <div class="job-info mb-3">
                        <p class="mb-1"><i class="fas fa-map-marker-alt me-2"></i>${job.location}</p>
                        <p class="mb-1"><i class="fas fa-users me-2"></i>Vacantes: ${job.employeesNeeded}</p>
                        <p class="mb-1"><i class="far fa-calendar-alt me-2"></i>Publicado: ${job.publishDate}</p>
                        <p class="mb-0"><i class="fas fa-hourglass-end me-2"></i>Expira: ${job.expiryDate}</p>
                    </div>
                    <button class="btn btn-outline-primary btn-sm me-2" onclick="showJobDetails(${job.id})">Ver detalles</button>
                    <button class="btn btn-primary btn-sm" onclick="showApplyForm(${job.id})">Postular</button>
                </div>
            </div>
        `;
        jobsContainer.appendChild(jobCard);
    });
}

// Función para mostrar detalles del empleo
function showJobDetails(jobId) {
    const job = jobs.find(j => j.id === jobId);
    const modalBody = document.getElementById('jobDetailsBody');
    modalBody.innerHTML = `
        <h4>${job.title}</h4>
        <h6 class="text-muted">${job.company}</h6>
        <p><strong>Ubicación:</strong> ${job.location}</p>
        <p><strong>Vacantes:</strong> ${job.employeesNeeded}</p>
        <p><strong>Fecha de publicación:</strong> ${job.publishDate}</p>
        <p><strong>Fecha de expiración:</strong> ${job.expiryDate}</p>
        <h5>Descripción del puesto:</h5>
        <p>${job.fullDescription}</p>
        <button class="btn btn-primary" onclick="showApplyForm(${job.id})">Postular a este empleo</button>
    `;
    new bootstrap.Modal(document.getElementById('jobDetailsModal')).show();
}

// Función para mostrar el formulario de postulación
function showApplyForm(jobId) {
    document.getElementById('jobId').value = jobId;
    new bootstrap.Modal(document.getElementById('applyModal')).show();
}

// Manejar el envío del formulario
document.getElementById('applyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const jobId = formData.get('jobId');
    const job = jobs.find(j => j.id == jobId);

    // Simulación de envío de correo electrónico
    console.log(`Enviando correo a talento humano con la postulación para: ${job.title}`);
    console.log('Datos del formulario:', Object.fromEntries(formData));

    Swal.fire({
        title: '¡Éxito!',
        text: `Tu postulación para "${job.title}" en ${job.location} ha sido enviada correctamente.`,
        icon: 'success',
        confirmButtonText: 'Genial'
    });

    this.reset();
    bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
});

// Manejar la búsqueda en tiempo real
document.getElementById('searchInput').addEventListener('input', function(e) {
    loadJobs(e.target.value);
});

// Cargar empleos al iniciar la página
window.addEventListener('load', () => loadJobs());
