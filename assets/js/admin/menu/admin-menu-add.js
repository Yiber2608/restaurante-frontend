'use strict';

const cloudName = 'dgabtcr2m';
const uploadPreset = 'ml_default';
const apiKey = '848622327782151';

let pond;

// Inicializar FilePond cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
    // Registrar el plugin de vista previa de imagen
    FilePond.registerPlugin(FilePondPluginImagePreview)

    // Crear la instancia de FilePond
    pond = FilePond.create(document.querySelector('input[type="file"].filepond'), {
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
        styleItemPanelAspectRatio: 1,
        stylePanelLayout: 'compact'
    })
});

const form = document.querySelector('#addItemForm');
const saveButton = document.querySelector('#saveItems');

// Function to validate text input
function validateTextInput(input, minLength, maxLength, fieldName) {
    const trimmedInput = input.trim();
    const invalidChars = /[<>{}[\]\\]/;
    if (trimmedInput.length < minLength || trimmedInput.length > maxLength) {
        Swal.fire({
            icon: 'error',
            title: 'Error en la validación',
            text: `${fieldName} debe tener entre ${minLength} y ${maxLength} caracteres.`,
        });
        return false;
    }
    if (invalidChars.test(trimmedInput)) {
        Swal.fire({
            icon: 'error',
            title: 'Error en la validación',
            text: `${fieldName} contiene caracteres no válidos.`,
        });
        return false;
    }
    return true;
}

function validatePrice(price) {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 1000000) {
        Swal.fire({
            icon: 'error',
            title: 'Error en la validación',
            text: 'El precio debe ser un número positivo y no mayor a 1,000,000.',
        });
        return false;
    }
    return true;
}

let isSubmitting = false;

function obtenerDatosFormulario() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('itemDescription').value;
    const typeItem = document.getElementById('typeItem').value;
    const unitPrice = document.getElementById('unitPrice').value;
    const status = document.getElementById('status').checked;

    return { name, description, typeItem, unitPrice, status };
}

function validarCamposFormulario(name, description, typeItem, unitPrice) {
    if (
        !validateTextInput(name, 3, 50, 'Nombre') ||
        !validateTextInput(description, 20, 150, 'Descripción') ||
        !validateTextInput(typeItem, 3, 30, 'Tipo de ítem') ||
        !validatePrice(unitPrice)
    ) {
        return false;
    }
    return true;
}

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

function crearObjetoProducto(name, description, typeItem, unitPrice, status, imageUrl, imageName) {
    return {
        name: name.trim(),
        status: status,
        typeItem: typeItem.trim(),
        unitPrice: parseFloat(unitPrice).toFixed(2),
        description: description.trim(),
        imageUrl,
        imageName,
    };
}

// Función para resetear el formulario
function resetForm() {
    form.reset();
    form.classList.remove('was-validated');
    pond.removeFiles(); // Limpiar FilePond
}

saveButton.addEventListener('click', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const { name, description, typeItem, unitPrice, status } = obtenerDatosFormulario();

    if (!validarCamposFormulario(name, description, typeItem, unitPrice)) {
        return;
    }

    const pondFile = pond.getFile();
    if (!pondFile) {
        Swal.fire({
            icon: 'warning',
            title: 'Imagen requerida',
            text: 'Por favor, selecciona una imagen.',
        });
        return;
    }

    isSubmitting = true;
    saveButton.disabled = true;

    try {
        const result = await uploadImage(pondFile.file);
        const imageUrl = result.secure_url;
        const imageName = result.public_id;

        const itemData = crearObjetoProducto(name, description, typeItem, unitPrice, status, imageUrl, imageName);

        await enviarDatosAlServidor(itemData);
        resetForm();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al procesar la solicitud. Por favor, inténtalo de nuevo.',
        });
    } finally {
        isSubmitting = false;
        saveButton.disabled = false;
    }
});

async function enviarDatosAlServidor(itemData) {
    const token = localStorage.getItem('token');

    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Autenticación requerida',
            text: 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.',
        });
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/items/private`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
            loadData();
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: responseData.message || 'El producto ha sido guardado correctamente en el servidor.',
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar el producto',
                text: responseData.message || 'Error desconocido al guardar el producto',
            });
        }
    } catch (error) {
        console.error('Error al guardar el producto:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar el producto',
            text: 'Hubo un problema al conectar con el servidor. Por favor, intenta nuevamente.',
        });
    }
}