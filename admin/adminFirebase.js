// Este script será executado depois que todos os outros scripts (com 'defer') forem carregados.

// 1. Inicializa o Firebase v8.
const firebaseConfig = {
  apiKey: "AIzaSyC2cBfkKjT16srTeVYAedNgA6qOw0h97vc",
  authDomain: "yb-make.firebaseapp.com",
  projectId: "yb-make",
  storageBucket: "yb-make.firebasestorage.app",
  appId: "1:685414342925:web:9b17e3194f393c87569044",
};
firebase.initializeApp(firebaseConfig);

// 2. Registra o backend do Firebase manualmente no CMS.
// O objeto 'FirebaseBackend' é disponibilizado globalmente pelo script do backend.
CMS.registerBackend('firebase', window.FirebaseBackend);

// 3. Inicializa o Decap CMS, que agora sabe o que é o backend 'firebase'.
CMS.init();

