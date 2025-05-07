async function deleteBranch(branchId, row) {
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
        text: "No podrás recuperar esta sede después de eliminarla.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`${window.API_BASE_URL}api/v1/api/v1/branches/${branchId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                if (row.delete) {
                    row.delete();
                } else {
                    row.getElement().remove();
                }

                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: responseData.message || "La sede ha sido eliminada con éxito.",
                    timer: 1500,
                    showConfirmButton: false,
                });

                loadBranches();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: responseData.message || "No se pudo eliminar la sede.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Ocurrió un problema al intentar eliminar la sede.",
                timer: 2000,
                showConfirmButton: false,
            });
            console.error("Error al eliminar la sede:", error);
        }
    }
}
