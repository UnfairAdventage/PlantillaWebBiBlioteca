// Función para cargar los libros destacados
async function cargarLibrosDestacados() {
    try {
        const response = await fetch('/api/libros/destacados');
        const libros = await response.json();
        
        const contenedor = document.getElementById('libros-destacados');
        contenedor.innerHTML = libros.map(libro => `
            <div class="bg-gray-50 rounded-lg p-4 shadow">
                <div class="aspect-w-3 aspect-h-4 mb-4">
                    <img src="https://via.placeholder.com/300x400" alt="${libro.titulo}" class="rounded-lg">
                </div>
                <h3 class="font-semibold text-lg mb-2">${libro.titulo}</h3>
                <p class="text-gray-600 mb-2">${libro.autor}</p>
                <a href="/libros.html?id=${libro.id_libro}" class="text-blue-600 hover:text-blue-800">Ver más →</a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar los libros destacados:', error);
    }
}

// Cargar los libros destacados cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('libros-destacados')) {
        cargarLibrosDestacados();
    }
}); 