// Gestión del cierre de sesión para las páginas de usuario
document.addEventListener('DOMContentLoaded', () => {
    // Botón de cerrar sesión en vistas de usuario (utiliza el id logoutBtn)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Mostrar confirmación con SweetAlert
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Se cerrará tu sesión actual.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar',
                reverseButtons: true // Invierte el orden de los botones
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eliminar token y redirigir si se confirma
                    localStorage.removeItem('token');
                    Swal.fire({
                        title: 'Sesión cerrada',
                        text: 'Tu sesión se ha cerrado correctamente.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/index.html';
                    });
                }
            });
        });
    }
});
