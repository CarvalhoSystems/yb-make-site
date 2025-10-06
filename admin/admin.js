// O Firebase já foi inicializado pelo firebase-config.js
// Apenas obtemos as instâncias dos serviços que vamos usar.
const auth = firebase.auth();
const db = firebase.firestore();
// O Firebase Storage não é mais utilizado.

// CONFIGURAÇÕES DO CLOUDINARY
// *** 1. SUBSTITUA 'SEU_CLOUD_NAME_AQUI' PELO SEU NOME DE CONTA DO CLOUDINARY ***
const CLOUD_NAME = 'dfm3xz9sm'; 
// *** 2. Verifique se este preset está "Não Assinado" (Unsigned) no Cloudinary ***
const UPLOAD_PRESET = 'YB-Make-upload-adm'; 
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
// ----------------------------------------------------
// FUNÇÕES DO MODAL (Substituem alert() e confirm())
// ----------------------------------------------------
const modalBackdrop = document.getElementById('custom-modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalBtnOk = document.getElementById('modal-btn-ok');
const modalBtnCancel = document.getElementById('modal-btn-cancel');

function showModal(title, message, isConfirm = false) {
    return new Promise(resolve => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalBtnCancel.style.display = isConfirm ? 'inline-block' : 'none';
        modalBackdrop.style.display = 'flex';

        modalBtnOk.onclick = () => {
            modalBackdrop.style.display = 'none';
            resolve(true);
        };

        if (isConfirm) {
            modalBtnCancel.onclick = () => {
                modalBackdrop.style.display = 'none';
                resolve(false);
            };
        } else {
            modalBtnCancel.onclick = null;
        }
    });
}

const showAlert = (message) => showModal('Aviso', message, false);
const showConfirm = (message) => showModal('Confirmação', message, true);
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
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
        image: document.getElementById('product-image'), // Campo HIDDEN para a URL existente
        productImageUrlManual: document.getElementById('product-image-url-manual'), // Novo campo de URL manual
        btnSave: document.getElementById('btn-save-product'), // O botão Salvar
        
        // Elementos de upload de imagem e pré-visualização
        fileInput: document.getElementById('product-file'),
        fileNameDisplay: document.getElementById('file-name-display'),
        imagePreviewContainer: document.getElementById('image-preview-container'), // NOVO
        currentProductImage: document.getElementById('current-product-image'), // NOVO
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
            // Limpa o formulário ao deslogar
            document.getElementById('product-form').reset();
            productForm.fileNameDisplay.textContent = 'Nenhum arquivo selecionado.';
            productForm.imagePreviewContainer.classList.add('hidden'); // Limpa pré-visualização
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
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Verifica se é admin no Firestore
            const adminDoc = await db.collection('admins').doc(user.email).get();
            if (adminDoc.exists) {
                console.log('Login de administrador bem-sucedido');
                // onAuthStateChanged irá cuidar de mostrar o painel
            } else {
                await auth.signOut(); 
                adminErrorMessage.innerText = 'Acesso negado. Você não é um administrador.';
            }
        } catch (error) {
            if (email === '' || password === '') {
                adminErrorMessage.innerText = 'Por favor, preencha todos os campos.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                adminErrorMessage.innerText = 'Email ou senha incorretos.';
            } else {
                adminErrorMessage.innerText = 'Erro ao fazer login. Verifique os dados e tente novamente.';
                console.error('Erro ao fazer login:', error);
            } 
        } finally {
            if (!auth.currentUser) {
                btnAdminLogin.innerText = 'Entrar';
                btnAdminLogin.disabled = false;
            }
        }
    });

    // Evento de Logout
    btnAdminLogout.addEventListener('click', async () => {
        await auth.signOut();
    });

    // Evento de seleção de arquivo
    productForm.fileInput.addEventListener('change', () => {
        const file = productForm.fileInput.files[0];
        if (file) {
            productForm.fileNameDisplay.innerText = file.name;
            // Limpa o campo de URL manual, pois priorizamos o arquivo
            productForm.productImageUrlManual.value = '';

            // Pré-visualização do novo arquivo
            const reader = new FileReader();
            reader.onload = (e) => {
                productForm.currentProductImage.src = e.target.result;
                productForm.imagePreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);

        } else {
            productForm.fileNameDisplay.innerText = 'Nenhum arquivo selecionado.';
            // Se estiver em modo edição, mantém a imagem existente (se houver)
            if (!productForm.id.value) {
                 productForm.imagePreviewContainer.classList.add('hidden');
                 productForm.currentProductImage.src = '';
            }
        }
    });

    // Carregar e exibir produtos
    async function loadProducts() {
        try {
            productListAdmin.innerHTML = '<p class="text-center text-gray-500">Carregando produtos...</p>';
            const snapshot = await db.collection('products').get();
            productListAdmin.innerHTML = '';
            
            if (snapshot.empty) {
                productListAdmin.innerHTML = '<p class="text-center text-gray-500">Nenhum produto cadastrado.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const product = doc.data();
                const productEl = document.createElement('div');
                const priceFormatted = (product.price || 0).toFixed(2).replace('.', ',');
                
                // Usando as classes Tailwind para exibir a imagem corretamente
                productEl.className = 'flex items-center justify-between p-3 mb-3 bg-white rounded-xl shadow'; 
                productEl.innerHTML = `
                    <div class="w-16 h-16 mr-4 flex-shrink-0">
                        <img src="${product.image || 'https://placehold.co/64x64/cccccc/333333?text=N/A'}" 
                             onerror="this.onerror=null;this.src='https://placehold.co/64x64/cccccc/333333?text=N/A';" 
                             alt="Miniatura" 
                             class="w-full h-full object-cover rounded-md border border-gray-200">
                    </div>
                    <div class="product-info flex-grow mx-4">
                        <h4 class="font-semibold text-gray-800">${product.title}</h4>
                        <p class="text-sm text-gray-500">R$ ${priceFormatted}</p>
                    </div>
                    <div class="flex space-x-2 flex-shrink-0">
                        <button class="btn-edit bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded-lg" data-id="${doc.id}">Editar</button>
                        <button class="btn-delete bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-lg" data-id="${doc.id}">Excluir</button>
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
        } catch (error) {
            productListAdmin.innerHTML = `<p class="text-center text-red-500">Erro ao carregar produtos: ${error.message}. Verifique as Regras do Firestore.</p>`;
            console.error("Erro ao carregar produtos:", error);
        }
    }

    // Salvar (criar ou atualizar) produto
    productForm.btnSave.addEventListener('click', async () => {
        const id = productForm.id.value;
        const file = productForm.fileInput.files[0];
        const manualUrlInput = productForm.productImageUrlManual.value.trim();

        // VALIDAÇÃO BÁSICA
        if (!productForm.title.value || !productForm.price.value) {
            await showAlert("Por favor, preencha o Título e o Preço.");
            return;
        }

        productForm.btnSave.disabled = true;
        productForm.btnSave.innerText = id ? 'Atualizando...' : 'Salvando...';

        // Variável para armazenar a URL final da imagem.
        let imageUrl = ''; 
        
        try {
            if (file) {
                // 1. Prioridade: Upload de novo arquivo para o Cloudinary
                
                productForm.btnSave.innerText = 'Enviando Imagem...';
                
                // Prepara os dados para o Cloudinary
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);

                // Faz o upload usando Fetch API
                const response = await fetch(UPLOAD_URL, {
                    method: 'POST',
                    body: formData,
                });
                
                if (!response.ok) {
                    // Tenta ler a mensagem de erro do Cloudinary para melhor diagnóstico
                    const errorData = await response.json();
                    throw new Error(`Falha no Cloudinary. Erro: ${errorData.error.message || response.statusText}. Verifique seu CLOUD_NAME e UPLOAD_PRESET (deve ser Unsigned).`);
                }

                const dataCloudinary = await response.json();
                
                imageUrl = dataCloudinary.secure_url; // URL do Cloudinary obtida!
            
            } else if (manualUrlInput) { 
                // 2. Se não há arquivo, usar a URL manual.
                imageUrl = manualUrlInput;
            } else if (id) {
                // 3. Se está editando e não há novas entradas, mantém a imagem antiga.
                imageUrl = productForm.image.value;
            }
            
            // Prepara os dados para salvar no Firestore
            const data = {
                title: productForm.title.value.trim(),
                description: productForm.description.value.trim(),
                // Garante que o preço seja um número, ou 0 se for inválido
                price: parseFloat(productForm.price.value) || 0,
                image: imageUrl || '', 
            };

            if (id) { 
                // Atualiza (UPDATE)
                await db.collection('products').doc(id).update(data);
                await showAlert('Produto atualizado com sucesso!');
            } else { 
                // Cria um novo (ADD)
                await db.collection('products').add(data);
                await showAlert('Produto adicionado com sucesso!');
            }

            // Limpa o formulário e reinicia o estado
            document.getElementById('product-form').reset();
            productForm.id.value = '';
            productForm.image.value = '';
            productForm.fileNameDisplay.textContent = 'Nenhum arquivo selecionado.';
            productForm.imagePreviewContainer.classList.add('hidden'); // Limpa pré-visualização

            productForm.btnSave.innerText = 'Salvar Produto';
            loadProducts(); // Recarrega a lista
            
        } catch (error) {
            await showAlert('Erro ao salvar produto. Verifique as Regras de Segurança (Firestore/Storage) e se você é um Admin. Erro: ' + error.message);
            console.error('Erro ao salvar produto:', error);
        } finally {
            productForm.btnSave.disabled = false;
        }
    });

    // Preencher formulário para edição
    async function editProduct(id) {
        try {
            const doc = await db.collection('products').doc(id).get();
            if (!doc.exists) {
                await showAlert('Produto não encontrado!');
                return;
            }
            
            const product = doc.data();
            
            // 1. Limpa o estado do arquivo e display ao iniciar a edição
            productForm.fileInput.value = ''; 
            productForm.fileNameDisplay.textContent = 'Manter imagem atual';

            // 2. Preenche os campos do formulário
            productForm.id.value = id;
            productForm.title.value = product.title;
            productForm.description.value = product.description;
            productForm.price.value = product.price;
            productForm.image.value = product.image; // Guarda a URL existente no campo hidden
            productForm.productImageUrlManual.value = product.image || ''; // Preenche o campo de URL manual

            // 3. Configura a pré-visualização
            const imageUrl = product.image;
            if (imageUrl) {
                productForm.currentProductImage.src = imageUrl;
                productForm.imagePreviewContainer.classList.remove('hidden');
            } else {
                productForm.currentProductImage.src = '';
                productForm.imagePreviewContainer.classList.add('hidden');
            }
            
            productForm.btnSave.innerText = 'Atualizar Produto';
            window.scrollTo(0, 0); 
        } catch (error) {
            await showAlert('Erro ao carregar dados para edição: ' + error.message);
            console.error('Erro de edição:', error);
        }
    }

    // Excluir produto
    async function deleteProduct(id) {
        const confirmed = await showConfirm('Tem certeza que deseja excluir este produto?');
        
        if (confirmed) {
            try {
                // A exclusão da imagem foi removida, pois não podemos excluir imagens do Cloudinary de forma segura
                // diretamente pelo front-end. Apenas o registro do produto é excluído.
                
                // Exclui o documento do Firestore
                await db.collection('products').doc(id).delete();
                await showAlert('Produto excluído com sucesso!');
                loadProducts();
                
            } catch (error) {
                await showAlert('Erro ao excluir produto. Verifique as Regras de Segurança do Firestore. Erro: ' + error.message);
                console.error('Erro ao excluir produto:', error);
            }
        }
    }
});