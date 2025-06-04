// Obtener el ID del libro de la URL
const urlParams = new URLSearchParams(window.location.search);
const idLibro = urlParams.get('id');

// Cargar los detalles del libro cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (idLibro) {
        cargarDetallesLibro(idLibro);
        cargarHistorialPrestamos(idLibro);
    } else {
        mostrarError('No se especificó un libro');
    }
});

// Función para cargar los detalles del libro
async function cargarDetallesLibro(id) {
    try {
        const response = await fetch(`/api/libros/${id}`);
        if (!response.ok) throw new Error('Error al cargar los detalles del libro');
        const libro = await response.json();
        mostrarDetallesLibro(libro);
    } catch (error) {
        console.error('Error al cargar los detalles del libro:', error);
        mostrarError('Error al cargar los detalles del libro');
    }
}

// Función para mostrar los detalles del libro
function mostrarDetallesLibro(libro) {
    // Encontrar la imagen del libro
    let imagen = libro.recursos.find(r => r.tipo === 'imagen')?.url || 'img/default-book.jpg';
    if (imagen.startsWith('public/')) imagen = imagen.replace('public/', '');
    
    // Encontrar el audio de la sinopsis
    const audioSinopsis = libro.recursos.find(r => r.tipo === 'audio')?.url;

    const detallesHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <img src="${imagen}" alt="${libro.titulo}" class="w-full rounded-lg shadow-lg">
            </div>
            <div>
                <h1 class="text-3xl font-bold mb-4">${libro.titulo}</h1>
                <p class="text-xl text-gray-600 mb-4">${libro.autor}</p>
                <p class="text-gray-600 mb-4">Año: ${libro.anio}</p>
                <div class="mb-6">
                    <h2 class="text-xl font-semibold mb-2">Sinopsis</h2>
                    <p class="text-gray-700 mb-4">${libro.sinopsis}</p>
                    ${audioSinopsis ? `
                        <audio controls class="w-full">
                            <source src="${audioSinopsis}" type="audio/mpeg">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                    ` : ''}
                </div>
                <div class="mb-6">
                    <h2 class="text-xl font-semibold mb-2">Disponibilidad</h2>
                    <p class="text-lg ${libro.disponible > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${libro.disponible > 0 ? `${libro.disponible} ejemplares disponibles` : 'No hay ejemplares disponibles'}
                    </p>
                </div>
                <button onclick="solicitarPrestamo()" 
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        ${libro.disponible === 0 ? 'disabled' : ''}>
                    Solicitar Préstamo
                </button>
            </div>
        </div>
    `;

    document.getElementById('detalles-libro').innerHTML = detallesHTML;
    document.title = `${libro.titulo} - Biblioteca Digital`;
}

// Función para cargar el historial de préstamos
async function cargarHistorialPrestamos(id) {
    try {
        const response = await fetch(`/api/libros/${id}/prestamos`);
        if (!response.ok) throw new Error('Error al cargar el historial de préstamos');
        const prestamos = await response.json();
        mostrarHistorialPrestamos(prestamos);
    } catch (error) {
        console.error('Error al cargar el historial de préstamos:', error);
        document.getElementById('historial-prestamos').innerHTML = `
            <p class="text-red-600">Error al cargar el historial de préstamos</p>
        `;
    }
}

// Función para mostrar el historial de préstamos
function mostrarHistorialPrestamos(prestamos) {
    const historialHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead>
                    <tr>
                        <th class="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Socio
                        </th>
                        <th class="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Fecha de Préstamo
                        </th>
                        <th class="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Fecha de Devolución
                        </th>
                        <th class="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Estado
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white">
                    ${prestamos.map(prestamo => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                                ${prestamo.nombre_socio}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                                ${formatearFecha(prestamo.fecha_prestamo)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                                ${formatearFecha(prestamo.fecha_devolucion)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prestamo.entregado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                    ${prestamo.entregado ? 'Devuelto' : 'Pendiente'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('historial-prestamos').innerHTML = historialHTML;
}

// Función para solicitar un préstamo
async function solicitarPrestamo() {
    try {
        const response = await fetch('/api/prestamos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_libro: idLibro,
                id_socio: 1, // TODO: Obtener el ID del socio actual
                fecha_devolucion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 días desde ahora
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al solicitar el préstamo');
        }

        alert('Préstamo solicitado con éxito');
        cargarDetallesLibro(idLibro);
        cargarHistorialPrestamos(idLibro);
    } catch (error) {
        console.error('Error al solicitar el préstamo:', error);
        alert(error.message || 'Error al solicitar el préstamo');
    }
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
    document.getElementById('detalles-libro').innerHTML = `
        <div class="text-center text-red-600 p-4">
            <p>${mensaje}</p>
        </div>
    `;
} 