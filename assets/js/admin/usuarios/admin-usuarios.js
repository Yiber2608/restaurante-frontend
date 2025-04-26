document.addEventListener("DOMContentLoaded", async () => {
    // Primero validamos la sesión
    if (!AuthValidator.validateSession()) {
        window.location.href = '/index.html';
        return;
    }

    // Si no es superadmin pero es admin, mostrar mensaje y regresar
    if (!AuthValidator.validateRole('superadmin') && AuthValidator.validateRole('admin')) {
        await Swal.fire({
            title: 'Acceso restringido',
            text: 'Solo los superadministradores pueden acceder a este módulo.',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        window.history.back();
        return;
    }

    // Si llegó aquí, es superadmin
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    loadUsers();
}

let usersGlobal = [];

async function loadUsers() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/users/superus/all`, { // Actualizado el endpoint
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 403) {
            await Swal.fire({
                title: 'Acceso denegado',
                text: 'No tienes permisos para ver esta información.',
                icon: 'warning',
                confirmButtonText: 'Entendido'
            });
            window.history.back();
            return;
        }

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();

        if (response.ok && data.success) {
            usersGlobal = data.data;
            buildTable(usersGlobal);
            conteoUsuariosTarjetas();
        } else {
            throw new Error(data.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error al cargar los usuarios:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los usuarios. Por favor, intente nuevamente.',
            confirmButtonText: 'Entendido'
        });
        window.history.back();
    }
}

function handleError(message) {
    console.error(message);
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        showConfirmButton: true
    });
}

function buildTable(data) {
    const tableContainer = document.getElementById("table-container");

    const table = new Tabulator(tableContainer, {
        data: data,
        layout: "fitColumns",
        responsiveLayout: "collapse",
        tableClass: "table table-striped table-bordered table-hover",
        pagination: "local",
        paginationSize: 10,
        locale: true,
        langs: {
            "es-419": {
                "columns": {
                    "name": "Nombre",
                    "surname": "Apellido",
                    "email": "Correo",
                    "phone": "Teléfono",
                    "address": "Dirección",
                    "city": "Ciudad",
                    "role": "Rol",
                    "status": "Estado",
                    "birthdate": "Fecha de Nacimiento"
                },
                "pagination": {
                    "first": "Primera",
                    "first_title": "Primera página",
                    "last": "Última",
                    "last_title": "Última página",
                    "prev": "Anterior",
                    "prev_title": "Página anterior",
                    "next": "Siguiente",
                    "next_title": "Página siguiente",
                    "page_size": "Tamaño de página",
                },
                "data": {
                    "loading": "Cargando datos...",
                    "error": "Error al cargar datos.",
                }
            },
        },
        initialLocale: "es-419",
        paginationSizeSelector: [10, 20, 50, 100],
        columns: [
            { title: "ID", field: "id", width: 80, hozAlign: "center", headerSort: false },
            { title: "Nombre", field: "name", widthGrow: 1 },
            { title: "Apellido", field: "surname", widthGrow: 1 },
            { title: "Correo", field: "email", widthGrow: 2 },
            { title: "Teléfono", field: "phone", widthGrow: 1 },
            { title: "Dirección", field: "address", widthGrow: 2 },
            { title: "Ciudad", field: "city", widthGrow: 1 },
            {
                title: "Rol",
                field: "role",
                widthGrow: 1,
                formatter: (cell) => {
                    const role = cell.getValue();
                    const icon = role === 'admin' ? 'bi-key' : 'bi-person';
                    return `<i class="bi ${icon}"></i> ${role}`;
                },
                cellClick: (e, cell) => {
                    const role = cell.getValue();
                    if (role === 'admin') {
                        cell.getElement().style.backgroundColor = 'lightgreen';
                    }
                }
            },
            {
                title: "Estado",
                field: "status",
                widthGrow: 1,
                formatter: (cell) => {
                    const status = cell.getValue() === 'true';
                    return `
                        <label class="toggle-switch">
                            <input type="checkbox" ${status ? 'checked' : ''} class="status-switch">
                            <span class="slider"></span>
                        </label>
                    `;
                },
                cellClick: async (e, cell) => {
                    const userId = cell.getRow().getData().id;
                    const currentStatus = cell.getValue() === 'true';
                    const newStatus = !currentStatus;

                    const result = await Swal.fire({
                        title: `¿Estás seguro de que deseas ${newStatus ? 'activar' : 'desactivar'} este usuario?`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Sí, cambiar",
                        cancelButtonText: "Cancelar",
                    });

                    if (result.isConfirmed) {
                        toggleUserStatus(userId, newStatus, cell);
                    }
                }
            },
            {
                title: "Acciones",
                field: "acciones",
                hozAlign: "center",
                formatter: () => `
                    <button class='btn fondo-amarillo btn-sm edit-btn'><i class="bi bi-pencil-square"></i></button>
                    <button class='btn fondo-rojo btn-sm delete-btn'><i class="bi bi-trash3-fill"></i></button>
                `,
                cellClick: (e, cell) => {
                    const target = e.target.closest('button');
                    const userId = cell.getRow().getData().id;

                    if (target && target.classList.contains('edit-btn')) {
                        loadUserData(userId); // Precargar datos en el formulario de actualización
                    } else if (target && target.classList.contains('delete-btn')) {
                        deleteUser(userId, cell.getRow());
                    }
                },
                widthGrow: 2
            }
        ],
    });

    console.log("Tabla creada con éxito");
}

async function toggleUserStatus(userId, newStatus, cell) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/users/superus/status/${userId}`, { // Actualizado el endpoint
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus })
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
            cell.setValue(newStatus ? 'true' : 'false');
            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: responseData.message || "El estado del usuario ha sido cambiado con éxito.",
                timer: 1500,
                showConfirmButton: false,
            });
        } else {
            throw new Error(responseData.message || "No se pudo cambiar el estado del usuario.");
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message,
            timer: 2000,
            showConfirmButton: false,
        });
        console.error("Error al cambiar el estado del usuario:", error);
    }
}

async function editUser(userId) {
    // Lógica para editar usuario
    console.log(`Editar usuario con ID: ${userId}`);
}

async function deleteUser(userId, row) {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: "error",
            title: "Autenticación requerida",
            text: "No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.",
        });
        return;
    }

    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás recuperar este usuario después de eliminarlo.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`https://grupouno.click/user/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                row.delete();
                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: responseData.message || "El usuario ha sido eliminado con éxito.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: responseData.message || "No se pudo eliminar el usuario.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Ocurrió un problema al intentar eliminar el usuario.",
                timer: 2000,
                showConfirmButton: false,
            });
            console.error("Error al eliminar el usuario:", error);
        }
    }
}

let searchTimeout;

document.getElementById("searchInput").addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();

    clearTimeout(searchTimeout);

    if (searchTerm === '') {
        buildTable(usersGlobal);
        return;
    }

    searchTimeout = setTimeout(() => {
        const filteredUsers = usersGlobal.filter(user => {
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.surname.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm) ||
                   user.phone.toLowerCase().includes(searchTerm) ||
                   user.address.toLowerCase().includes(searchTerm) ||
                   user.city.toLowerCase().includes(searchTerm);
        });

        buildTable(filteredUsers);

        if (filteredUsers.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No se encontraron resultados',
                text: 'No se encontraron usuarios que coincidan con tu búsqueda.',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Resultados encontrados',
                text: `${filteredUsers.length} usuario(s) coinciden con tu búsqueda.`,
                showConfirmButton: false,
                timer: 1500
            });
        }
    }, 1500);
});

document.querySelectorAll('.card-clickeable').forEach(card => {
    card.addEventListener('click', () => {
        const cardId = card.id;
        filterUsers(cardId);
    });
});

function filterUsers(cardId) {
    let filteredUsers;

    if (cardId === 'cardTodos') {
        filteredUsers = usersGlobal;
    } else if (cardId === 'cardAdmins') {
        filteredUsers = usersGlobal.filter(user => user.role === 'admin');
    } else if (cardId === 'cardUsers') {
        filteredUsers = usersGlobal.filter(user => user.role === 'user');
    } else if (cardId === 'cardActivos') {
        filteredUsers = usersGlobal.filter(user => user.status === 'true');
    } else if (cardId === 'cardInactivos') {
        filteredUsers = usersGlobal.filter(user => user.status === 'false');
    }

    buildTable(filteredUsers);
}


function conteoUsuariosTarjetas() {
    const conteos = {
        total: 0,
        admins: 0,
        users: 0,
        activos: 0,
        inactivos: 0
    };

    for (let user of usersGlobal) {
        conteos.total++;
        if (user.role === 'admin') {
            conteos.admins++;
        } else if (user.role === 'user') {
            conteos.users++;
        }
        if (user.status === 'true') {
            conteos.activos++;
        } else {
            conteos.inactivos++;
        }
    }

    document.getElementById('totalUsers').innerText = conteos.total;
    document.getElementById('totalAdmins').innerText = conteos.admins;
    document.getElementById('totalUser').innerText = conteos.users;
    document.getElementById('totalActivos').innerText = conteos.activos;
    document.getElementById('totalInactivos').innerText = conteos.inactivos;
}

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