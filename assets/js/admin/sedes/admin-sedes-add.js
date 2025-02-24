'use strict';

const cloudName = 'dgabtcr2m';
const uploadPreset = 'ml_default';

let pond;

document.addEventListener("DOMContentLoaded", () => {
    FilePond.registerPlugin(FilePondPluginImagePreview);
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
    });

    const addBranchForm = document.getElementById("addBranchForm");
    if (addBranchForm) {
        addBranchForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (addBranchForm.checkValidity()) {
                await addBranch();
            } else {
                addBranchForm.classList.add('was-validated');
                console.log("Formulario no válido");
            }
        });
    }
});

const form = document.querySelector('#addBranchForm');
const saveButton = document.querySelector('#saveBranch');

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

let isSubmitting = false;

function obtenerDatosFormulario() {
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const description = document.getElementById('description').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const capacity = document.getElementById('capacity').value;

    return { name, address, description, latitude, longitude, capacity };
}

function validarCamposFormulario(name, address, description, latitude, longitude, capacity) {
    console.log("Validando campos del formulario");
    if (
        !validateTextInput(name, 3, 50, 'Nombre') ||
        !validateTextInput(address, 10, 100, 'Dirección') ||
        !validateTextInput(description, 20, 150, 'Descripción') ||
        latitude.trim() === '' || isNaN(parseFloat(latitude)) ||
        longitude.trim() === '' || isNaN(parseFloat(longitude)) ||
        isNaN(capacity) || capacity <= 0
    ) {
        Swal.fire({
            icon: 'error',
            title: 'Error en la validación',
            text: 'Por favor, completa todos los campos correctamente.',
        });
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

function crearObjetoSede(name, address, description, latitude, longitude, capacity, imageUrl, userId = 1) {
    return {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        capacity: parseInt(capacity),
        image: imageUrl,
        userId: userId
    };
}

function resetForm() {
    form.reset();
    form.classList.remove('was-validated');
    pond.removeFiles();
}

if (saveButton) {
    saveButton.addEventListener('click', async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        const { name, address, description, latitude, longitude, capacity } = obtenerDatosFormulario();

        if (!validarCamposFormulario(name, address, description, latitude, longitude, capacity)) {
            return;
        }

        const pondFile = pond.getFile();
        if (!pondFile || !pondFile.file) {
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
            Swal.fire({
                title: 'Subiendo imagen...',
                html: 'Por favor espera mientras se sube la imagen.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const result = await uploadImage(pondFile.file);
            const imageUrl = result.secure_url;

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token no encontrado en localStorage');
                return;
            }

            let userId = 1; // Valor por defecto
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                userId = decodedToken.userId || 1; // Obtener userId del token o usar el valor por defecto
                console.log('UserID obtenido:', userId);
            } catch (error) {
                console.error('Error al decodificar el token:', error);
            }

            const sedeData = crearObjetoSede(name, address, description, latitude, longitude, capacity, imageUrl, userId);

            console.log('Datos preparados para enviar:', sedeData); // Imprimir JSON enviado

            Swal.fire({
                title: 'Guardando sede...',
                html: 'Por favor espera mientras se guarda la sede.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await enviarDatosAlServidor(sedeData);
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
}

async function enviarDatosAlServidor(sedeData) {
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
        const response = await fetch('http://localhost:8080/api/v1/branches', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sedeData),
        });

        const responseData = await response.json();

        console.log('Código de estado HTTP:', response.status);
        console.log('Cuerpo de la respuesta:', responseData); // Imprimir respuesta del servidor

        if (response.ok && responseData.success) {
            loadBranches();
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: responseData.message || 'La sede ha sido guardada correctamente en el servidor.',
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar la sede',
                text: responseData.message || 'Error desconocido al guardar la sede',
            });
        }
    } catch (error) {
        console.error('Error al guardar la sede:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar la sede',
            text: 'Hubo un problema al conectar con el servidor. Por favor, intenta nuevamente.',
        });
    }
}

async function addBranch() {
    const token = localStorage.getItem('token');
    const formData = new FormData(document.getElementById("addBranchForm"));

    try {
        const response = await fetch('http://localhost:8080/api/v1/branches', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Sede agregada',
                text: 'La sede ha sido agregada exitosamente.',
                showConfirmButton: true
            });
            loadBranches();
        } else {
            handleError(`Error en la respuesta: ${data.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al agregar la sede:', error);
        handleError('Error al agregar la sede. Por favor, intente nuevamente.');
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