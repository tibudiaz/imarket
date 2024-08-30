// Importar las funciones necesarias desde Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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
    loadAvailableProducts(); // Cargar productos disponibles al inicio
    loadSoldProducts(); // Cargar productos vendidos al inicio
    loadSeñados(); // Cargar productos señalados al inicio
  } else {
    alert('Debes estar autenticado para acceder a esta página.');
    window.location.href = 'index.html'; // Redirigir al login
  }
});

// Alternar entre pestañas
document.getElementById('availableTabButton').addEventListener('click', function() {
  document.getElementById('availableTab').classList.add('active');
  document.getElementById('soldTab').classList.remove('active');
  document.getElementById('señaTab').classList.remove('active');
  loadAvailableProducts(); // Cargar productos disponibles al cambiar a la pestaña de disponibles
});

document.getElementById('soldTabButton').addEventListener('click', function() {
  document.getElementById('availableTab').classList.remove('active');
  document.getElementById('soldTab').classList.add('active');
  document.getElementById('señaTab').classList.remove('active');
  loadSoldProducts(); // Cargar productos vendidos al cambiar a la pestaña de vendidos
});
document.getElementById('señaTabButton').addEventListener('click', function() {
  document.getElementById('availableTab').classList.remove('active');
  document.getElementById('soldTab').classList.remove('active');
  document.getElementById('señaTab').classList.add('active');
  loadSeñados(); // Cargar productos disponibles al cambiar a la pestaña de disponibles
});

// Cargar productos disponibles desde Firestore
async function loadAvailableProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const availableProductList = document.getElementById('availableProductList');
    availableProductList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos productos

    // Crear un array para almacenar los productos disponibles
    let availableProducts = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.señado & !data.sold) {
        // Agregar cada producto disponible al array
        availableProducts.push({ id: doc.id, ...data });
      }
    });

    // Ordenar los productos disponibles por fecha de ingreso (más antiguo primero)
    availableProducts.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));

    // Agregar los productos disponibles ordenados a la tabla
    availableProducts.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.nombre}</td>
        <td>${product.fechaIngreso}</td>
        <td>${product.imei}</td>
        <td>${product.anotacion || ''}</td>
        <td>
          <button class="btn btn-success btn-sm" onclick="showMarkAsSoldModal('${product.id}')">Marcar como Vendido</button>
          <button class="btn btn-warning btn-sm" onclick="senarProducto('${product.id}')">Señar</button>
          <button class="btn btn-secondary btn-sm" onclick="copyImei(this, '${product.imei}')">Copiar IMEI</button>
        </td>
      `;
      availableProductList.appendChild(row);
    });
  } catch (e) {
    console.error('Error al cargar productos disponibles: ', e);
    alert('Hubo un error al cargar la lista de productos disponibles');
  }
}

// Cargar productos vendidos desde Firestore
async function loadSoldProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const soldProductList = document.getElementById('soldProductList');
    soldProductList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos productos

    // Crear un array para almacenar los productos vendidos
    let soldProducts = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.sold) {
        // Agregar cada producto vendido al array
        soldProducts.push({ id: doc.id, ...data });
      }
    });

    // Ordenar los productos vendidos por fecha de venta (más reciente primero)
    soldProducts.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta));

    // Agregar los productos vendidos ordenados a la tabla
    soldProducts.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.nombre}</td>
        <td>${product.fechaIngreso}</td>
        <td>${product.fechaVenta || 'No disponible'}</td>
        <td>${product.precioVenta || 'No disponible'}</td>
        <td>${product.comprador || 'No disponible'}</td>
        <td>${product.imei}</td>
      `;
      soldProductList.appendChild(row);
    });
  } catch (e) {
    console.error('Error al cargar productos vendidos: ', e);
    alert('Hubo un error al cargar la lista de productos vendidos');
  }
}

// Mostrar el modal para marcar un producto como vendido
window.showMarkAsSoldModal = function(productId) {
  document.getElementById('productIdToSell').value = productId;
  const markAsSoldModal = new bootstrap.Modal(document.getElementById('markAsSoldModal'));
  markAsSoldModal.show();
}

// Marcar un producto como vendido
document.getElementById('markAsSoldForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const productId = document.getElementById('productIdToSell').value;
  const buyerName = document.getElementById('buyerName').value;
  const salePrice = document.getElementById('salePrice').value;

  try {
    const productRef = doc(db, "productos", productId);

    if (buyerName && salePrice) {
      const today = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
      await updateDoc(productRef, { 
        sold: true,
        fechaVenta: today, // Añadir la fecha de venta
        precioVenta: salePrice, // Añadir el precio de venta
        comprador: buyerName // Añadir nombre del comprador
      });

      alert('Producto marcado como vendido exitosamente');
      loadAvailableProducts(); // Actualizar la lista de productos disponibles
      loadSoldProducts(); // Actualizar la lista de productos vendidos

      const markAsSoldModal = bootstrap.Modal.getInstance(document.getElementById('markAsSoldModal'));
      if (markAsSoldModal) {
        markAsSoldModal.hide();
      }
    } else {
      alert("Debe ingresar tanto el nombre del comprador como el precio de venta.");
    }
  } catch (e) {
    console.error('Error al marcar producto como vendido: ', e);
    alert('Hubo un error al marcar el producto como vendido');
  }
});

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
      row.innerHTML = `
        <td>${data.nombre}</td>
        <td>${data.fechaIngreso}</td>
        <td>${data.fechaSeña || 'No disponible'}</td> <!-- Mostrar fecha de seña -->
        <td>${data.precioVenta || 'No disponible'}</td> <!-- Mostrar precio de seña -->
        <td>${data.montoSeña || 'No disponible'}</td>
        <td>${data.imei}</td>
        <td>${data.comprador || 'No disponible'}</td> <!-- Mostrar nombre del cliente -->
        <td>${data.anotacion}<td>
        <td>
          <button class="btn btn-success btn-sm" onclick="showMarkAsSoldModal('${data.id}')">Marcar como Vendido</button>
          <button class="btn btn-warning btn-sm" onclick="cancelarSeña('${data.id}')">Cancelar Seña</button>
          <button class="btn btn-secondary btn-sm" onclick="copyIMEI('${data.imei}', this)">Copiar IMEI</button>
        </td>
      `;
      señaList.appendChild(row);
    });
  } catch (e) {
    console.error('Error al cargar productos señalados: ', e);
    alert('Hubo un error al cargar la lista de productos señalados');
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
        loadAvailableProducts();// Actualizar la lista de productos disponibles
      } else {
        alert('Producto no encontrado');
      }
    } catch (e) {
      console.error('Error al cancelar la seña: ', e);
      alert('Hubo un error al cancelar la seña');
    }
  }
}






// Función para copiar el IMEI al portapapeles y mostrar "Copiado" en el botón por 2 segundos
window.copyImei = function(button, imei) {
  const tempInput = document.createElement('input');
  document.body.appendChild(tempInput);
  tempInput.value = imei;
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  const originalText = button.textContent;
  button.textContent = 'Copiado';
  setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}

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
setInterval(loadAvailableProducts, 300000);

