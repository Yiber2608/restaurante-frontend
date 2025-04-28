// Variables globales para el calendario de configuración
let settingsCalendar;
let selectedDates = [];
let currentBranchId;

document.addEventListener("DOMContentLoaded", () => {
    initializeSettingsCalendar();
    setupSettingsForm();
});

// Inicializar el calendario de configuración
function initializeSettingsCalendar() {
    const calendarEl = document.getElementById('settingsCalendar');
    if (!calendarEl) return;
    
    settingsCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        locale: 'es',
        selectable: true,
        select: handleDateSelection,
        unselect: handleDateUnselection,
        dateClick: handleDateClick,
        events: [], // Los eventos se cargarán dinámicamente
        eventDisplay: 'block',
        eventColor: '#007bff'
    });
    
    settingsCalendar.render();
}

// Manejar la selección de fechas en el calendario
function handleDateSelection(selectInfo) {
    const startDate = new Date(selectInfo.startStr);
    let endDate = new Date(selectInfo.endStr);
    
    // Corregir la fecha de fin (FullCalendar usa fecha exclusiva)
    endDate.setDate(endDate.getDate() - 1);
    
    const dates = [];
    let currentDate = new Date(startDate);
    
    // Generar todas las fechas seleccionadas
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Añadir las nuevas fechas al array de selección
    dates.forEach(date => {
        const dateStr = formatDateToYMD(date);
        if (!selectedDates.includes(dateStr)) {
            selectedDates.push(dateStr);
            addDateToCalendar(dateStr);
        }
    });
}

// Manejar la cancelación de selección de fechas
function handleDateUnselection() {
    // No hacemos nada, queremos que las fechas permanezcan seleccionadas
}

// Manejar clic en una fecha individual
function handleDateClick(info) {
    const dateStr = info.dateStr;
    const index = selectedDates.indexOf(dateStr);
    
    // Si la fecha ya está seleccionada, la quitamos
    if (index !== -1) {
        selectedDates.splice(index, 1);
        removeDateFromCalendar(dateStr);
    } else {
        // Si no está seleccionada, la añadimos
        selectedDates.push(dateStr);
        addDateToCalendar(dateStr);
    }
}

// Añadir una fecha como evento al calendario
function addDateToCalendar(dateStr) {
    settingsCalendar.addEvent({
        id: dateStr,
        title: 'Disponible',
        start: dateStr,
        allDay: true
    });
}

// Eliminar una fecha del calendario
function removeDateFromCalendar(dateStr) {
    const event = settingsCalendar.getEventById(dateStr);
    if (event) {
        event.remove();
    }
}

// Configurar el formulario de ajustes
function setupSettingsForm() {
    // Configurar valores por defecto
    document.getElementById('reservationDuration').value = '60';
    document.getElementById('capacityPerSlot').value = '20';
    
    // Asegurarse de que los valores son números válidos
    document.getElementById('reservationDuration').addEventListener('input', function() {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 30) {
            this.value = '30';
        } else if (value > 180) {
            this.value = '180';
        }
        
        // Asegurarnos de que es un múltiplo de 30
        value = Math.round(value / 30) * 30;
        this.value = value.toString();
    });
    
    document.getElementById('capacityPerSlot').addEventListener('input', function() {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
            this.value = '1';
        }
    });
}

// Cargar la configuración actual de una sede
async function loadBranchSchedule(branchId) {
    if (!branchId) return;
    
    currentBranchId = branchId;
    
    try {
        const token = localStorage.getItem('token');
        // Endpoint adaptado según la documentación de BurgerBoom
        const response = await fetch(`${window.API_BASE_URL}/api/business-hours/branch/${branchId}/schedule`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Adaptar datos al formato esperado por la interfaz
            const settings = {
                days: data.data.schedule.filter(day => day.isOpen).map(day => day.dayOfWeek),
                openingTime: data.data.schedule[0]?.openingTime || "08:00", // Tomar del primer día o valor predeterminado
                closingTime: data.data.schedule[0]?.closingTime || "22:00", // Tomar del primer día o valor predeterminado
                reservationDuration: 60, // Valor predeterminado
                capacityPerSlot: 20 // Valor predeterminado
            };
            
            populateSettingsForm(settings);
        } else {
            showError('Error al cargar la configuración:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar la configuración:', error);
        showError('Error de conexión', 'No se pudo cargar la configuración. Verifica tu conexión a internet.');
    }
}

// Rellenar el formulario con los datos de configuración
function populateSettingsForm(settings) {
    // Limpiar selecciones anteriores
    selectedDates = [];
    settingsCalendar.getEvents().forEach(event => event.remove());
    
    // Añadir fechas disponibles
    if (settings.availableDates && settings.availableDates.length > 0) {
        settings.availableDates.forEach(dateStr => {
            selectedDates.push(dateStr);
            addDateToCalendar(dateStr);
        });
    }
    
    // Configurar días de operación
    document.getElementById('mondayCheck').checked = settings.days?.includes('MONDAY') || false;
    document.getElementById('tuesdayCheck').checked = settings.days?.includes('TUESDAY') || false;
    document.getElementById('wednesdayCheck').checked = settings.days?.includes('WEDNESDAY') || false;
    document.getElementById('thursdayCheck').checked = settings.days?.includes('THURSDAY') || false;
    document.getElementById('fridayCheck').checked = settings.days?.includes('FRIDAY') || false;
    document.getElementById('saturdayCheck').checked = settings.days?.includes('SATURDAY') || false;
    document.getElementById('sundayCheck').checked = settings.days?.includes('SUNDAY') || false;
    
    // Configurar horarios
    if (settings.openingTime) {
        document.getElementById('openingTime').value = settings.openingTime;
    }
    
    if (settings.closingTime) {
        document.getElementById('closingTime').value = settings.closingTime;
    }
    
    // Configurar duración y capacidad
    if (settings.reservationDuration) {
        document.getElementById('reservationDuration').value = settings.reservationDuration;
    }
    
    if (settings.capacityPerSlot) {
        document.getElementById('capacityPerSlot').value = settings.capacityPerSlot;
    }
}

// Guardar la configuración de horarios
async function saveScheduleSettings() {
    if (!currentBranchId) {
        showError('Error', 'No se ha seleccionado ninguna sede.');
        return;
    }
    
    // Recopilar días seleccionados
    const days = [];
    if (document.getElementById('mondayCheck').checked) days.push('MONDAY');
    if (document.getElementById('tuesdayCheck').checked) days.push('TUESDAY');
    if (document.getElementById('wednesdayCheck').checked) days.push('WEDNESDAY');
    if (document.getElementById('thursdayCheck').checked) days.push('THURSDAY');
    if (document.getElementById('fridayCheck').checked) days.push('FRIDAY');
    if (document.getElementById('saturdayCheck').checked) days.push('SATURDAY');
    if (document.getElementById('sundayCheck').checked) days.push('SUNDAY');
    
    if (days.length === 0) {
        showError('Error', 'Debes seleccionar al menos un día de operación.');
        return;
    }
    
    // Recopilar horarios
    const openingTime = document.getElementById('openingTime').value;
    const closingTime = document.getElementById('closingTime').value;
    
    if (!openingTime || !closingTime) {
        showError('Error', 'Debes configurar los horarios de apertura y cierre.');
        return;
    }
    
    // Validar que hora de apertura sea anterior a hora de cierre
    if (openingTime >= closingTime) {
        showError('Error', 'La hora de apertura debe ser anterior a la hora de cierre.');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        Swal.fire({
            title: 'Guardando configuración',
            html: 'Por favor espera mientras se guarda la configuración.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Crear array con todos los días de la semana (requerido por BurgerBoom)
        const allDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        const businessHours = allDays.map(day => ({
            dayOfWeek: day,
            openingTime: openingTime + ":00", // Añadir segundos según formato requerido
            closingTime: closingTime + ":00", // Añadir segundos según formato requerido
            isOpen: days.includes(day) // true si el día está seleccionado, false si no
        }));
        
        // Endpoint adaptado según la documentación de BurgerBoom
        const response = await fetch(`${window.API_BASE_URL}/api/business-hours/branch/${currentBranchId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(businessHours),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Configuración guardada',
                text: 'La configuración de horarios se ha guardado correctamente.'
            });
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            modal.hide();
        } else {
            showError('Error al guardar la configuración:', data.message);
        }
    } catch (error) {
        console.error('Error al guardar la configuración:', error);
        showError('Error de conexión', 'No se pudo guardar la configuración. Verifica tu conexión a internet.');
    }
}

// Funciones de utilidad
function formatDateToYMD(date) {
    return date.toISOString().split('T')[0];
}

function showError(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
    });
}

// Exportar funciones para uso en otros archivos
export { loadBranchSchedule, saveScheduleSettings };
