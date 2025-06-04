// Variables globales
let paginaActual = 1;
const librosPorPagina = 8;
let libros = [];
let filtros = {
    genero: 'todos',
    anio: 'todos',
    orden: 'titulo'
};

// Cargar libros cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    configurarFiltros();
});

// Función para cargar los libros
async function cargarLibros() {
    try {
        const response = await fetch('/api/libros');
        if (!response.ok) throw new Error('Error al cargar los libros');
        libros = await response.json();
        aplicarFiltros();
    } catch (error) {
        console.error('Error al cargar los libros:', error);
        mostrarError('Error al cargar los libros. Por favor, intente nuevamente.');
    }
}

// Función para mostrar los libros
function mostrarLibros(librosAMostrar) {
    const contenedor = document.getElementById('libros-container');
    contenedor.innerHTML = '';

    librosAMostrar.forEach(libro => {
        // Encontrar la imagen del libro
        let imagen = libro.recursos.find(r => r.tipo === 'imagen')?.url || 'img/default-book.jpg';
        if (imagen.startsWith('public/')) imagen = imagen.replace('public/', '');
        
        const libroHTML = `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <img src="${imagen}" alt="${libro.titulo}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-2">${libro.titulo}</h3>
                    <p class="text-gray-600 mb-2">${libro.autor}</p>
                    <p class="text-sm text-gray-500 mb-2">Año: ${libro.anio}</p>
                    <p class="text-sm text-gray-500 mb-4">Disponibles: ${libro.disponible}</p>
                    <a href="libro.html?id=${libro.id_libro}" class="block text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                        Ver detalles
                    </a>
                </div>
            </div>
        `;
        contenedor.innerHTML += libroHTML;
    });
}

// Función para configurar los filtros
function configurarFiltros() {
    // Filtro de género
    document.getElementById('filtro-genero').addEventListener('change', (e) => {
        filtros.genero = e.target.value;
        paginaActual = 1;
        aplicarFiltros();
    });

    // Filtro de año
    document.getElementById('filtro-anio').addEventListener('change', (e) => {
        filtros.anio = e.target.value;
        paginaActual = 1;
        aplicarFiltros();
    });

    // Ordenamiento
    document.getElementById('ordenar-por').addEventListener('change', (e) => {
        filtros.orden = e.target.value;
        paginaActual = 1;
        aplicarFiltros();
    });

    // Búsqueda
    document.getElementById('buscar').addEventListener('input', (e) => {
        filtros.busqueda = e.target.value;
        paginaActual = 1;
        aplicarFiltros();
    });
}

// Función para aplicar filtros y búsqueda sobre todos los libros y luego paginar
function aplicarFiltros() {
    let resultado = [...libros];

    // Búsqueda
    if (filtros.busqueda && filtros.busqueda.trim() !== '') {
        const termino = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(libro => 
            libro.titulo.toLowerCase().includes(termino) ||
            libro.autor.toLowerCase().includes(termino)
        );
    }

    // Filtro de género
    if (filtros.genero !== 'todos') {
        resultado = resultado.filter(libro => libro.genero === filtros.genero);
    }

    // Filtro de año
    if (filtros.anio !== 'todos') {
        resultado = resultado.filter(libro => libro.anio === parseInt(filtros.anio));
    }

    // Ordenamiento
    resultado.sort((a, b) => {
        switch (filtros.orden) {
            case 'titulo':
                return a.titulo.localeCompare(b.titulo);
            case 'autor':
                return a.autor.localeCompare(b.autor);
            case 'anio':
                return b.anio - a.anio;
            default:
                return 0;
        }
    });

    // Paginación
    const inicio = (paginaActual - 1) * librosPorPagina;
    const fin = inicio + librosPorPagina;
    const librosPaginados = resultado.slice(inicio, fin);

    mostrarLibros(librosPaginados);
    actualizarPaginacion(resultado.length);
}

// Función para cambiar de página
function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    aplicarFiltros();
}

// Función para actualizar la paginación
function actualizarPaginacion(totalLibros) {
    const totalPaginas = Math.ceil(totalLibros / librosPorPagina);
    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = '';

    // Botón anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.className = `px-3 py-1 rounded ${paginaActual === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`;
    btnAnterior.textContent = 'Anterior';
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.onclick = () => cambiarPagina(paginaActual - 1);
    paginacion.appendChild(btnAnterior);

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        const btnPagina = document.createElement('button');
        btnPagina.className = `px-3 py-1 mx-1 rounded ${paginaActual === i ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
        btnPagina.textContent = i;
        btnPagina.onclick = () => cambiarPagina(i);
        paginacion.appendChild(btnPagina);
    }

    // Botón siguiente
    const btnSiguiente = document.createElement('button');
    btnSiguiente.className = `px-3 py-1 rounded ${paginaActual === totalPaginas ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`;
    btnSiguiente.textContent = 'Siguiente';
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnSiguiente.onclick = () => cambiarPagina(paginaActual + 1);
    paginacion.appendChild(btnSiguiente);
}

// Función para mostrar errores
function mostrarError(mensaje) {
    const contenedor = document.getElementById('libros-container');
    contenedor.innerHTML = `
        <div class="text-center text-red-600 p-4">
            <p>${mensaje}</p>
        </div>
    `;
} 