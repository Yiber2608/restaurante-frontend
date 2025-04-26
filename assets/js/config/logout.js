// No se requiere API_BASE_URL en este archivo, ya que no realiza peticiones al servidor.

// Clase para manejar el logout con confirmación
class LogoutManager {
    constructor() {
        this.initializeLogoutButton();
    }

    initializeLogoutButton() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }
    }

    handleLogout() {
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
    }
}

// Asegúrate de instanciar LogoutManager después de cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    new LogoutManager();
});
