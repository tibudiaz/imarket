// Importar las funciones necesarias desde Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Configuración de Firebase (se asume que es la misma que en admin.js)
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

// Función para mostrar el modal de alerta personalizada
function showModal(message) {
  document.getElementById('customAlertMessage').innerText = message;
  $('#customAlertModal').modal('show');
}

// Función para mostrar el modal de entrada de datos
function showSenarModal(productId) {
  document.getElementById('productIdToSell').value = productId;
  $('#senarProductoModal').modal('show');
}

// Función para señar un producto
window.senarProducto = function(productId) {
  showSenarModal(productId);
}

// Manejar el evento de confirmación del formulario en el modal
document.getElementById('confirmSenia').addEventListener('click', async function() {
  const productId = document.getElementById('productIdToSell').value;
  const customerName = document.getElementById('customerName1').value;
  const seniaAmount = document.getElementById('seniaAmount1').value;
  const salePrice = document.getElementById('salePrice1').value;

  if (customerName && seniaAmount && salePrice) {
    try {
      const productRef = doc(db, "productos", productId);
      await updateDoc(productRef, { 
        señado: true,
        comprador: customerName,  // Nombre del cliente
        montoSeña: seniaAmount,       // Monto de la seña
        precioVenta: salePrice,        // Precio de venta
        fechaSeña: new Date().toISOString().split('T')[0]
      });

      showModal('Producto señado exitosamente');
      $('#senarProductoModal').modal('hide');
      // Aquí puedes agregar lógica para actualizar la lista de productos disponibles y señados si es necesario
    } catch (e) {
      console.error('Error al señar el producto: ', e);
      showModal('Hubo un error al señar el producto');
    }
  } else {
    showModal("Debe ingresar el nombre del cliente, el monto de la seña y el precio de venta.");
  }
});