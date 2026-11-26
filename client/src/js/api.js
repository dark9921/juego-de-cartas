const API_URL = 'http://localhost:3000/api';

// Función para notificar al backend el resultado del combate
async function saveMatchResult(result, enemyName) {
    try {
        const response = await fetch(`${API_URL}/save-match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: 1, // ID temporal de ejemplo
                result: result, // "victoria" o "derrota"
                enemyName: enemyName
            })
        });

        const data = await response.json();
        console.log("Respuesta del servidor:", data.message);
    } catch (error) {
        console.error("Error al conectar con el backend:", error);
    }
}