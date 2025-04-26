document.addEventListener("DOMContentLoaded", () => {
    const addNewsForm = document.getElementById("addNewsForm");

    addNewsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (addNewsForm.checkValidity()) {
            const title = document.getElementById("addTitle").value;
            const description = document.getElementById("addDescription").value;
            const publicationDate = document.getElementById("addPublicationDate").value;
            const expirationDate = document.getElementById("addExpirationDate").value;
            const userId = localStorage.getItem("userId"); // Asumiendo que el userId está almacenado en localStorage

            // Validar que la fecha de publicación no sea posterior a la fecha de expiración
            if (new Date(publicationDate) > new Date(expirationDate)) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "La fecha de publicación no puede ser posterior a la fecha de expiración.",
                    timer: 2000,
                    showConfirmButton: false,
                });
                return;
            }

            const newsData = {
                title: title,
                description: description,
                publicationDate: `${publicationDate}T10:00:00`,
                expirationDate: `${expirationDate}T23:59:59`,
                userId: userId
            };

            console.log("Datos enviados:", newsData); // Imprimir el objeto enviado
            console.log("Fecha de Publicación:", newsData.publicationDate); // Imprimir la fecha de publicación
            console.log("Fecha de Expiración:", newsData.expirationDate); // Imprimir la fecha de expiración

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${window.API_BASE_URL}/api/v1/news/private`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(newsData)
                });

                const responseData = await response.json();

                if (response.ok && responseData.success) {
                    Swal.fire({
                        icon: "success",
                        title: "¡Éxito!",
                        text: responseData.message || "La novedad ha sido creada con éxito.",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    addNewsForm.reset();
                    $('#addNews').modal('hide');
                    loadNews(); // Recargar la tabla de novedades
                } else {
                    throw new Error(responseData.message || "No se pudo crear la novedad.");
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message,
                    timer: 2000,
                    showConfirmButton: false,
                });
                console.error("Error al crear la novedad:", error);
            }
        }

        addNewsForm.classList.add("was-validated");
    });
});

function handleError(message) {
    console.error(message);
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        showConfirmButton: true
    });
}
