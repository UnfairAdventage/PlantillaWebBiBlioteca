const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'biblioteca_2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rutas de la API

// Obtener todos los libros con sus recursos multimedia
app.get('/api/libros', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT l.*, 
                   (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0) as prestamos_activos,
                   (l.cantidad_total - (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0)) as disponible,
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'tipo', rm.tipo,
                           'url', rm.url,
                           'descripcion', rm.descripcion
                       )
                   ) as recursos
            FROM libros l
            LEFT JOIN recursos_multimedia rm ON l.id_libro = rm.id_libro
            GROUP BY l.id_libro
        `);

        // Procesar los recursos multimedia
        const libros = rows.map(libro => ({
            ...libro,
            recursos: libro.recursos ? JSON.parse(`[${libro.recursos}]`) : []
        }));

        res.json(libros);
    } catch (error) {
        console.error('Error al obtener los libros:', error);
        res.status(500).json({ error: 'Error al obtener los libros' });
    }
});

// Obtener un libro por ID con sus recursos multimedia
app.get('/api/libros/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT l.*, 
                   (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0) as prestamos_activos,
                   (l.cantidad_total - (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0)) as disponible,
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'tipo', rm.tipo,
                           'url', rm.url,
                           'descripcion', rm.descripcion
                       )
                   ) as recursos
            FROM libros l
            LEFT JOIN recursos_multimedia rm ON l.id_libro = rm.id_libro
            WHERE l.id_libro = ?
            GROUP BY l.id_libro
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        // Procesar los recursos multimedia
        const libro = {
            ...rows[0],
            recursos: rows[0].recursos ? JSON.parse(`[${rows[0].recursos}]`) : []
        };

        res.json(libro);
    } catch (error) {
        console.error('Error al obtener el libro:', error);
        res.status(500).json({ error: 'Error al obtener el libro' });
    }
});

// Obtener libros destacados
app.get('/api/libros/destacados', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT l.*, 
                   (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0) as prestamos_activos,
                   (l.cantidad_total - (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0)) as disponible,
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'tipo', rm.tipo,
                           'url', rm.url,
                           'descripcion', rm.descripcion
                       )
                   ) as recursos
            FROM libros l
            LEFT JOIN recursos_multimedia rm ON l.id_libro = rm.id_libro
            GROUP BY l.id_libro
            ORDER BY (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro) DESC
            LIMIT 3
        `);

        // Procesar los recursos multimedia
        const libros = rows.map(libro => ({
            ...libro,
            recursos: libro.recursos ? JSON.parse(`[${libro.recursos}]`) : []
        }));

        res.json(libros);
    } catch (error) {
        console.error('Error al obtener los libros destacados:', error);
        res.status(500).json({ error: 'Error al obtener los libros destacados' });
    }
});

// Obtener préstamos de un libro
app.get('/api/libros/:id/prestamos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, s.nombre as nombre_socio
            FROM prestamos p
            JOIN socios s ON p.id_socio = s.id_socio
            WHERE p.id_libro = ?
            ORDER BY p.fecha_prestamo DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los préstamos del libro:', error);
        res.status(500).json({ error: 'Error al obtener los préstamos del libro' });
    }
});

// Obtener todos los préstamos
app.get('/api/prestamos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, l.titulo as titulo_libro, s.nombre as nombre_socio
            FROM prestamos p
            JOIN libros l ON p.id_libro = l.id_libro
            JOIN socios s ON p.id_socio = s.id_socio
            ORDER BY p.fecha_prestamo DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los préstamos:', error);
        res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
});

// Crear un nuevo préstamo
app.post('/api/prestamos', async (req, res) => {
    const { id_libro, id_socio, fecha_devolucion } = req.body;

    try {
        // Verificar si el libro está disponible
        const [libro] = await pool.query(`
            SELECT l.*, 
                   (SELECT COUNT(*) FROM prestamos p WHERE p.id_libro = l.id_libro AND p.entregado = 0) as prestamos_activos
            FROM libros l
            WHERE l.id_libro = ?
        `, [id_libro]);

        if (libro.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        if (libro[0].prestamos_activos >= libro[0].cantidad_total) {
            return res.status(400).json({ error: 'El libro no está disponible' });
        }

        // Crear el préstamo
        const [result] = await pool.query(
            'INSERT INTO prestamos (id_libro, id_socio, fecha_prestamo, fecha_devolucion, entregado, precio) VALUES (?, ?, CURDATE(), ?, 0, 10.20)',
            [id_libro, id_socio, fecha_devolucion]
        );

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Error al crear el préstamo:', error);
        res.status(500).json({ error: 'Error al crear el préstamo' });
    }
});

// Marcar un préstamo como devuelto
app.put('/api/prestamos/:id/devolver', async (req, res) => {
    const idPrestamo = req.params.id;
    
    if (!idPrestamo) {
        return res.status(400).json({ error: 'ID de préstamo no proporcionado' });
    }

    try {
        // Verificar si el préstamo existe
        const [prestamo] = await pool.query(
            'SELECT * FROM prestamos WHERE id_prestamo = ?',
            [idPrestamo]
        );

        if (prestamo.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        // Verificar si ya está devuelto
        if (prestamo[0].entregado) {
            return res.status(400).json({ error: 'El préstamo ya ha sido devuelto' });
        }

        // Marcar como devuelto
        const [result] = await pool.query(
            'UPDATE prestamos SET entregado = 1 WHERE id_prestamo = ?',
            [idPrestamo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No se pudo actualizar el préstamo' });
        }

        res.json({ 
            message: 'Préstamo devuelto con éxito',
            id_prestamo: idPrestamo
        });
    } catch (error) {
        console.error('Error al marcar el préstamo como devuelto:', error);
        res.status(500).json({ error: 'Error al marcar el préstamo como devuelto' });
    }
});

// Obtener todos los socios
app.get('/api/socios', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, 
                   (SELECT COUNT(*) FROM prestamos p WHERE p.id_socio = s.id_socio) as num_prestamos
            FROM socios s
            ORDER BY s.nombre
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los socios:', error);
        res.status(500).json({ error: 'Error al obtener los socios' });
    }
});

// Obtener un socio por ID
app.get('/api/socios/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM socios WHERE id_socio = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Socio no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener el socio:', error);
        res.status(500).json({ error: 'Error al obtener el socio' });
    }
});

// Crear un nuevo socio
app.post('/api/socios', async (req, res) => {
    const { nombre, direccion, telefono } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO socios (nombre, direccion, telefono) VALUES (?, ?, ?)',
            [nombre, direccion, telefono]
        );

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Error al crear el socio:', error);
        res.status(500).json({ error: 'Error al crear el socio' });
    }
});

// Actualizar un socio
app.put('/api/socios/:id', async (req, res) => {
    const { nombre, direccion, telefono } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE socios SET nombre = ?, direccion = ?, telefono = ? WHERE id_socio = ?',
            [nombre, direccion, telefono, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Socio no encontrado' });
        }

        res.json({ message: 'Socio actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar el socio:', error);
        res.status(500).json({ error: 'Error al actualizar el socio' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});