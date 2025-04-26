document.addEventListener("DOMContentLoaded", () => {
    const updateNewsForm = document.getElementById("updateNewsForm");

    updateNewsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (updateNewsForm.checkValidity()) {
            const id = document.getElementById("updateId").value;
            const title = document.getElementById("updateTitle").value;
            const description = document.getElementById("updateDescription").value;
            const publicationDate = document.getElementById("updatePublicationDate").value;
            const expirationDate = document.getElementById("updateExpirationDate").value;
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
                id: id,
                title: title,
                description: description,
                publicationDate: `${publicationDate}T10:00:00`,
                expirationDate: `${expirationDate}T23:59:59`,
                userId: userId
            };

            console.log("Datos enviados:", newsData); // Imprimir el objeto enviado

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${window.API_BASE_URL}/api/v1/news/private`, {
                    method: "PUT",
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
                        text: responseData.message || "La novedad ha sido actualizada con éxito.",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    updateNewsForm.reset();
                    $('#updateNews').modal('hide');
                    loadNews(); // Recargar la tabla de novedades
                } else {
                    throw new Error(responseData.message || "No se pudo actualizar la novedad.");
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message,
                    timer: 2000,
                    showConfirmButton: false,
                });
                console.error("Error al actualizar la novedad:", error);
            }
        }

        updateNewsForm.classList.add("was-validated");
    });
});

function loadNewsById(newsId) {
    const news = newsGlobal.find(item => item.id === newsId);
    if (news) {
        document.getElementById("updateId").value = news.id;
        document.getElementById("updateTitle").value = news.title;
        document.getElementById("updateDescription").value = news.description;
        document.getElementById("updatePublicationDate").value = news.publicationDate.split("T")[0];
        document.getElementById("updateExpirationDate").value = news.expirationDate.split("T")[0];
        document.getElementById("updateCreatedAt").innerHTML = `<i class="bi bi-calendar-event"></i> ${new Date(news.createdAt).toLocaleString()}`;
        document.getElementById("updateUpdatedAt").innerHTML = `<i class="bi bi-pencil-square"></i> ${new Date(news.updatedAt).toLocaleString()}`;
        $('#updateNews').modal('show');
    } else {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cargar la novedad.",
            timer: 2000,
            showConfirmButton: false,
        });
        console.error("Error al cargar la novedad:", error);
    }
}
