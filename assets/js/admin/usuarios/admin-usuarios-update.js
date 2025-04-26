document.addEventListener("DOMContentLoaded", () => {
    const updateUserForm = document.getElementById("updateUserForm");
    const saveUserButton = document.getElementById("saveUpdatedUser");

    updateUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userId = updateUserForm.dataset.userId;
        const userData = {
            name: document.getElementById("updateName").value,
            surname: document.getElementById("updateSurname").value,
            phone: document.getElementById("updatePhone").value,
            address: document.getElementById("updateAddress").value,
            city: document.getElementById("updateCity").value,
            birthdate: document.getElementById("updateBirthdate").value,
            role: document.getElementById("updateRole").value,
            status: document.getElementById("updateStatus").checked ? "true" : "false"
        };

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/v1/users/superus/admin/update/${userId}`, {
                method: 'PUT',
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
                    text: data.message || 'Usuario actualizado exitosamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
                updateUserForm.reset();
                loadUsers(); // Recargar la lista de usuarios
            } else {
                throw new Error(data.message || 'Error desconocido al actualizar el usuario.');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                timer: 2000,
                showConfirmButton: false
            });
            console.error('Error al actualizar el usuario:', error);
        }
    });
});

function loadUserData(userId) {
    const user = usersGlobal.find(user => user.id === userId);
    if (!user) {
        console.error("Usuario no encontrado");
        return;
    }

    document.getElementById("updateName").value = user.name;
    document.getElementById("updateSurname").value = user.surname;
    document.getElementById("updatePhone").value = user.phone;
    document.getElementById("updateAddress").value = user.address;
    document.getElementById("updateCity").value = user.city;
    document.getElementById("updateBirthdate").value = user.birthdate;
    document.getElementById("updateRole").value = user.role;
    document.getElementById("updateStatus").checked = user.status === "true";

    const updateUserForm = document.getElementById("updateUserForm");
    updateUserForm.dataset.userId = userId;

    const updateModal = new bootstrap.Modal(document.getElementById("updateUserModal"));
    updateModal.show();
}
