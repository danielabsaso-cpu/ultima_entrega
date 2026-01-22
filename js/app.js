// ==========================
// CLASE PRODUCTO
// ==========================
class Product {
  constructor(id, nombre, precio, stock) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
  }
}

// ==========================
// VARIABLES GLOBALES
// ==========================
let CATALOG = [];
const LS_KEY = "simulador_carrito_v3";
let carrito = cargarCarritoDesdeStorage();

// ==========================
// ELEMENTOS DEL DOM
// ==========================
const listaProductosEl = document.getElementById("lista-productos");
const carritoListaEl = document.getElementById("carrito-lista");
const totalEl = document.getElementById("total");
const mensajeCarritoEl = document.getElementById("mensaje-carrito");
const vaciarBtn = document.getElementById("vaciar-carrito");
const confirmarBtn = document.getElementById("confirmar-compra");

// ==========================
// CARGA ASÍNCRONA DESDE JSON
// ==========================
async function cargarProductos() {
  try {
    const response = await fetch("data/productos.json");
    const data = await response.json();

    CATALOG = data.map(
      p => new Product(p.id, p.nombre, p.precio, p.stock)
    );

    mostrarProductos();
  } catch (error) {
    Swal.fire("Error", "No se pudieron cargar los productos", "error");
  }
}

// ==========================
// MOSTRAR CATÁLOGO
// ==========================
function mostrarProductos() {
  listaProductosEl.innerHTML = "";

  CATALOG.forEach(prod => {
    const card = document.createElement("div");
    card.className = "producto";

    card.innerHTML = `
      <h3>${prod.nombre}</h3>
      <p>Precio: $${prod.precio}</p>
      <p>Stock: ${prod.stock}</p>
      <button class="btn btn-pri agregar" data-id="${prod.id}">Agregar</button>
    `;

    listaProductosEl.appendChild(card);
  });
}

// ==========================
// CARRITO
// ==========================
function agregarAlCarrito(id) {
  const prod = CATALOG.find(p => p.id === id);
  if (!prod) return;

  const item = carrito.find(i => i.id === id);
  const cantidadActual = item ? item.cantidad : 0;

  if (cantidadActual + 1 > prod.stock) {
    Swal.fire("Sin stock", "No hay stock suficiente", "error");
    return;
  }

  if (item) {
    item.cantidad++;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      cantidad: 1
    });
  }

  guardarYRenderizar();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  guardarYRenderizar();
}

function cambiarCantidad(id, cantidad) {
  const prod = CATALOG.find(p => p.id === id);
  if (!prod) return;

  if (cantidad < 1 || cantidad > prod.stock) {
    Swal.fire("Cantidad inválida", `Stock máximo: ${prod.stock}`, "error");
    guardarYRenderizar();
    return;
  }

  const item = carrito.find(i => i.id === id);
  if (item) item.cantidad = cantidad;

  guardarYRenderizar();
}

// ==========================
// CÁLCULOS
// ==========================
function calcularTotal() {
  let subtotal = 0;

  carrito.forEach(item => {
    subtotal += item.precio * item.cantidad;
  });

  const descuento = subtotal > 500 ? Math.round(subtotal * 0.08) : 0;
  const total = subtotal - descuento;

  return { subtotal, descuento, total };
}

// ==========================
// RENDER CARRITO
// ==========================
function mostrarCarritoEnDOM() {
  carritoListaEl.innerHTML = "";

  if (carrito.length === 0) {
    mensajeCarritoEl.textContent = "El carrito está vacío.";
    totalEl.textContent = "0";
    return;
  }

  mensajeCarritoEl.textContent = "";

  carrito.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <span>${item.nombre}</span>
      <input type="number" min="1" value="${item.cantidad}" data-id="${item.id}" class="cantidad-input">
      <span>$${item.precio * item.cantidad}</span>
      <button class="btn btn-sec borrar" data-id="${item.id}">X</button>
    `;

    carritoListaEl.appendChild(div);
  });

  const { total } = calcularTotal();
  totalEl.textContent = total;
}

// ==========================
// STORAGE
// ==========================
function guardarCarritoEnStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(carrito));
}

function cargarCarritoDesdeStorage() {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : [];
}

function guardarYRenderizar() {
  guardarCarritoEnStorage();
  mostrarCarritoEnDOM();
}

// ==========================
// TICKET TXT DESCARGABLE
// ==========================
function descargarTicketTXT() {
  const { subtotal, descuento, total } = calcularTotal();

  let texto = "TICKET DE COMPRA\n";
  texto += "-------------------------\n";

  carrito.forEach(item => {
    texto += `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}\n`;
  });

  texto += "-------------------------\n";
  texto += `Subtotal: $${subtotal}\n`;
  texto += `Descuento: $${descuento}\n`;
  texto += `TOTAL: $${total}\n`;
  texto += `Fecha: ${new Date().toLocaleString()}\n`;

  const blob = new Blob([texto], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ticket_compra.txt";
  a.click();

  URL.revokeObjectURL(url);
}

// ==========================
// EVENTOS
// ==========================
listaProductosEl.addEventListener("click", e => {
  if (e.target.classList.contains("agregar")) {
    agregarAlCarrito(Number(e.target.dataset.id));
  }
});

carritoListaEl.addEventListener("click", e => {
  if (e.target.classList.contains("borrar")) {
    eliminarDelCarrito(Number(e.target.dataset.id));
  }
});

carritoListaEl.addEventListener("change", e => {
  if (e.target.classList.contains("cantidad-input")) {
    cambiarCantidad(
      Number(e.target.dataset.id),
      Number(e.target.value)
    );
  }
});

vaciarBtn.addEventListener("click", () => {
  Swal.fire({
    title: "¿Vaciar carrito?",
    showCancelButton: true,
    confirmButtonText: "Sí",
  }).then(result => {
    if (result.isConfirmed) {
      carrito = [];
      guardarYRenderizar();
    }
  });
});

confirmarBtn.addEventListener("click", () => {
  if (carrito.length === 0) {
    Swal.fire("Carrito vacío", "", "error");
    return;
  }

  descargarTicketTXT();

  Swal.fire("Compra realizada", "Ticket descargado", "success");

  carrito = [];
  guardarYRenderizar();
});

// ==========================
// INICIO
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  mostrarCarritoEnDOM();
});
