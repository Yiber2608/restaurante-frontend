const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function populateScheduleModal(branchId, businessHours) {
    const scheduleTimeline = document.getElementById('scheduleTimeline');
    scheduleTimeline.innerHTML = '';

    daysOfWeek.forEach(day => {
        const existingHour = businessHours.find(hour => hour.dayOfWeek === day);
        const isOpen = existingHour ? existingHour.isOpen : false;
        const openingTime = existingHour ? existingHour.openingTime : '';
        const closingTime = existingHour ? existingHour.closingTime : '';

        const card = document.createElement('div');
        card.className = `col-md-4 mb-3`;
        card.innerHTML = `
            <div class="card ${isOpen ? 'bg-success text-white' : 'bg-light'}">
                <div class="card-body">
                    <h5 class="card-title">${day}</h5>
                    <div class="form-check form-switch">
                        <input class="form-check-input toggle-day" type="checkbox" ${isOpen ? 'checked' : ''} data-day="${day}">
                        <label class="form-check-label">Activar</label>
                    </div>
                    <div class="mt-3">
                        <label>Apertura</label>
                        <input type="time" class="form-control opening-time" value="${openingTime}" ${isOpen ? '' : 'disabled'}>
                    </div>
                    <div class="mt-3">
                        <label>Cierre</label>
                        <input type="time" class="form-control closing-time" value="${closingTime}" ${isOpen ? '' : 'disabled'}>
                    </div>
                    ${existingHour ? `
                        <button class="btn btn-warning mt-3 update-hour-btn" data-id="${existingHour.id}" disabled>Editar</button>
                    ` : ''}
                </div>
            </div>
        `;
        scheduleTimeline.appendChild(card);
    });

    document.querySelectorAll('.toggle-day').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const card = this.closest('.card');
            const isChecked = this.checked;
            card.classList.toggle('bg-success', isChecked);
            card.classList.toggle('text-white', isChecked);
            card.querySelector('.opening-time').disabled = !isChecked;
            card.querySelector('.closing-time').disabled = !isChecked;
            const updateButton = card.querySelector('.update-hour-btn');
            if (updateButton) updateButton.disabled = !isChecked;
        });
    });

    document.querySelectorAll('.update-hour-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const id = this.dataset.id;
            const card = this.closest('.card');
            const openingTime = card.querySelector('.opening-time').value;
            const closingTime = card.querySelector('.closing-time').value;
            const isOpen = card.querySelector('.toggle-day').checked;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:8080/api/business-hours/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ dayOfWeek: card.querySelector('.card-title').textContent, openingTime, closingTime, isOpen }),
                });

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Horario actualizado',
                        text: 'El horario se actualizó correctamente.',
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo actualizar el horario.',
                    });
                }
            } catch (error) {
                console.error('Error al actualizar el horario:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un problema al intentar actualizar el horario.',
                });
            }
        });
    });
}

document.getElementById('saveScheduleButton').addEventListener('click', async () => {
    const branchId = document.getElementById('scheduleModal').dataset.branchId;
    const newHours = [];

    document.querySelectorAll('.card').forEach(card => {
        const isOpen = card.querySelector('.toggle-day').checked;
        if (isOpen) {
            const dayOfWeek = card.querySelector('.card-title').textContent;
            const openingTime = card.querySelector('.opening-time').value;
            const closingTime = card.querySelector('.closing-time').value;
            newHours.push({ dayOfWeek, openingTime, closingTime, isOpen });
        }
    });

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/business-hours/branch/${branchId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newHours),
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Horarios guardados',
                text: 'Los horarios se guardaron correctamente.',
            });
            const scheduleModal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
            scheduleModal.hide();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron guardar los horarios.',
            });
        }
    } catch (error) {
        console.error('Error al guardar los horarios:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al intentar guardar los horarios.',
        });
    }
});
