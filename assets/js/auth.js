let API_ENDPOINTS = {
    LOGIN: `${window.API_BASE_URL}/api/v1/users/login`,
    SIGNUP: `${window.API_BASE_URL}/api/v1/users/signup`,
    SEND_RESET_CODE: `${window.API_BASE_URL}/api/v1/users/sendResetCode`,
    RESET_PASSWORD: `${window.API_BASE_URL}/api/v1/users/resetPassword`
};

// Utility functions for validation
const ValidationUtils = {
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPassword: (password) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return passwordRegex.test(password);
    },

    isValidPhone: (phone) => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    },

    isAdult: (birthdate) => {
        const today = new Date();
        const birthdateDate = new Date(birthdate);
        const age = today.getFullYear() - birthdateDate.getFullYear();
        return age >= 18;
    }
};

class AuthenticationSystem {
    constructor() {
        this.initializeModals();
        this.attachEventListeners();
        this.setupFormValidation();
    }

    initializeModals() {
        // Add modals to the DOM
        document.body.insertAdjacentHTML('beforeend', `
            <!-- Login Modal -->
            <div class="modal fade" id="loginModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Iniciar Sesión</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="loginForm" novalidate>
                                <div class="mb-3">
                                    <input type="email" class="form-control" id="loginEmail" 
                                           placeholder="Correo electrónico" required>
                                    <div class="invalid-feedback">
                                        Por favor ingrese un correo válido
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <input type="password" class="form-control" id="loginPassword" 
                                           placeholder="Contraseña" required>
                                    <div class="invalid-feedback">
                                        La contraseña es requerida
                                    </div>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
                                </div>
                                <div class="mt-3 text-center">
                                    <a href="#" id="forgotPasswordLink">¿Olvidaste tu contraseña?</a>
                                    <br>
                                    <a href="#" id="showRegisterLink">¿No tienes cuenta? Regístrate</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Register Modal -->
            <div class="modal fade" id="registerModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog  modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Registro</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12 col-md-4 d-flex justify-content-center align-items-center ">
                                    <div class=" bg-gradient-primary-to-success rounded-circle shadow-lg" data-aos="zoom-in-down" data-aos-delay="750">
                                        <img class="profile-img img-fluid" src="./assets/img/fundador.png" alt="..." />
                                    </div>
                                </div>
                                <div class="col-12 col-md-8">
                                    <form id="registerForm" class="needs-validation" novalidate>
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <input type="text" class="form-control form-control-lg" id="registerName" placeholder="Nombre" required>
                                                <div class="invalid-feedback">El nombre es requerido</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <input type="text" class="form-control form-control-lg" id="registerSurname" placeholder="Apellido" required>
                                                <div class="invalid-feedback">El apellido es requerido</div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12 mb-3">
                                                <input type="email" class="form-control form-control-lg" id="registerEmail" placeholder="Correo electrónico" required>
                                                <div class="invalid-feedback">Ingrese un correo válido</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <input type="tel" class="form-control form-control-lg" id="registerPhone" placeholder="Teléfono" required>
                                                <div class="invalid-feedback">Ingrese un número de teléfono válido</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <input type="text" class="form-control form-control-lg" id="registerAddress" placeholder="Dirección" required>
                                            <div class="invalid-feedback">La dirección es requerida</div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <input type="text" class="form-control form-control-lg" id="registerCity" placeholder="Ciudad" required>
                                                <div class="invalid-feedback">La ciudad es requerida</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <input type="date" class="form-control form-control-lg" id="registerBirthdate" required>
                                                <div class="invalid-feedback">Debe ser mayor de edad</div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <input type="password" class="form-control form-control-lg" id="registerPassword" placeholder="Contraseña" required>
                                                <div class="invalid-feedback">La contraseña debe tener al menos 8 caracteres, una mayúscula y un número</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <input type="password" class="form-control form-control-lg" id="registerConfirmPassword" placeholder="Confirmar contraseña" required>
                                                <div class="invalid-feedback">Las contraseñas no coinciden</div>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-column justify-content-between">
                                            <button type="submit" class="btn btn-success btn-lg ">Registrarse</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Forgot Password Modal -->
            <div class="modal fade" id="forgotPasswordModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Restablecer Contraseña</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="forgotPasswordForm" novalidate>
                                <div class="mb-3">
                                    <input type="email" class="form-control" id="forgotPasswordEmail" 
                                           placeholder="Correo electrónico" required>
                                    <div class="invalid-feedback">
                                        Por favor ingrese un correo válido
                                    </div>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">Enviar Código</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enter Reset Code Modal -->
            <div class="modal fade" id="enterResetCodeModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Ingrese el Código de Restablecimiento</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="enterResetCodeForm" novalidate>
                                <div class="mb-3 d-flex justify-content-center">
                                    <input type="text" class="form-control code-input mx-1 text-center" maxlength="1" required>
                                    <input type="text" class="form-control code-input mx-1 text-center" maxlength="1" required>
                                    <input type="text" class="form-control code-input mx-1 text-center" maxlength="1" required>
                                    <input type="text" class="form-control code-input mx-1 text-center" maxlength="1" required>
                                    <input type="text" class="form-control code-input mx-1 text-center" maxlength="1" required>
                                    <input type="text" class="form-control code-input mx-1 text-center" maxlength="1" required>
                                    <div class="invalid-feedback">
                                        Por favor ingrese el código de 6 dígitos
                                    </div>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">Verificar Código</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reset Password Modal -->
            <div class="modal fade" id="resetPasswordModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Restablecer Contraseña</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="resetPasswordForm" novalidate>
                                <div class="mb-3">
                                    <input type="password" class="form-control" id="newPassword" 
                                           placeholder="Nueva Contraseña" required>
                                    <div class="invalid-feedback">
                                        La contraseña es requerida
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <input type="password" class="form-control" id="confirmNewPassword" 
                                           placeholder="Confirmar Nueva Contraseña" required>
                                    <div class="invalid-feedback">
                                        Las contraseñas no coinciden
                                    </div>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">Restablecer Contraseña</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    setupFormValidation() {
        const fields = document.querySelectorAll('.validate');
        fields.forEach(field => {
            field.addEventListener('keyup', () => {
                field.classList.remove('errorField');
            });
        });
    }

    attachEventListeners() {
        // Initialize Bootstrap modals
        this.loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        this.registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
        this.forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
        this.enterResetCodeModal = new bootstrap.Modal(document.getElementById('enterResetCodeModal'));
        this.resetPasswordModal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));

        // Attach event listeners to buttons
        document.getElementById('authButton')?.addEventListener('click', () => this.loginModal.show());
        document.getElementById('registerButton')?.addEventListener('click', () => this.registerModal.show());

        // Form submissions
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => this.handleSendResetCode(e));
        document.getElementById('enterResetCodeForm')?.addEventListener('submit', (e) => this.handleVerifyResetCode(e));
        document.getElementById('resetPasswordForm')?.addEventListener('submit', (e) => this.handleResetPassword(e));

        // Modal navigation
        document.getElementById('showRegisterLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loginModal.hide();
            this.registerModal.show();
        });

        // Forgot password
        document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loginModal.hide();
            this.forgotPasswordModal.show();
        });

        // Auto-focus for code inputs
        const codeInputs = document.querySelectorAll('.code-input');
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                if (input.value.length === 1 && index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            });
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        form.classList.add('was-validated');

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validación básica
        if (!ValidationUtils.isValidEmail(email) || !password) {
            this.showAlert('Error', 'Por favor complete todos los campos correctamente', 'error');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.token) {
                localStorage.setItem('token', data.token);
                // Decodificar el token para obtener el userId
                const payload = jwt_decode(data.token);
                const userId = payload.userId;
                localStorage.setItem('userId', userId);
                // Usar el AuthValidator para la redirección basada en rol
                AuthValidator.redirectBasedOnRole();
            } else {
                this.showAlert('Error', 'Credenciales inválidas', 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showAlert('Error', 'Error al iniciar sesión', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        form.classList.add('was-validated');
        const formData = this.getRegisterFormData();
        const validationErrors = this.validateRegisterData(formData);
        if (validationErrors.length > 0) {
            this.showAlert('Error', validationErrors.join('<br>'), 'error');
            return;
        }
        try {
            // Realizar la solicitud al endpoint de registro
            const response = await fetch(API_ENDPOINTS.SIGNUP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json(); // Parsear la respuesta JSON
            
            if (response.ok && data.success) {
                // Registro exitoso
                this.showAlert('¡Éxito!', data.message || 'Registro completado correctamente', 'success');
                this.registerModal.hide();
                this.loginModal.show();
            } else {
                // Manejo de errores desde el backend
                this.showAlert('Error', data.message || 'Error al registrar', 'error');
            }
        } catch (error) {
            // Manejo de errores en el cliente
            console.error('Error en registro:', error);
            this.showAlert('Error', 'Error al procesar el registro. Intente nuevamente.', 'error');
        }
    }
    

    getRegisterFormData() {

        return {
            name: document.getElementById('registerName').value,
            surname: document.getElementById('registerSurname').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('registerPhone').value,
            address: document.getElementById('registerAddress').value,
            city: document.getElementById('registerCity').value,
            birthdate: document.getElementById('registerBirthdate').value,
            password: document.getElementById('registerPassword').value,
            role: 'user' // Por defecto, todos los registros son usuarios normales
        };
    }

    validateRegisterData(data) {
        const errors = [];

        if (!data.name || !data.surname) {
            errors.push('Nombre y apellido son requeridos');
        }
        if (!ValidationUtils.isValidEmail(data.email)) {
            errors.push('Email inválido');
        }
        if (!ValidationUtils.isValidPassword(data.password)) {
            errors.push('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
        }
        if (data.password !== document.getElementById('registerConfirmPassword').value) {
            errors.push('Las contraseñas no coinciden');
        }
        if (!ValidationUtils.isValidPhone(data.phone)) {
            errors.push('Número de teléfono inválido');
        }
        if (!ValidationUtils.isAdult(data.birthdate)) {
            errors.push('Debe ser mayor de edad para registrarse');
        }
        if (!data.address || !data.city) {
            errors.push('Dirección y ciudad son requeridos');
        }

        return errors;
    }

    async handleSendResetCode(event) {
        event.preventDefault();
        const email = document.getElementById('forgotPasswordEmail').value;

        if (!ValidationUtils.isValidEmail(email)) {
            this.showAlert('Error', 'Por favor ingrese un correo válido', 'error');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.SEND_RESET_CODE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Éxito', 'Código de restablecimiento enviado a su correo', 'success');
                this.forgotPasswordModal.hide();
                this.enterResetCodeModal.show();
            } else {
                this.showAlert('Error', data.message || 'Error al enviar el código de restablecimiento', 'error');
            }
        } catch (error) {
            console.error('Error al enviar el código de restablecimiento:', error);
            this.showAlert('Error', 'Error al enviar el código de restablecimiento', 'error');
        }
    }

    async handleVerifyResetCode(event) {
        event.preventDefault();
        const codeInputs = document.querySelectorAll('.code-input');
        const code = Array.from(codeInputs).map(input => input.value).join('');

        if (code.length !== 6) {
            this.showAlert('Error', 'Por favor ingrese el código de 6 dígitos', 'error');
            return;
        }

        // Store the code for later use
        this.resetCode = code;
        this.enterResetCodeModal.hide();
        this.resetPasswordModal.show();
    }

    async handleResetPassword(event) {
        event.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!newPassword || newPassword !== confirmNewPassword) {
            this.showAlert('Error', 'Por favor complete todos los campos correctamente', 'error');
            return;
        }

        try {
            const email = document.getElementById('forgotPasswordEmail').value; // Reutilizar el email ingresado anteriormente
            const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: this.resetCode, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Éxito', 'Contraseña restablecida correctamente', 'success');
                this.resetPasswordModal.hide();
                this.loginModal.show();
            } else {
                this.showAlert('Error', data.message || 'Error al restablecer la contraseña', 'error');
            }
        } catch (error) {
            console.error('Error al restablecer la contraseña:', error);
            this.showAlert('Error', 'Error al restablecer la contraseña', 'error');
        }
    }

    showAlert(title, message, icon) {
        console.log('showAlert ejecutado:', title, message, icon);
    
        Swal.fire({
            icon: icon, // 'success', 'error', 'warning', 'info'
            title: title,
            html: message, // Usamos 'html' para formatear mensajes con saltos de línea
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal-wide' // Clase personalizada opcional para ajustar estilos
            }
        });
    }
    
    
}

// Agregar clase personalizada al modal de registro
document.addEventListener('DOMContentLoaded', function() {
    var registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.classList.add('custom-register-modal');
    }
});

// Initialize the authentication system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthenticationSystem();
});