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
        
        // Validar sesión primero
        if (!AuthValidator.validateSession()) {
            window.location.href = '/index.html';
            return;
        }

        // Manejo especial para admin-usuarios.html
        if (currentPath === '/admin-usuarios.html') {
            if (!AuthValidator.validateRole('superadmin')) {
                if (AuthValidator.validateRole('admin')) {
                    // Si es admin pero no superadmin, mostrar mensaje y regresar
                    Swal.fire({
                        title: 'Acceso restringido',
                        text: 'Solo los superadministradores pueden acceder a este módulo.',
                        icon: 'warning',
                        confirmButtonText: 'Entendido'
                    });
                    return false;
                } else {
                    // Si no es ni admin ni superadmin, redirigir al inicio
                    window.location.href = '/index.html';
                }
                return;
            }
        } else {
            // Para las demás rutas, validar el rol normalmente
            if (!AuthValidator.validateRole(requiredRole)) {
                window.location.href = '/index.html';
                return;
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