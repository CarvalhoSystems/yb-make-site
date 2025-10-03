document.addEventListener('DOMContentLoaded', () => {
    // O Firebase já é inicializado pelo firebase-config.js
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Elementos da página
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    const adminErrorMessage = document.getElementById('admin-error-message');

    // Elementos do formulário de produto (CORRIGIDO)
    const productForm = {
        id: document.getElementById('product-id'),
        title: document.getElementById('product-title'),
        description: document.getElementById('product-description'),
        price: document.getElementById('product-price'),
        image: document.getElementById('product-image'), // Campo HIDDEN para a URL
        productImageUrlManual: document.getElementById('product-image-url-manual'), // NOVO: Campo para URL manual
        btnSave: document.getElementById('btn-save-product'), // O botão Salvar
        
        // Elementos de upload de imagem
        fileInput: document.getElementById('product-file'),
        fileNameDisplay: document.getElementById('file-name-display'),
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

    // Evento de Login (com verificação de Admin)
    btnAdminLogin.addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        
        adminErrorMessage.innerText = '';
        btnAdminLogin.disabled = true;
        btnAdminLogin.innerText = 'Verificando...';

        try {
            // Passo 1 tenta fazer login
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Passo 2 verifica se é admin no Firestore
            const adminDoc = await db.collection('admins').doc(user.email).get();
            if (adminDoc.exists) {
                console.log('Login de administrador bem-sucedido');
                // onAuthStateChanged irá cuidar de mostrar o painel, mas chamamos para ser imediato
                togglePanel(true); 
            } else {
                // Se não for admin, desloga imediatamente
                await auth.signOut(); 
                adminErrorMessage.innerText = 'Acesso negado. Você não é um administrador.';
                btnAdminLogin.innerText = 'Entrar';
                btnAdminLogin.disabled = false;
                return;
            }
        } catch (error) {
            // Trata erros de login aqui
            if (email === '' || password === '') {
                adminErrorMessage.innerText = 'Por favor, preencha todos os campos.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                adminErrorMessage.innerText = 'Email ou senha incorretos.';
            } else {
                adminErrorMessage.innerText = 'Erro ao fazer login. Tente novamente mais tarde.';
                console.error('Erro ao fazer login:', error);
            } 
        } finally {
            // Em caso de erro, reabilita o botão
            if (!auth.currentUser) {
                btnAdminLogin.innerText = 'Entrar';
                btnAdminLogin.disabled = false;
            }
        }
    });

    // Evento de Logout
    btnAdminLogout.addEventListener('click', async () => {
        await auth.signOut();
        // onAuthStateChanged vai cuidar de esconder o painel
    });

    // Evento de seleção de arquivo (prioriza upload, limpa URL manual)
    productForm.fileInput.addEventListener('change', () => {
        const file = productForm.fileInput.files[0];
        if (file) {
            productForm.fileNameDisplay.innerText = file.name;
            productForm.productImageUrlManual.value = ''; // Limpa o campo de URL manual
        } else {
            productForm.fileNameDisplay.innerText = 'Nenhum arquivo selecionado.';
        }
    });

    // Evento de input no campo de URL manual (prioriza URL manual, limpa upload)
    productForm.productImageUrlManual.addEventListener('input', () => {
        if (productForm.productImageUrlManual.value.trim() !== '') {
            productForm.fileInput.value = ''; // Limpa o campo de upload de arquivo
            productForm.fileNameDisplay.innerText = 'URL manual inserida';
        } else {
            // Se o campo manual for limpo, volta ao estado padrão do display de arquivo
            productForm.fileNameDisplay.innerText = 'Nenhum arquivo selecionado.';
        }
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
                <img src="${product.image || 'https://via.placeholder.com/50'}" alt="Miniatura" class="product-thumb">
                <div class="product-info">
                    <h4>${product.title}</h4><p>R$ ${priceFormatted}</p>
                </div>
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
        const file = productForm.fileInput.files[0];

        // Desativa o botão e muda o texto
        productForm.btnSave.disabled = true;
        productForm.btnSave.innerText = id ? 'Atualizando...' : 'Salvando...';

        // 1. Pega a URL da imagem existente (se estiver editando)
        let imageUrl = productForm.image.value; 
        // 2. Pega a URL inserida manualmente
        const manualUrlInput = productForm.productImageUrlManual.value.trim();

        // Lógica de prioridade para a URL da imagem:
        // 1. Novo arquivo enviado
        // 2. URL inserida manualmente
        // 3. URL existente (se estiver editando e nenhuma das anteriores for fornecida)
        if (file) {
            try {
                // Cria uma referência única no Storage
                const storageRef = storage.ref(`products/${Date.now()}_${file.name}`);
                
                // Faz o upload
                const snapshot = await storageRef.put(file);
                
                // Pega a URL de download (permanente)
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                // Usa a URL do arquivo recém-enviado
                imageUrl = downloadURL; // Atualiza a variável com a nova URL
            } catch (error) {
                alert('Erro ao fazer upload da imagem: ' + error.message);
                productForm.btnSave.disabled = false;
                productForm.btnSave.innerText = id ? 'Salvar Produto' : 'Adicionar Produto';
                return; // Interrompe o processo se o upload falhar
            }
        } else if (manualUrlInput) {
            // Se não houve upload de arquivo, mas há uma URL manual, usa ela
            imageUrl = manualUrlInput;
        }
        // Prepara os dados para salvar no Firestore
        const data = {
            title: productForm.title.value,
            description: productForm.description.value,
            price: parseFloat(productForm.price.value),
            image: imageUrl || '', // Usa a URL determinada pela lógica de prioridade
        };

        if (id) { // Atualiza
            await db.collection('products').doc(id).update(data);
            alert('Produto atualizado com sucesso!');
        } else { // Cria um novo
            await db.collection('products').add(data);
            alert('Produto adicionado com sucesso!');
        }

        // Limpa o formulário e reinicia o estado
        productForm.id.value = '';
        productForm.title.value = '';
        productForm.description.value = '';
        productForm.price.value = '';
        productForm.image.value = ''; // Limpa o campo hidden
        productForm.productImageUrlManual.value = ''; // Limpa o campo de URL manual
        // Limpa os campos de arquivo
        productForm.fileInput.value = ''; 
        productForm.fileNameDisplay.textContent = 'Nenhum arquivo selecionado.';
        
        productForm.btnSave.disabled = false;
        productForm.btnSave.innerText = 'Salvar Produto';
        loadProducts();
    });

    // Preencher formulário para edição (CORRIGIDO)
    async function editProduct(id) {
        const doc = await db.collection('products').doc(id).get();
        const product = doc.data();
        
        // Limpa o estado do arquivo e display ao iniciar a edição
        productForm.fileInput.value = '';

        productForm.id.value = id;
        productForm.title.value = product.title;
        productForm.description.value = product.description;
        productForm.price.value = product.price;
        productForm.image.value = product.image; // Guarda a URL existente
        
        // Preenche o campo de URL manual com a imagem existente e atualiza o display
        if (product.image) {
            productForm.productImageUrlManual.value = product.image;
            productForm.fileNameDisplay.textContent = 'Imagem atual: URL inserida';
        } else {
            productForm.productImageUrlManual.value = '';
            productForm.fileNameDisplay.textContent = 'Nenhuma imagem selecionada.';
        }
        
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