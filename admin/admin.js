        // O Firebase já foi inicializado pelo firebase-config.js
        // Apenas obtemos as instâncias dos serviços que vamos usar.
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();

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

            // Elementos do formulário de produto (CORRIGIDO)
            const productForm = {
                id: document.getElementById('product-id'),
                title: document.getElementById('product-title'),
                description: document.getElementById('product-description'),
                price: document.getElementById('product-price'),
                image: document.getElementById('product-image'), // Campo HIDDEN para a URL existente
                productImageUrlManual: document.getElementById('product-image-url-manual'), // Novo campo de URL manual
                btnSave: document.getElementById('btn-save-product'), // O botão Salvar
                
                // Elementos de upload de imagem
                fileInput: document.getElementById('product-file'),
                fileNameDisplay: document.getElementById('file-name-display'),
                imagePreviewContainer: document.getElementById('image-preview-container'),
                currentProductImage: document.getElementById('current-product-image'),
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
                } else {
                    productForm.fileNameDisplay.innerText = 'Nenhum arquivo selecionado.';
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
                        
                       // ... dentro de loadProducts ...
                        
                        productEl.className = 'flex items-center justify-between p-3 mb-3 bg-white rounded-xl shadow'; // Classes para o container
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
// ...
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

                // ----------------------------------------------------
                // VALIDAÇÃO BÁSICA
                if (!productForm.title.value || !productForm.price.value) {
                    await showAlert("Por favor, preencha o Título e o Preço.");
                    return;
                }
                // ----------------------------------------------------

                productForm.btnSave.disabled = true;
                productForm.btnSave.innerText = id ? 'Atualizando...' : 'Salvando...';

                // Variável para armazenar a URL da imagem (começa com a existente)
                let imageUrl = productForm.image.value; 

                // Lógica de prioridade para a URL da imagem:
                // 1. Novo arquivo enviado
                // 2. URL inserida manualmente
                // 3. URL existente (se estiver editando e nenhuma das anteriores for fornecida)
                
                try {
                    if (file) {
                        productForm.btnSave.innerText = 'Fazendo Upload...';
                        // Cria uma referência única no Storage (usando Date.now() para garantir unicidade)
                        const storageRef = storage.ref(`products/${Date.now()}_${file.name}`);
                        
                        // Faz o upload
                        const snapshot = await storageRef.put(file);
                        
                        // Pega a URL de download (permanente)
                        imageUrl = await snapshot.ref.getDownloadURL();
                        
                    } else if (manualUrlInput) {
                        // Se não houve upload de arquivo, mas há uma URL manual, usa ela
                        imageUrl = manualUrlInput;
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
                    
                    // Limpa o estado do arquivo e display ao iniciar a edição
                    productForm.fileInput.value = ''; 
                    productForm.fileNameDisplay.textContent = 'Manter imagem atual';

                    productForm.id.value = id;
                    productForm.title.value = product.title;
                    productForm.description.value = product.description;
                    productForm.price.value = product.price;
                    productForm.image.value = product.image; // Guarda a URL existente no campo hidden
                    // Preenche o campo de URL manual com a imagem existente para facilitar a edição
                    productForm.productImageUrlManual.value = product.image || ''; 
                    
                    productForm.btnSave.innerText = 'Atualizar Produto';
                    window.scrollTo(0, 0); 
                } catch (error) {
                    await showAlert('Erro ao carregar dados para edição: ' + error.message);
                    console.error('Erro de edição:', error);
                }
            }

            // Excluir produto (CORRIGIDO)
            async function deleteProduct(id) {
                const confirmed = await showConfirm('Tem certeza que deseja excluir este produto?');
                
                if (confirmed) {
                    try {
                        const doc = await db.collection('products').doc(id).get();
                        const product = doc.data();
                        
                        // 1. Tenta excluir a imagem do Storage (se existir)
                        if (product.image) {
                            // Verifica se a URL é do Firebase Storage antes de tentar apagar
                            if (product.image.includes("firebasestorage.googleapis.com")) {
                                const imageRef = storage.refFromURL(product.image);
                                await imageRef.delete();
                                console.log('Imagem excluída do Storage.');
                            }try {
                            } catch (error) {
                                if (error.code === 'storage/object-not-found') {
                                    console.warn('Imagem não encontrada no Storage, continuando a exclusão do Firestore.');
                                } else {
                                    throw error; // Lança outros erros de storage
                                }
                            } 
                        }
                        
                        // 2. Exclui o documento do Firestore
                        await db.collection('products').doc(id).delete();
                        await showAlert('Produto excluído com sucesso!');
                        loadProducts();
                        
                    } catch (error) {
                        await showAlert('Erro ao excluir produto. Verifique as Regras de Segurança (Firestore/Storage) e se você é um Admin. Erro: ' + error.message);
                        console.error('Erro ao excluir produto:', error);
                    }
                }
            }
        });