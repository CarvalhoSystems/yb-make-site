// Configuração centralizada do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC2cBfkKjT16srTeVYAedNgA6qOw0h97vc",
  authDomain: "yb-make.firebaseapp.com",
  projectId: "yb-make",
  storageBucket: "yb-make.firebasestorage.app",
  messagingSenderId: "685414342925",
  appId: "1:685414342925:web:9b17e3194f393c87569044",
  measurementId: "G-C05626SV51"
};

// Inicializa o Firebase apenas se ainda não foi inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}