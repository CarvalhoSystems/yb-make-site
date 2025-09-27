document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const signupForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('signup-error-message');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Pega os valores do formulário
            const name = document.getElementById('signup-name').value;
            const dob = document.getElementById('signup-dob').value;
            const phone = document.getElementById('signup-phone').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            // Validação básica
            if (password !== confirmPassword) {
                errorMessage.innerText = 'As senhas não coincidem.';
                return;
            }
            if (password.length < 6) {
                errorMessage.innerText = 'A senha deve ter no mínimo 6 caracteres.';
                return;
            }

            try {
                // 1. Cria o usuário no Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Salva as informações adicionais no Firestore
                // Usamos o UID do usuário como ID do documento para ligar os dados.
                await db.collection('users').doc(user.uid).set({
                    name: name,
                    dob: dob,
                    phone: phone,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Guarda a data de criação
                });

                // 3. Redireciona para a página principal após o sucesso
                alert('Cadastro realizado com sucesso! Você será redirecionado.');
                window.location.href = 'index.html';

            } catch (error) {
                console.error("Erro no cadastro:", error);
                // Mapeia erros comuns do Firebase para mensagens amigáveis
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage.innerText = 'Este email já está cadastrado.';
                } else {
                    errorMessage.innerText = 'Ocorreu um erro ao realizar o cadastro. Tente novamente.';
                }
            }
        });
    }
});