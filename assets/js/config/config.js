// Configuración global para la aplicación

// URL base de la API
window.API_BASE_URL = 'http://localhost:8080';

// Verificar si la API está disponible al cargar la página
window.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Verificando conexión a la API...');
        const response = await fetch(`${window.API_BASE_URL}/api/v1/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión a la API establecida correctamente');
        } else {
            console.warn('⚠️ La API respondió con un estado no OK:', response.status);
        }
    } catch (error) {
        console.error('❌ Error al conectar con la API:', error);
    }
});