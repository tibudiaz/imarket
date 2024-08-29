// Importar las funciones necesarias desde Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAK6Z7BusvE_E-31HIzGUBjGb9ErKyHw2g",
  authDomain: "stockadmin-42e60.firebaseapp.com",
  projectId: "stockadmin-42e60",
  storageBucket: "stockadmin-42e60.appspot.com",
  messagingSenderId: "751097053708",
  appId: "1:751097053708:web:9daf464fc23501aedbe429",
  measurementId: "G-0T6SE0NT5P"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Verificar el estado de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Usuario autenticado:', user.email);
    loadProducts(); // Cargar productos disponibles al inicio
    loadSoldProducts(); // Cargar productos vendidos al inicio
    loadSeñados(); // Cargar productos señalados al inicio
  } else {
    alert('Debes estar autenticado para acceder a esta página.');
    window.location.href = 'index.html'; // Redirigir al login
  }
});

// Manejar el formulario de producto
document.getElementById('productForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const productName = document.getElementById('productName').value;
  const entryDate = document.getElementById('entryDate').value;
  const productProveedor = document.getElementById('productProveedor').value;
  const purchasePrice = document.getElementById('purchasePrice').value;
  const imei = document.getElementById('imei').value;

  try {
    await addDoc(collection(db, "productos"), {
      nombre: productName,
      fechaIngreso: entryDate,
      proveedor: productProveedor,
      precioCompra: purchasePrice,
      imei: imei,
      sold: false,
      señalado: false // Inicialmente, los productos no están señalados
    });

    alert('Producto cargado exitosamente');
    document.getElementById('productForm').reset();
    loadProducts(); // Actualizar la lista de productos
    loadSoldProducts(); // Actualizar la lista de productos vendidos
    loadSeñados(); // Actualizar la lista de productos señalados
  } catch (e) {
    console.error('Error al agregar producto: ', e);
    alert('Hubo un error al cargar el producto');
  }
});

// Alternar entre pestañas
document.getElementById('loadTabButton').addEventListener('click', function() {
  document.getElementById('loadTab').classList.add('active');
  document.getElementById('viewTab').classList.remove('active');
  document.getElementById('soldTab').classList.remove('active');
  document.getElementById('señaTab').classList.remove('active');
});

document.getElementById('viewTabButton').addEventListener('click', function() {
  document.getElementById('loadTab').classList.remove('active');
  document.getElementById('viewTab').classList.add('active');
  document.getElementById('soldTab').classList.remove('active');
  document.getElementById('señaTab').classList.remove('active');
  loadProducts(); // Cargar productos disponibles al cambiar a la pestaña de vista
});

document.getElementById('soldTabButton').addEventListener('click', function() {
  document.getElementById('loadTab').classList.remove('active');
  document.getElementById('viewTab').classList.remove('active');
  document.getElementById('soldTab').classList.add('active');
  document.getElementById('señaTab').classList.remove('active');
  loadSoldProducts(); // Cargar productos vendidos al cambiar a la pestaña de vendidos
});

document.getElementById('señaTabButton').addEventListener('click', function() {
  document.getElementById('loadTab').classList.remove('active');
  document.getElementById('viewTab').classList.remove('active');
  document.getElementById('soldTab').classList.remove('active');
  document.getElementById('señaTab').classList.add('active');
  loadSeñados(); // Cargar productos señalados al cambiar a la pestaña de señados
});

// Calcular el total del valor de compra de los productos no vendidos
document.getElementById('calculateTotalButton').addEventListener('click', async function() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    let total = 0;
    let count = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.sold) {
        total += parseFloat(data.precioCompra || 0);
        count++;
      }
    });

    // Eliminar los decimales .00
    const totalFormatted = total.toFixed(2).replace(/\.00$/, '');

    alert(`El valor total de compra de los ${count} productos no vendidos es: $${totalFormatted}`);
  } catch (e) {
    console.error('Error al calcular el total: ', e);
    alert('Hubo un error al calcular el total');
  }
});

// Cargar productos disponibles desde Firestore
async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos productos

    let products = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.sold && !data.señado) { // Excluir productos vendidos y señalados
        products.push({ id: doc.id, ...data });
      }
    });

    // Ordenar los productos por fecha de ingreso (más viejo primero)
    products.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));

    // Renderizar los productos en la tabla
    products.forEach((data) => {
      const row = document.createElement('tr');

      // Generar el contenido HTML para la anotación
      let anotacionHtml = '';
      if (data.anotacion && data.anotacion.trim() !== '') {
        // Mostrar la anotación existente y botones de editar y borrar
        anotacionHtml = `
          <div id="anotacion-texto-${data.id}" class="mb-2">${data.anotacion}</div>
          <button class="btn btn-info btn-sm editar-btn" data-id="${data.id}">Editar</button>
          <button class="btn btn-danger btn-sm borrar-btn" data-id="${data.id}">Borrar</button>
        `;
      } else {
        // Mostrar un cuadro de texto para agregar una nueva anotación
        anotacionHtml = `
          <textarea id="anotacion-${data.id}" rows="2" placeholder="Agregar anotación"></textarea>
          <button class="btn btn-primary btn-sm mt-1 guardar-btn" data-id="${data.id}">Guardar</button>
        `;
      }

      row.innerHTML = `
        <td>${data.nombre}</td>
        <td>${data.fechaIngreso}</td>
        <td>${data.proveedor || 'No disponible'}</td>
        <td>${data.precioCompra}</td>
        <td>${data.imei}</td>
        <td>
          <button class="btn btn-success btn-sm" onclick="markAsSold('${data.id}')">Marcar como Vendido</button>
          <button class="btn btn-info btn-sm" onclick="editProduct('${data.id}')">Editar</button>
          <button class="btn btn-warning btn-sm" onclick="senarProducto('${data.id}')">Señar</button>
          <button class="btn btn-secondary btn-sm" onclick="copyIMEI('${data.imei}', this)">Copiar IMEI</button>
        </td>
        <td id="anotacion-col-${data.id}">${anotacionHtml}</td> <!-- Nueva columna para anotaciones -->
      `;
      
      productList.appendChild(row);
    });

    // Agregar eventos a los botones de anotaciones
    document.querySelectorAll('.guardar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        guardarAnotacion(productId);
      });
    });

    document.querySelectorAll('.editar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        editarAnotacion(productId);
      });
    });

    document.querySelectorAll('.borrar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        borrarAnotacion(productId);
      });
    });

  } catch (e) {
    console.error('Error al cargar productos: ', e);
    alert('Hubo un error al cargar la lista de productos');
  }
}


// Cargar productos vendidos desde Firestore y ordenarlos por fecha de venta
async function loadSoldProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const soldList = document.getElementById('soldList');
    soldList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos productos

    let soldProducts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.sold) {
        soldProducts.push({ id: doc.id, ...data });
      }
    });

    // Ordenar los productos vendidos por fecha de venta (más recientes primero)
    soldProducts.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta));

    // Renderizar los productos vendidos en la tabla
    soldProducts.forEach((data) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${data.nombre}</td>
        <td>${data.fechaIngreso}</td>
        <td>${data.proveedor || 'No disponible'}</td>
        <td>${data.precioCompra}</td>
        <td>${data.precioVenta || 'No disponible'}</td> <!-- Mostrar precio de venta -->
        <td>${data.fechaVenta || 'No disponible'}</td> <!-- Mostrar fecha de venta -->
        <td>${data.imei}</td>
        <td>${data.comprador || 'No disponible'}</td>
      `;
      soldList.appendChild(row);
    });
  } catch (e) {
    console.error('Error al cargar productos vendidos: ', e);
    alert('Hubo un error al cargar la lista de productos vendidos');
  }
}

// Cargar productos señalados desde Firestore y mostrarlos en la pestaña de productos señalados
async function loadSeñados() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const señaList = document.getElementById('señaList');
    señaList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos productos

    let señalados = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.señado && !data.sold) { // Excluir productos vendidos y solo incluir señalados
        señalados.push({ id: doc.id, ...data });
      }
    });

    // Ordenar los productos señalados por fecha de seña
    señalados.sort((a, b) => new Date(a.fechaSeña) - new Date(b.fechaSeña));

    console.log("Productos señalados a mostrar:", señalados); // Depuración: Mostrar la lista filtrada

    // Renderizar los productos señalados en la tabla
    señalados.forEach((data) => {
      const row = document.createElement('tr');

      // Generar el contenido HTML para la anotación
      let anotacionHtml = '';
      if (data.anotacion && data.anotacion.trim() !== '') {
        // Mostrar la anotación existente y botones de editar y borrar
        anotacionHtml = `
          <div id="anotacion-texto-${data.id}" class="mb-2">${data.anotacion}</div>
          <button class="btn btn-info btn-sm editar-btn" data-id="${data.id}">Editar</button>
          <button class="btn btn-danger btn-sm borrar-btn" data-id="${data.id}">Borrar</button>
        `;
      } else {
        // Mostrar un cuadro de texto para agregar una nueva anotación
        anotacionHtml = `
          <textarea id="anotacion-${data.id}" rows="2" placeholder="Agregar anotación"></textarea>
          <button class="btn btn-primary btn-sm mt-1 guardar-btn" data-id="${data.id}">Guardar</button>
        `;
      }

      row.innerHTML = `
        <td>${data.nombre}</td>
        <td>${data.fechaIngreso}</td>
        <td>${data.proveedor || 'No disponible'}</td>
        <td>${data.precioCompra}</td>
        <td>${data.precioVenta || 'No disponible'}</td> <!-- Mostrar precio de seña -->
        <td>${data.montoSeña || 'No disponible'}</td>
        <td>${data.fechaSeña || 'No disponible'}</td> <!-- Mostrar fecha de seña -->
        <td>${data.imei}</td>
        <td>${data.comprador || 'No disponible'}</td> <!-- Mostrar nombre del cliente -->
        <td>
          <button class="btn btn-success btn-sm" onclick="markAsSold('${data.id}')">Marcar como Vendido</button>
          <button class="btn btn-warning btn-sm" onclick="cancelarSeña('${data.id}')">Cancelar Seña</button>
          <button class="btn btn-secondary btn-sm" onclick="copyIMEI('${data.imei}', this)">Copiar IMEI</button>
        </td>
        <td id="anotacion-col-${data.id}">${anotacionHtml}</td> <!-- Nueva columna para anotaciones -->
      `;

      señaList.appendChild(row);
    });

    // Agregar eventos a los botones de anotaciones
    document.querySelectorAll('.guardar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        guardarAnotacion(productId);
      });
    });

    document.querySelectorAll('.editar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        editarAnotacion(productId);
      });
    });

    document.querySelectorAll('.borrar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        borrarAnotacion(productId);
      });
    });

  } catch (e) {
    console.error('Error al cargar productos señalados: ', e);
    alert('Hubo un error al cargar la lista de productos señalados');
  }
}

// Nueva función para guardar la anotación en Firestore
async function guardarAnotacion(productId) {
  try {
    const db = getFirestore();  // Asegúrate de obtener la instancia de Firestore
    const productRef = doc(db, "productos", productId);
    const anotacion = document.getElementById(`anotacion-${productId}`).value;

    // Actualizar el documento con la nueva anotación
    await updateDoc(productRef, {
      anotacion: anotacion
    });

    alert('Anotación guardada correctamente');
    // Actualizar la interfaz después de guardar
    loadSeñados();
  } catch (error) {
    console.error('Error al guardar la anotación: ', error);
    alert('Hubo un error al guardar la anotación');
  }
}

// Función para editar la anotación
function editarAnotacion(productId) {
  const anotacionTexto = document.getElementById(`anotacion-texto-${productId}`);
  const anotacionColumna = document.getElementById(`anotacion-col-${productId}`);
  
  anotacionColumna.innerHTML = `
    <textarea id="anotacion-${productId}" rows="2">${anotacionTexto.innerText}</textarea>
    <button class="btn btn-primary btn-sm mt-1 guardar-btn" data-id="${productId}">Guardar</button>
  `;

  // Agregar evento al nuevo botón de guardar creado dinámicamente
  document.querySelector(`#anotacion-col-${productId} .guardar-btn`).addEventListener('click', (event) => {
    guardarAnotacion(productId);
  });
}

// Función para borrar la anotación
async function borrarAnotacion(productId) {
  try {
    const db = getFirestore();  // Asegúrate de obtener la instancia de Firestore
    const productRef = doc(db, "productos", productId);

    // Borrar la anotación del producto
    await updateDoc(productRef, {
      anotacion: ""
    });

    alert('Anotación borrada correctamente');
    // Actualizar la interfaz después de borrar
    loadSeñados();
  } catch (error) {
    console.error('Error al borrar la anotación: ', error);
    alert('Hubo un error al borrar la anotación');
  }
}


// Función para cancelar la seña de un producto
window.cancelarSeña = async function(productId) {
  if (confirm('¿Estás seguro de que quieres cancelar la seña de este producto?')) {
    try {
      const productRef = doc(db, "productos", productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        await updateDoc(productRef, {
          señado: false,
          comprador: null,
          precioVenta: null,
          fechaSeña: null
        });
        
        alert('Seña cancelada correctamente');
        loadSeñados(); // Actualizar la lista de productos señalados
        loadProducts(); // Actualizar la lista de productos disponibles
      } else {
        alert('Producto no encontrado');
      }
    } catch (e) {
      console.error('Error al cancelar la seña: ', e);
      alert('Hubo un error al cancelar la seña');
    }
  }
}

//marcar como vendido
window.markAsSold = async function(productId) {
  try {
    const productRef = doc(db, "productos", productId);

    // Solicitar precio de venta y nombre del comprador
    const salePrice = prompt("Ingrese el precio de venta del producto:");
    const buyerName = prompt("Ingrese el nombre del comprador:");

    if (salePrice && buyerName) {
      const today = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
      await updateDoc(productRef, { 
        sold: true,
        fechaVenta: today, // Añadir la fecha de venta
        precioVenta: salePrice, // Añadir el precio de venta
        comprador: buyerName // Añadir nombre del comprador
      });
      loadProducts(); // Actualizar la lista de productos disponibles
      loadSoldProducts(); // Actualizar la lista de productos vendidos
    } else {
      alert("Debe ingresar tanto el precio de venta como el nombre del comprador.");
    }
  } catch (e) {
    console.error('Error al marcar el producto como vendido: ', e);
    alert('Hubo un error al marcar el producto como vendido');
  }
}


// Copiar IMEI al portapapeles
window.copyIMEI = function(imei, button) {
  navigator.clipboard.writeText(imei).then(() => {
    const originalText = button.innerText;
    button.innerText = 'Copiado';
    setTimeout(() => {
      button.innerText = originalText;
    }, 2000);
  }).catch((e) => {
    console.error('Error al copiar IMEI: ', e);
    alert('Hubo un error al copiar el IMEI');
  });
}

// Editar un producto usando el modal
window.editProduct = async function(productId) {
  try {
    const productRef = doc(db, "productos", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const productData = productSnap.data();

      // Mostrar datos del producto en el modal
      document.getElementById('editProductId').value = productId;
      document.getElementById('editProductName').value = productData.nombre;
      document.getElementById('editEntryDate').value = productData.fechaIngreso;
      document.getElementById('editPurchasePrice').value = productData.precioCompra;
      document.getElementById('editImei').value = productData.imei;

      // Mostrar el modal
      const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
      editProductModal.show();
    } else {
      alert("Producto no encontrado.");
    }
  } catch (e) {
    console.error('Error al editar producto: ', e);
    alert('Hubo un error al abrir el modal de edición');
  }
}

// Guardar los cambios realizados en el modal
document.getElementById('editProductForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const newProductName = document.getElementById('editProductName').value;
  const newEntryDate = document.getElementById('editEntryDate').value;
  const newPurchasePrice = document.getElementById('editPurchasePrice').value;
  const newImei = document.getElementById('editImei').value;

  try {
    const productRef = doc(db, "productos", productId);
    await updateDoc(productRef, {
      nombre: newProductName,
      fechaIngreso: newEntryDate,
      precioCompra: newPurchasePrice,
      imei: newImei
    });

    // Ocultar el modal y actualizar las listas
    const editProductModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
    editProductModal.hide();

    loadProducts(); // Actualizar la lista de productos disponibles
    loadSoldProducts(); // Actualizar la lista de productos vendidos
  } catch (e) {
    console.error('Error al guardar cambios: ', e);
    alert('Hubo un error al guardar los cambios');
  }
});
