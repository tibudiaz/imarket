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
  const purchasePrice = document.getElementById('purchasePrice').value;
  const imei = document.getElementById('imei').value;

  try {
    await addDoc(collection(db, "productos"), {
      nombre: productName,
      fechaIngreso: entryDate,
      precioCompra: purchasePrice,
      imei: imei,
      sold: false
    });

    alert('Producto cargado exitosamente');
    document.getElementById('productForm').reset();
    loadProducts(); // Actualizar la lista de productos
    loadSoldProducts(); // Actualizar la lista de productos vendidos
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
});

document.getElementById('viewTabButton').addEventListener('click', function() {
  document.getElementById('loadTab').classList.remove('active');
  document.getElementById('viewTab').classList.add('active');
  document.getElementById('soldTab').classList.remove('active');
  loadProducts(); // Cargar productos disponibles al cambiar a la pestaña de vista
});

document.getElementById('soldTabButton').addEventListener('click', function() {
  document.getElementById('loadTab').classList.remove('active');
  document.getElementById('viewTab').classList.remove('active');
  document.getElementById('soldTab').classList.add('active');
  loadSoldProducts(); // Cargar productos vendidos al cambiar a la pestaña de vendidos
});

// Calcular el total del valor de compra de los productos no vendidos
document.getElementById('calculateTotalButton').addEventListener('click', async function() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    let total = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.sold) {
        total += parseFloat(data.precioCompra || 0);
      }
    });

    alert('El valor total de compra de los productos no vendidos es: $' + total.toFixed(2));
  } catch (e) {
    console.error('Error al calcular el total: ', e);
    alert('Hubo un error al calcular el total');
  }
});

// Cargar productos desde Firestore
async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos productos

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.sold) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${data.nombre}</td>
          <td>${data.fechaIngreso}</td>
          <td>${data.precioCompra}</td>
          <td>${data.imei}</td>
          <td>
            <button class="btn btn-success btn-sm" onclick="markAsSold('${doc.id}')">Marcar como Vendido</button>
            <button class="btn btn-info btn-sm" onclick="editProduct('${doc.id}')">Editar</button>
          </td>
        `;
        productList.appendChild(row);
      }
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

// Marcar un producto como vendido
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
    console.error('Error al marcar producto como vendido: ', e);
    alert('Hubo un error al marcar el producto como vendido');
  }
}

// Editar un producto
window.editProduct = function(productId) {
  const productRef = doc(db, "productos", productId);

  getDoc(productRef).then((docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('editProductName').value = data.nombre;
      document.getElementById('editEntryDate').value = data.fechaIngreso;
      document.getElementById('editPurchasePrice').value = data.precioCompra;
      document.getElementById('editImei').value = data.imei;
      document.getElementById('editProductId').value = productId;

      const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
      editProductModal.show();
    } else {
      alert('No se encontró el producto.');
    }
  }).catch((error) => {
    console.error('Error al obtener el producto: ', error);
    alert('Hubo un error al obtener el producto');
  });
}

// Guardar cambios del producto editado
document.getElementById('saveEditButton').addEventListener('click', async function() {
  const productId = document.getElementById('editProductId').value;
  const updatedName = document.getElementById('editProductName').value;
  const updatedEntryDate = document.getElementById('editEntryDate').value;
  const updatedPurchasePrice = document.getElementById('editPurchasePrice').value;
  const updatedImei = document.getElementById('editImei').value;

  try {
    const productRef = doc(db, "productos", productId);
    await updateDoc(productRef, {
      nombre: updatedName,
      fechaIngreso: updatedEntryDate,
      precioCompra: updatedPurchasePrice,
      imei: updatedImei
    });

    alert('Producto actualizado exitosamente');
    loadProducts(); // Actualizar la lista de productos disponibles
    const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    editProductModal.hide(); // Ocultar el modal
  } catch (e) {
    console.error('Error al actualizar producto: ', e);
    alert('Hubo un error al actualizar el producto');
  }
});
setInterval(loadProducts, 2000);
setInterval(loadSoldProducts, 2000);
