'use strict';

const cloudName = 'dgabtcr2m';
const uploadPreset = 'ml_default';

let pond;
let map; // Mapa Leaflet para agregar sede
let marker; // Marcador en el mapa

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

    // Inicializar el mapa
    initMap();

    // Agregar funcionalidad de búsqueda en tiempo real
    const addressInput = document.getElementById('addAddress');
    if (addressInput) {
        addressInput.addEventListener('input', handleAddressInput);
    }

    // Añadir funcionalidad de búsqueda
    const searchButton = document.getElementById('addSearchButton');
    if (searchButton) {
        searchButton.addEventListener('click', handleAddressSearch);
    }

    // Actualizar mapa al cambiar latitud y longitud manualmente
    document.getElementById('addLatitude').addEventListener('input', updateAddMapFromCoordinates);
    document.getElementById('addLongitude').addEventListener('input', updateAddMapFromCoordinates);

    // Actualizar mapa al cambiar la dirección
    document.getElementById('addAddress').addEventListener('input', handleAddAddressInput);
});

function initMap() {
    map = L.map('addMap', { zoomControl: false }).setView([4.6871, -74.0451], 13); // Centrado inicial (Bogotá)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }
        document.getElementById('addLatitude').value = lat.toFixed(6);
        document.getElementById('addLongitude').value = lng.toFixed(6);
    });

    // Asegurarse de que el mapa ocupe todo el área destinada
    setTimeout(() => {
        map.invalidateSize();
    }, 0);

    // Asegurarse de que el mapa se renderice correctamente al abrir el modal
    $('#addBranch').on('shown.bs.modal', function () {
        map.invalidateSize();
    });
}

function handleSearch() {
    const searchInput = document.getElementById('addAddress').value;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                map.setView([lat, lon], 13);

                if (marker) {
                    marker.setLatLng([lat, lon]);
                } else {
                    marker = L.marker([lat, lon]).addTo(map);
                }

                document.getElementById('addLatitude').value = parseFloat(lat).toFixed(6);
                document.getElementById('addLongitude').value = parseFloat(lon).toFixed(6);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Ubicación no encontrada',
                    text: 'No se encontró la ubicación. Por favor, intenta con otra búsqueda.'
                });
            }
        })
        .catch(error => {
            console.error('Error en la búsqueda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error en la búsqueda. Por favor, intenta de nuevo.'
            });
        });
}

function updateMapFromCoordinates() {
    const lat = parseFloat(document.getElementById('addLatitude').value);
    const lon = parseFloat(document.getElementById('addLongitude').value);

    if (!isNaN(lat) && !isNaN(lon)) {
        map.setView([lat, lon], 13);

        if (marker) {
            marker.setLatLng([lat, lon]);
        } else {
            marker = L.marker([lat, lon]).addTo(map);
        }
    }
}

function handleAddressInput() {
    const address = document.getElementById('addAddress').value;

    if (address.length > 3) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 13);

                    if (marker) {
                        marker.setLatLng([lat, lon]);
                    } else {
                        marker = L.marker([lat, lon]).addTo(map);
                    }

                    document.getElementById('addLatitude').value = parseFloat(lat).toFixed(6);
                    document.getElementById('addLongitude').value = parseFloat(lon).toFixed(6);
                }
            })
            .catch(error => {
                console.error('Error en la búsqueda de dirección:', error);
            });
    }
}

function handleAddressSearch() {
    const searchInput = document.getElementById('addAddress').value;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                map.setView([lat, lon], 13);

                if (marker) {
                    marker.setLatLng([lat, lon]);
                } else {
                    marker = L.marker([lat, lon]).addTo(map);
                }

                document.getElementById('addLatitude').value = parseFloat(lat).toFixed(6);
                document.getElementById('addLongitude').value = parseFloat(lon).toFixed(6);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Ubicación no encontrada',
                    text: 'No se encontró la ubicación. Por favor, intenta con otra búsqueda.'
                });
            }
        })
        .catch(error => {
            console.error('Error en la búsqueda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error en la búsqueda. Por favor, intenta de nuevo.'
            });
        });
}

function updateAddMapFromCoordinates() {
    const lat = parseFloat(document.getElementById('addLatitude').value);
    const lon = parseFloat(document.getElementById('addLongitude').value);

    if (!isNaN(lat) && !isNaN(lon)) {
        map.setView([lat, lon], 13);

        if (marker) {
            marker.setLatLng([lat, lon]);
        } else {
            marker = L.marker([lat, lon]).addTo(map);
        }
    }
}

function handleAddAddressInput() {
    const address = document.getElementById('addAddress').value;

    if (address.length > 3) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 13);

                    if (marker) {
                        marker.setLatLng([lat, lon]);
                    } else {
                        marker = L.marker([lat, lon]).addTo(map);
                    }

                    document.getElementById('addLatitude').value = parseFloat(lat).toFixed(6);
                    document.getElementById('addLongitude').value = parseFloat(lon).toFixed(6);
                }
            })
            .catch(error => {
                console.error('Error en la búsqueda de dirección:', error);
            });
    }
}

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
    const name = document.getElementById('addName').value;
    const address = document.getElementById('addAddress').value;
    const description = document.getElementById('addDescription').value;
    const latitude = document.getElementById('addLatitude').value;
    const longitude = document.getElementById('addLongitude').value;
    const capacity = document.getElementById('addCapacity').value;
    const phone = document.getElementById('addPhone').value;
    const email = document.getElementById('addEmail').value;
    const openingTime = document.getElementById('addOpeningTime').value;
    const closingTime = document.getElementById('addClosingTime').value;

    return { name, address, description, latitude, longitude, capacity, phone, email, openingTime, closingTime };
}

function validarCamposFormulario(name, address, description, latitude, longitude, capacity) {
    console.log("Validando campos del formulario");
    let isValid = true;

    if (!validateTextInput(name, 3, 50, 'Nombre')) {
        isValid = false;
        document.getElementById('addName').classList.add('is-invalid');
    } else {
        document.getElementById('addName').classList.remove('is-invalid');
    }

    if (!validateTextInput(address, 5, 100, 'Dirección')) {
        isValid = false;
        document.getElementById('addAddress').classList.add('is-invalid');
    } else {
        document.getElementById('addAddress').classList.remove('is-invalid');
    }

    if (!validateTextInput(description, 10, 150, 'Descripción')) {
        isValid = false;
        document.getElementById('addDescription').classList.add('is-invalid');
    } else {
        document.getElementById('addDescription').classList.remove('is-invalid');
    }

    if (latitude.trim() === '' || isNaN(parseFloat(latitude))) {
        isValid = false;
        document.getElementById('addLatitude').classList.add('is-invalid');
    } else {
        document.getElementById('addLatitude').classList.remove('is-invalid');
    }

    if (longitude.trim() === '' || isNaN(parseFloat(longitude))) {
        isValid = false;
        document.getElementById('addLongitude').classList.add('is-invalid');
    } else {
        document.getElementById('addLongitude').classList.remove('is-invalid');
    }

    if (isNaN(capacity) || capacity <= 0) {
        isValid = false;
        document.getElementById('addCapacity').classList.add('is-invalid');
    } else {
        document.getElementById('addCapacity').classList.remove('is-invalid');
    }

    if (!isValid) {
        Swal.fire({
            icon: 'error',
            title: 'Error en la validación',
            text: 'Por favor, completa todos los campos correctamente.',
        });
    }

    return isValid;
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

function crearObjetoSede(name, address, description, latitude, longitude, maxCapacity, imageUrl, userId) {
    return {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        phone: document.getElementById('addPhone').value.trim(),
        email: document.getElementById('addEmail').value.trim(),
        imageUrl: imageUrl,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        maxCapacity: parseInt(maxCapacity),
        openingTime: document.getElementById('addOpeningTime').value,
        closingTime: document.getElementById('addClosingTime').value,
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
            const userId = localStorage.getItem('userId'); // Obtener userId del localStorage

            if (!token || !userId) {
                console.error('Token o userId no encontrado en localStorage');
                return;
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

            const response = await fetch(`http://localhost:8080/api/v1/branches`, {
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

            if (response.ok) {
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
        const response = await fetch('https://grupouno.click/api/v1/branches/private', {
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
        const response = await fetch('https://grupouno.click/api/v1/branches', {
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