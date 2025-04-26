document.addEventListener("DOMContentLoaded", () => {
    const addUserForm = document.getElementById("addUserForm");
    const saveUserButton = document.getElementById("saveUser");

    addUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userData = {
            name: document.getElementById("name").value,
            surname: document.getElementById("surname").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
            birthdate: document.getElementById("birthdate").value,
            role: document.getElementById("role").value,
            status: document.getElementById("status").checked ? "true" : "false"
        };

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/v1/users/superus/admin/register`, { // Cambiar URL directa por window.API_BASE_URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: data.message || 'Usuario creado exitosamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
                addUserForm.reset();
                loadUsers(); // Recargar la lista de usuarios
            } else {
                throw new Error(data.message || 'Error desconocido al crear el usuario.');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                timer: 2000,
                showConfirmButton: false
            });
            console.error('Error al crear el usuario:', error);
        }
    });
});
