let imageNameEdit = ""
let pondUpdate = ""

// Inicializar FilePond
document.addEventListener("DOMContentLoaded", () => {
    // Registrar el plugin de vista previa de imagen
    FilePond.registerPlugin(FilePondPluginImagePreview)

    // Crear la instancia de FilePond
    pondUpdate = FilePond.create(document.querySelector('input[type="file"].filepond'), {
        allowMultiple: false,
        acceptedFileTypes: ["image/*"],
        maxFileSize: "5MB",
        stylePanelAspectRatio: 1,
        labelIdle: '<i class="bi bi-cloud-arrow-up" style="font-size: 2rem;"></i>',
        labelMaxFileSizeExceeded: "El archivo es demasiado grande",
        labelFileTypeNotAllowed: "Tipo de archivo no válido",
        labelFileProcessing: "Cargando",
        labelFileProcessingComplete: "Carga completa",
        labelFileProcessingAborted: "Carga cancelada",
        labelFileProcessingError: "Error durante la carga",
        labelFileRemoveError: "Error durante la eliminación",
        labelTapToCancel: "toca para cancelar",
        labelTapToRetry: "toca para volver a intentar",
        labelTapToUndo: "toca para deshacer",
    })
})

// Función para cargar los datos del ítem en el modal de actualización
function loadDataById(itemId) {

    console.log("dentro de loadDataById")
    const item = itemsGlobal.find((item) => item.id === itemId)
    if (!item) {
        console.error("Ítem no encontrado")
        return
    }

    imageNameEdit = item.imageName

    document.getElementById("updateName").value = item.name
    document.getElementById("updateStatus").checked = item.status
    document.getElementById("updateTypeItem").value = item.typeItem
    document.getElementById("updateUnitPrice").value = item.unitPrice
    document.getElementById("updateItemDescription").value = item.description

    // Actualizar FilePond con la imagen actual
    if (item.imageUrl) {
        pondUpdate.addFile(item.imageUrl)
    } else {
        pondUpdate.removeFile()
    }

    document.getElementById("createdDate").textContent = `Fecha de Creación: ${new Date(item.createdAt).toLocaleString()}`
    document.getElementById("updatedDate").textContent =
        `Fecha de Última Actualización: ${new Date(item.updatedAt).toLocaleString()}`

    const updateItemForm = document.getElementById("updateItemForm")
    updateItemForm.dataset.itemId = itemId
    updateItemForm.dataset.currentImageUrl = item.imageUrl || ""
    updateItemForm.dataset.currentImageName = item.imageName || ""

    const updateModal = new bootstrap.Modal(document.getElementById("updateItems"))
    updateModal.show()
}

// Función para manejar el envío del formulario de actualización
document.getElementById("updateItemForm").addEventListener("submit", function (e) {
    e.preventDefault()

    const itemId = this.dataset.itemId
    const currentImageUrl = this.dataset.currentImageUrl
    const currentImageName = this.dataset.currentImageName

    const name = document.getElementById("updateName").value
    const status = document.getElementById("updateStatus").checked
    const typeItem = document.getElementById("updateTypeItem").value
    const unitPrice = document.getElementById("updateUnitPrice").value
    const description = document.getElementById("updateItemDescription").value

    if (!validateUpdateForm(name, description, unitPrice, typeItem)) {
        return
    }

    const pondFile = pondUpdate.getFile()

    if (pondFile) {
        // Si hay un archivo de imagen nuevo, subir primero la nueva imagen
        uploadImage(pondFile.file)
            .then((result) => {
                // Subir nueva imagen y luego eliminar la anterior
                deletePreviousImage(imageNameEdit)
                    .then(() => {
                        updateItem(itemId, name, status, typeItem, unitPrice, description, result.secure_url, result.public_id)
                    })
                    .catch((error) => {
                        console.error("Error al eliminar la imagen previa:", error)
                        Swal.fire("Error", "No se pudo eliminar la imagen anterior", "error")
                    })
            })
            .catch((error) => {
                console.error("Error al subir la imagen:", error)
                Swal.fire("Error", "No se pudo subir la imagen", "error")
            })
    } else {
        // Si no hay una imagen nueva, solo actualizamos los datos
        updateItem(itemId, name, status, typeItem, unitPrice, description, currentImageUrl, currentImageName)
    }
})
// Función para validar el formulario de actualización
function validateUpdateForm(name, description, unitPrice, typeItem) {
    if (!name || name.trim().length < 3) {
        Swal.fire('Error', 'El nombre debe tener al menos 3 caracteres', 'error');
        return false;
    }
    if (!description || description.trim().length < 10) {
        Swal.fire('Error', 'La descripción debe tener al menos 10 caracteres', 'error');
        return false;
    }
    if (!unitPrice || isNaN(unitPrice) || parseFloat(unitPrice) <= 0) {
        Swal.fire('Error', 'El precio debe ser un número positivo', 'error');
        return false;
    }
    if (!typeItem) {
        Swal.fire('Error', 'Debe seleccionar un tipo de ítem', 'error');
        return false;
    }
    return true;
}

// Función para subir la imagen a Cloudinary
function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        fetch(url, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                if (result.secure_url && result.public_id) {
                    resolve(result);
                } else {
                    reject(new Error('No se pudo obtener la URL segura de Cloudinary'));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Función para eliminar una imagen previa del servidor
async function deletePreviousImage(publicId) {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Autenticación requerida',
            text: 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.',
        });
        return;
    }
    if (!publicId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El identificador de la imagen (publicId) no puede estar vacío.',
        });
        return;
    }
    try {
        const dataToSend = { publicId: publicId };
        const response = await fetch(`${window.API_BASE_URL}/api/v2/private/delete`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        });
        const responseData = await response.json();
        if (response.ok && responseData.success) {
            console.log("Se subio correctamente la imagen ")
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al eliminar la imagen',
                text: responseData.message || 'No se pudo eliminar la imagen.',
                timer: 2000,
                showConfirmButton: false,
            });
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al eliminar la imagen',
            text: 'Ocurrió un problema al intentar eliminar la imagen.',
            timer: 2000,
            showConfirmButton: false,
        });
    }
}

// Función para enviar la solicitud de actualización al servidor
function updateItem(itemId, name, status, typeItem, unitPrice, description, imageUrl, imageName) {
    const token = localStorage.getItem('token'); // Obtener el token de autenticación

    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Autenticación requerida',
            text: 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.',
        });
        return;
    }

    const updatedData = {
        id: itemId,
        name: name,
        status: status,
        typeItem: typeItem,
        unitPrice: parseFloat(unitPrice),
        description: description,
        imageUrl: imageUrl,
        imageName: imageName
    };

    console.log('JSON generado para actualizar:', updatedData);

    $.ajax({
        url: `https://grupouno.click/api/v1/items/private`,
        type: 'PUT',
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${token}` // Agregar el token al encabezado Authorization
        },
        data: JSON.stringify(updatedData),
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Producto actualizado',
                text: 'El producto ha sido actualizado correctamente en el servidor.',
            });
            bootstrap.Modal.getInstance(document.getElementById('updateItems')).hide();
            loadData();
        },
        error: function (xhr, status, error) {
            console.error('Error en la solicitud:', xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error al actualizar el producto',
                text: `Hubo un problema al actualizar el producto: ${error}`,
            });
        }
    });
}
