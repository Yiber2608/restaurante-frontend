// Función para eliminar una reseña
async function deleteResena(reviewId, row) {
    const token = localStorage.getItem("token"); // Obtener el token de autenticación

    if (!token) {
        Swal.fire({
            icon: "error",
            title: "Autenticación requerida",
            text: "No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.",
        });
        return;
    }

    // Mostrar confirmación con SweetAlert
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás recuperar esta reseña después de eliminarla.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            // Realizar la petición de eliminación al backend
            const response = await fetch(`${window.API_BASE_URL}/api/v1/items/private/${reviewId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`, // Añadir el token al encabezado Authorization
                    "Content-Type": "application/json",
                },
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                // Si usas Tabulator
                if (row.delete) {
                    row.delete();  // Elimina la fila si es Tabulator
                } else {
                    // Si no es Tabulator, intenta eliminar el nodo del DOM de la fila
                    row.getElement().remove(); // Asegúrate de que `getElement()` devuelve el nodo correcto.
                }

                // Mostrar el mensaje del servidor en caso de éxito
                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: responseData.message || "La reseña ha sido eliminada con éxito.",
                    timer: 1500,
                    showConfirmButton: false,
                });

                // Aquí puedes hacer cualquier otra acción, como actualizar el conteo de reseñas
                // Asegúrate de tener la función `conteoResenas` o eliminarla si no la necesitas
                // conteoResenas();  // Elimina esta línea si no tienes esta función.
            } else {
                // Mostrar el mensaje de error desde el servidor
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: responseData.message || "No se pudo eliminar la reseña.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            // Manejo de errores generales
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Ocurrió un problema al intentar eliminar la reseña.",
                timer: 2000,
                showConfirmButton: false,
            });
            console.error("Error al eliminar la reseña:", error);
        }
    }
}
