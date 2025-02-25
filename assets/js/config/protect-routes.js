// Archivo protect-routes.js
document.addEventListener('DOMContentLoaded', () => {
    const protectedRoutes = {
        '/admin-dashboard.html': 'admin',
        '/admin-menu.html': 'admin',
        '/admin-nosotros.html': 'admin',
        '/admin-reservas.html': 'admin',
        '/admin-novedades.html': 'admin',
        '/admin-sedes.html': 'admin',
        '/admin-usuarios.html': 'superadmin',
        '/admin-resenas': 'admin',
    };

    const currentPath = window.location.pathname;

    if (protectedRoutes[currentPath]) {
        const requiredRole = protectedRoutes[currentPath];
        
        // Validar sesión y rol
        if (!AuthValidator.validateSession()) {
            window.location.href = '/index.html';
            return;
        }

        if (!AuthValidator.validateRole(requiredRole)) {
            if (currentPath === '/admin-usuarios.html' && AuthValidator.validateRole('admin')) {
                Swal.fire({
                    title: 'Acceso denegado',
                    text: 'No tienes acceso a este módulo.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    window.history.back();
                });
            } else {
                window.location.href = '/index.html';
            }
        }
    }
});


// Toggle Sidebar
document.querySelector('.toggle-btn').addEventListener('click', function () {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');

    sidebar.classList.toggle('hidden');

    // Ajustar el ancho del main cuando el sidebar está oculto
    if (sidebar.classList.contains('hidden')) {
        main.style.width = '100%';
    } else {
        main.style.width = 'calc(100% - 90px)';
    }
});