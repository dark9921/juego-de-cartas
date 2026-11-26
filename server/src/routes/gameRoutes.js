const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Ruta para guardar el resultado de la partida en MySQL
router.post('/save-match', async (req, res) => {
    const { userId, result, enemyName } = req.body;

    try {
        const query = 'INSERT INTO matches (user_id, enemy_name, result) VALUES (?, ?, ?)';
        await pool.execute(query, [userId || 1, enemyName, result]);

        res.json({ success: true, message: "¡Partida guardada en la base de datos con éxito!" });
    } catch (error) {
        console.error("Error al guardar en la base de datos:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

module.exports = router;