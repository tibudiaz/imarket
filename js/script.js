// Importar las funciones necesarias desde Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Maneja el formulario de ingreso
document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const emailDomain = user.email.split('@')[1];

      // Redirección basada en el dominio del correo electrónico
      if (emailDomain === 'admin.com') {
        window.location.href = 'admin.html';
      } else if (emailDomain === 'moderador.com') {
        window.location.href = 'moderador.html';
      } else {
        alert('No tienes acceso a esta plataforma.');
      }
    })
    .catch((error) => {
      console.error('Error en el ingreso:', error);
      alert('Usuario o contraseña incorrectos.');
    });
});
