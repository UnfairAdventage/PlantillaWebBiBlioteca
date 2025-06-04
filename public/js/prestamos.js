// Variables globales
let paginaActual = 1;
const prestamosPorPagina = 10;
let prestamos = [];
let filtros = {
    estado: '',
    fecha: '',
    busqueda: ''
};

// Cargar préstamos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarPrestamos();
    configurarFiltros();
    cargarSelectores();
});

// Función para cargar los préstamos
async function cargarPrestamos() {
    try {
        const response = await fetch('/api/prestamos');
        prestamos = await response.json();
        aplicarFiltros();
    } catch (error) {
        console.error('Error al cargar los préstamos:', error);
        mostrarError('No se pudieron cargar los préstamos. Por favor, intente más tarde.');
    }
}

// Función para mostrar los préstamos en la tabla
function mostrarPrestamos(prestamosAMostrar) {
    const tbody = document.getElementById('tabla-prestamos');
    
    if (prestamosAMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No hay préstamos registrados.
                </td>
            </tr>
        `;
        return;
    }

    const inicio = (paginaActual - 1) * prestamosPorPagina;
    const fin = inicio + prestamosPorPagina;
    const prestamosPagina = prestamosAMostrar.slice(inicio, fin);

    tbody.innerHTML = prestamosPagina.map(prestamo => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${prestamo.titulo_libro}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${prestamo.nombre_socio}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatearFecha(prestamo.fecha_prestamo)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatearFecha(prestamo.fecha_devolucion)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    obtenerClaseEstado(prestamo)
                }">
                    ${obtenerTextoEstado(prestamo)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${generarBotonesAccion(prestamo)}
            </td>
        </tr>
    `).join('');

    actualizarPaginacion(prestamosAMostrar.length);
}

// Función para configurar los eventos de los filtros
function configurarFiltros() {
    document.getElementById('filtro-estado').addEventListener('change', (e) => {
        filtros.estado = e.target.value;
        aplicarFiltros();
    });

    document.getElementById('filtro-fecha').addEventListener('change', (e) => {
        filtros.fecha = e.target.value;
        aplicarFiltros();
    });

    document.getElementById('filtro-busqueda').addEventListener('input', (e) => {
        filtros.busqueda = e.target.value.toLowerCase();
        aplicarFiltros();
    });
}

// Función para cargar los selectores del formulario
async function cargarSelectores() {
    try {
        // Cargar libros disponibles
        const responseLibros = await fetch('/api/libros');
        const libros = await response.json();
        const selectLibros = document.getElementById('libro');
        
        libros.filter(libro => libro.disponible).forEach(libro => {
            const option = document.createElement('option');
            option.value = libro.id;
            option.textContent = libro.titulo;
            selectLibros.appendChild(option);
        });

        // Cargar socios
        const responseSocios = await fetch('/api/socios');
        const socios = await response.json();
        const selectSocios = document.getElementById('socio');
        
        socios.forEach(socio => {
            const option = document.createElement('option');
            option.value = socio.id;
            option.textContent = socio.nombre;
            selectSocios.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar los selectores:', error);
    }
}

// Función para aplicar todos los filtros
function aplicarFiltros() {
    let prestamosFiltrados = [...prestamos];

    // Aplicar filtro de estado
    if (filtros.estado) {
        prestamosFiltrados = prestamosFiltrados.filter(prestamo => {
            const estado = obtenerEstadoPrestamo(prestamo);
            return estado === filtros.estado;
        });
    }

    // Aplicar filtro de fecha
    if (filtros.fecha) {
        const fechaFiltro = new Date(filtros.fecha).toISOString().split('T')[0];
        prestamosFiltrados = prestamosFiltrados.filter(prestamo => 
            prestamo.fecha_prestamo.startsWith(fechaFiltro) ||
            prestamo.fecha_devolucion.startsWith(fechaFiltro)
        );
    }

    // Aplicar búsqueda
    if (filtros.busqueda) {
        prestamosFiltrados = prestamosFiltrados.filter(prestamo => 
            prestamo.titulo_libro.toLowerCase().includes(filtros.busqueda) ||
            prestamo.nombre_socio.toLowerCase().includes(filtros.busqueda)
        );
    }

    paginaActual = 1;
    mostrarPrestamos(prestamosFiltrados);
}

// Función para cambiar de página
function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(prestamos.length / prestamosPorPagina);
    
    if (direccion === 'anterior' && paginaActual > 1) {
        paginaActual--;
    } else if (direccion === 'siguiente' && paginaActual < totalPaginas) {
        paginaActual++;
    }

    aplicarFiltros();
}

// Función para actualizar la paginación
function actualizarPaginacion(totalPrestamos) {
    const totalPaginas = Math.ceil(totalPrestamos / prestamosPorPagina);
    document.getElementById('pagina-actual').textContent = paginaActual;
    
    const botonAnterior = document.querySelector('button[onclick="cambiarPagina(\'anterior\')"]');
    const botonSiguiente = document.querySelector('button[onclick="cambiarPagina(\'siguiente\')"]');
    
    botonAnterior.disabled = paginaActual === 1;
    botonSiguiente.disabled = paginaActual === totalPaginas;
}

// Función para mostrar el formulario de nuevo préstamo
function mostrarFormularioPrestamo() {
    document.getElementById('modal-prestamo').classList.remove('hidden');
}

// Función para cerrar el modal
function cerrarModal() {
    document.getElementById('modal-prestamo').classList.add('hidden');
    document.getElementById('formulario-prestamo').reset();
}

// Función para manejar el envío del formulario
document.getElementById('formulario-prestamo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const libroId = document.getElementById('libro').value;
    const socioId = document.getElementById('socio').value;
    const fechaDevolucion = document.getElementById('fecha-devolucion').value;

    try {
        const response = await fetch('/api/prestamos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                libro_id: libroId,
                socio_id: socioId,
                fecha_devolucion: fechaDevolucion
            })
        });

        if (response.ok) {
            alert('Préstamo creado con éxito.');
            cerrarModal();
            cargarPrestamos();
        } else {
            throw new Error('Error al crear el préstamo');
        }
    } catch (error) {
        console.error('Error al crear el préstamo:', error);
        alert('No se pudo crear el préstamo. Por favor, intente más tarde.');
    }
});

// Función para marcar un préstamo como devuelto
async function marcarDevuelto(idPrestamo) {
    if (!idPrestamo) {
        mostrarError('ID de préstamo no válido');
        return;
    }

    try {
        const response = await fetch(`/api/prestamos/${idPrestamo}/devolver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al marcar como devuelto');
        }

        // Recargar la lista de préstamos
        cargarPrestamos();
    } catch (error) {
        console.error('Error al marcar como devuelto:', error);
        mostrarError(error.message || 'Error al marcar como devuelto');
    }
}

// Función para obtener el estado de un préstamo
function obtenerEstadoPrestamo(prestamo) {
    if (prestamo.devuelto) return 'devuelto';
    
    const fechaDevolucion = new Date(prestamo.fecha_devolucion);
    const hoy = new Date();
    
    if (fechaDevolucion < hoy) return 'atrasado';
    return 'pendiente';
}

// Función para obtener la clase CSS según el estado
function obtenerClaseEstado(prestamo) {
    const estado = obtenerEstadoPrestamo(prestamo);
    switch (estado) {
        case 'devuelto':
            return 'bg-green-100 text-green-800';
        case 'atrasado':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
}

// Función para obtener el texto según el estado
function obtenerTextoEstado(prestamo) {
    const estado = obtenerEstadoPrestamo(prestamo);
    switch (estado) {
        case 'devuelto':
            return 'Devuelto';
        case 'atrasado':
            return 'Atrasado';
        default:
            return 'Pendiente';
    }
}

// Función para generar los botones de acción
function generarBotonesAccion(prestamo) {
    if (prestamo.entregado) {
        return `
            <button onclick="verDetalles(${prestamo.id_prestamo})" class="text-blue-600 hover:text-blue-900">
                <i class="fas fa-eye"></i>
            </button>
        `;
    }

    return `
        <button onclick="marcarDevuelto(${prestamo.id_prestamo})" class="text-green-600 hover:text-green-900 mr-3">
            <i class="fas fa-check"></i>
        </button>
        <button onclick="verDetalles(${prestamo.id_prestamo})" class="text-blue-600 hover:text-blue-900">
            <i class="fas fa-eye"></i>
        </button>
    `;
}

// Función para ver detalles de un préstamo
function verDetalles(idPrestamo) {
    // Implementar la vista de detalles
    console.log('Ver detalles del préstamo:', idPrestamo);
}

// Función para formatear fechas
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para mostrar errores
function mostrarError(mensaje) {
    const tbody = document.getElementById('tabla-prestamos');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-4 text-center">
                <div class="flex flex-col items-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                    <p class="text-gray-600">${mensaje}</p>
                </div>
            </td>
        </tr>
    `;
} 