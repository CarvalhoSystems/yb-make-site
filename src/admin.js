document.addEventListener('DOMContentLoaded', () => {
    // O Firebase já é inicializado pelo firebase-config.js
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elementos da página
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    const adminErrorMessage = document.getElementById('admin-error-message');

    // Elementos do formulário de produto
    const productForm = {
        id: document.getElementById('product-id'),
        title: document.getElementById('product-title'),
        description: document.getElementById('product-description'),
        price: document.getElementById('product-price'),
        image: document.getElementById('product-image'),
        btnSave: document.getElementById('btn-save-product'),
    };

    const productListAdmin = document.getElementById('product-list-admin');

    // Função para mostrar/esconder painel
    function togglePanel(isLoggedIn) {
        if (isLoggedIn) {
            loginSection.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadProducts();
        } else {
            loginSection.classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    }

    // Verifica o estado do login ao carregar a página
    auth.onAuthStateChanged(user => {
        togglePanel(!!user);
    });

    // Evento de Login
    btnAdminLogin.addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged vai cuidar de mostrar o painel
        } catch (error) {
            adminErrorMessage.innerText = 'Email ou senha inválidos.';
            console.error("Erro de login:", error);

            if (email === '' || password === '') {
                adminErrorMessage.innerText = 'Por favor, preencha todos os campos.';
            } else if (error.code === 'auth/user-not-found') {
                adminErrorMessage.innerText = 'Usuário não encontrado.';
            } else if (error.code === 'auth/wrong-password') {
                adminErrorMessage.innerText = 'Senha incorreta.';
            } else {
                adminErrorMessage.innerText = 'Ocorreu um erro ao fazer login. Tente novamente.';
            }
        }
    });

    // Evento de Logout
    btnAdminLogout.addEventListener('click', async () => {
        await auth.signOut();
        // onAuthStateChanged vai cuidar de esconder o painel
    });

    // Carregar e exibir produtos
    async function loadProducts() {
        productListAdmin.innerHTML = 'Carregando...';
        const snapshot = await db.collection('products').get();
        productListAdmin.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const productEl = document.createElement('div');
            productEl.className = 'product-item';
            const priceFormatted = (product.price || 0).toFixed(2).replace('.', ',');
            productEl.innerHTML = `
                <img src="${product.image || 'https://via.placeholder.com/50'}" alt="Miniatura" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                <span style="flex-grow: 1;">${product.title}</span>
                <span style="margin-right: 15px; font-weight: bold; color: #555;">R$ ${priceFormatted}</span>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" data-id="${doc.id}">Editar</button>
                    <button class="btn-delete" data-id="${doc.id}">Excluir</button>
                </div>
            `;
            productListAdmin.appendChild(productEl);
        });

        // Adicionar eventos aos botões de editar e excluir
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => editProduct(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
        });
    }

    // Salvar (criar ou atualizar) produto
    productForm.btnSave.addEventListener('click', async () => {
        const id = productForm.id.value;
        const data = {
            title: productForm.title.value,
            description: productForm.description.value,
            price: parseFloat(productForm.price.value),
            image: productForm.image.value,
        };

        if (id) { // Se tem ID, atualiza
            await db.collection('products').doc(id).update(data);
            alert('Produto atualizado com sucesso!');
        } else { // Se não tem ID, cria um novo
            await db.collection('products').add(data);
            alert('Produto adicionado com sucesso!');
        }

        // Limpa o formulário e recarrega a lista
        productForm.id.value = '';
        productForm.title.value = '';
        productForm.description.value = '';
        productForm.price.value = '';
        productForm.image.value = '';
        loadProducts();
    });

    // Preencher formulário para edição
    async function editProduct(id) {
        const doc = await db.collection('products').doc(id).get();
        const product = doc.data();
        productForm.id.value = id;
        productForm.title.value = product.title;
        productForm.description.value = product.description;
        productForm.price.value = product.price;
        productForm.image.value = product.image;
        window.scrollTo(0, 0); // Rola para o topo para ver o formulário
    }

    // Excluir produto
    async function deleteProduct(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            await db.collection('products').doc(id).delete();
            alert('Produto excluído com sucesso!');
            loadProducts();
        }
    }
});