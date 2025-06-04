// Variables globales
let paginaActual = 1;
const sociosPorPagina = 10;
let socios = [];
let filtros = {
    estado: '',
    busqueda: '',
    orden: ''
};

// Cargar socios al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarSocios();
    configurarFiltros();
});

// Función para cargar los socios
async function cargarSocios() {
    try {
        const response = await fetch('/api/socios');
        socios = await response.json();
        aplicarFiltros();
    } catch (error) {
        console.error('Error al cargar los socios:', error);
        mostrarError('No se pudieron cargar los socios. Por favor, intente más tarde.');
    }
}

// Función para mostrar los socios en la tabla
function mostrarSocios(sociosAMostrar) {
    const tbody = document.getElementById('tabla-socios');
    
    if (sociosAMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No hay socios registrados.
                </td>
            </tr>
        `;
        return;
    }

    const inicio = (paginaActual - 1) * sociosPorPagina;
    const fin = inicio + sociosPorPagina;
    const sociosPagina = sociosAMostrar.slice(inicio, fin);

    tbody.innerHTML = sociosPagina.map(socio => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${socio.nombre}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${socio.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${socio.telefono}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatearFecha(socio.fecha_registro)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    socio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${socio.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editarSocio(${socio.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="verPrestamos(${socio.id})" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-book"></i>
                </button>
                <button onclick="cambiarEstado(${socio.id}, ${!socio.activo})" class="text-yellow-600 hover:text-yellow-900">
                    <i class="fas fa-power-off"></i>
                </button>
            </td>
        </tr>
    `).join('');

    actualizarPaginacion(sociosAMostrar.length);
}

// Función para configurar los eventos de los filtros
function configurarFiltros() {
    document.getElementById('filtro-estado').addEventListener('change', (e) => {
        filtros.estado = e.target.value;
        aplicarFiltros();
    });

    document.getElementById('filtro-busqueda').addEventListener('input', (e) => {
        filtros.busqueda = e.target.value.toLowerCase();
        aplicarFiltros();
    });

    document.getElementById('filtro-orden').addEventListener('change', (e) => {
        filtros.orden = e.target.value;
        aplicarFiltros();
    });
}

// Función para aplicar todos los filtros
function aplicarFiltros() {
    let sociosFiltrados = [...socios];

    // Aplicar filtro de estado
    if (filtros.estado) {
        sociosFiltrados = sociosFiltrados.filter(socio => {
            const estado = socio.activo ? 'activo' : 'inactivo';
            return estado === filtros.estado;
        });
    }

    // Aplicar búsqueda
    if (filtros.busqueda) {
        sociosFiltrados = sociosFiltrados.filter(socio => 
            socio.nombre.toLowerCase().includes(filtros.busqueda) ||
            socio.email.toLowerCase().includes(filtros.busqueda)
        );
    }

    // Aplicar ordenamiento
    if (filtros.orden) {
        sociosFiltrados.sort((a, b) => {
            switch (filtros.orden) {
                case 'nombre':
                    return a.nombre.localeCompare(b.nombre);
                case 'fecha':
                    return new Date(b.fecha_registro) - new Date(a.fecha_registro);
                case 'prestamos':
                    return b.num_prestamos - a.num_prestamos;
                default:
                    return 0;
            }
        });
    }

    paginaActual = 1;
    mostrarSocios(sociosFiltrados);
}

// Función para cambiar de página
function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(socios.length / sociosPorPagina);
    
    if (direccion === 'anterior' && paginaActual > 1) {
        paginaActual--;
    } else if (direccion === 'siguiente' && paginaActual < totalPaginas) {
        paginaActual++;
    }

    aplicarFiltros();
}

// Función para actualizar la paginación
function actualizarPaginacion(totalSocios) {
    const totalPaginas = Math.ceil(totalSocios / sociosPorPagina);
    document.getElementById('pagina-actual').textContent = paginaActual;
    
    const botonAnterior = document.querySelector('button[onclick="cambiarPagina(\'anterior\')"]');
    const botonSiguiente = document.querySelector('button[onclick="cambiarPagina(\'siguiente\')"]');
    
    botonAnterior.disabled = paginaActual === 1;
    botonSiguiente.disabled = paginaActual === totalPaginas;
}

// Función para mostrar el formulario de nuevo socio
function mostrarFormularioSocio() {
    document.getElementById('modal-socio').classList.remove('hidden');
}

// Función para cerrar el modal
function cerrarModal() {
    document.getElementById('modal-socio').classList.add('hidden');
    document.getElementById('formulario-socio').reset();
}

// Función para manejar el envío del formulario
document.getElementById('formulario-socio').addEventListener('submit', async (e) => {
    e.preventDefault();

    const socio = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value
    };

    try {
        const response = await fetch('/api/socios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(socio)
        });

        if (response.ok) {
            alert('Socio creado con éxito.');
            cerrarModal();
            cargarSocios();
        } else {
            throw new Error('Error al crear el socio');
        }
    } catch (error) {
        console.error('Error al crear el socio:', error);
        alert('No se pudo crear el socio. Por favor, intente más tarde.');
    }
});

// Función para editar un socio
async function editarSocio(idSocio) {
    try {
        const response = await fetch(`/api/socios/${idSocio}`);
        const socio = await response.json();

        // Llenar el formulario con los datos del socio
        document.getElementById('nombre').value = socio.nombre;
        document.getElementById('email').value = socio.email;
        document.getElementById('telefono').value = socio.telefono;
        document.getElementById('direccion').value = socio.direccion;

        // Mostrar el modal
        mostrarFormularioSocio();

        // Cambiar el comportamiento del formulario para actualizar
        const formulario = document.getElementById('formulario-socio');
        formulario.onsubmit = async (e) => {
            e.preventDefault();

            const socioActualizado = {
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                direccion: document.getElementById('direccion').value
            };

            try {
                const response = await fetch(`/api/socios/${idSocio}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(socioActualizado)
                });

                if (response.ok) {
                    alert('Socio actualizado con éxito.');
                    cerrarModal();
                    cargarSocios();
                } else {
                    throw new Error('Error al actualizar el socio');
                }
            } catch (error) {
                console.error('Error al actualizar el socio:', error);
                alert('No se pudo actualizar el socio. Por favor, intente más tarde.');
            }
        };
    } catch (error) {
        console.error('Error al cargar los datos del socio:', error);
        alert('No se pudieron cargar los datos del socio. Por favor, intente más tarde.');
    }
}

// Función para ver los préstamos de un socio
function verPrestamos(idSocio) {
    window.location.href = `/prestamos.html?socio=${idSocio}`;
}

// Función para cambiar el estado de un socio
async function cambiarEstado(idSocio, nuevoEstado) {
    try {
        const response = await fetch(`/api/socios/${idSocio}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activo: nuevoEstado })
        });

        if (response.ok) {
            alert(`Socio ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
            cargarSocios();
        } else {
            throw new Error('Error al cambiar el estado del socio');
        }
    } catch (error) {
        console.error('Error al cambiar el estado del socio:', error);
        alert('No se pudo cambiar el estado del socio. Por favor, intente más tarde.');
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
    const tbody = document.getElementById('tabla-socios');
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