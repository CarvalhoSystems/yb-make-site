// Variáveis globais para o estado da aplicação
let carrinho = [];
let total = 0;
let todosOsProdutos = []; // Armazena todos os produtos carregados do Firebase

document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    const productList = document.querySelector('.product-list');
    const modalProduto = document.getElementById('modal-produto');
    const fecharModalBtn = document.getElementById('fechar-modal-produto');
    const searchInput = document.getElementById('search-input');
    const sortBySelect = document.getElementById('sort-by');

    // Elementos do Carrinho Sidebar
    const btnOpenCart = document.getElementById('btn-open-cart');
    const btnCloseCart = document.getElementById('close-sidebar-btn');
    const carrinhoSidebar = document.getElementById('carrinho-sidebar');
    const carrinhoOverlay = document.getElementById('carrinho-overlay');

    // Elementos do Modal de Autenticação
    const btnOpenAuthModal = document.getElementById('btn-open-auth-modal');
    const authModal = document.getElementById('auth-modal');

    // --- LocalStorage for Cart ---
    // Load cart from localStorage on startup
    carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    total = parseFloat(localStorage.getItem('total')) || 0;
    // --- End LocalStorage for Cart ---

    // --- Carregamento de Produtos do Firebase ---
    db.collection("products").get().then((querySnapshot) => {
        productList.innerHTML = ''; // Limpa a mensagem "Carregando..."
        if (querySnapshot.empty) {
            productList.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }
        todosOsProdutos = []; // Limpa o array antes de preencher
        querySnapshot.forEach((doc) => {
            // Armazena os dados e o ID do documento
            todosOsProdutos.push({ id: doc.id, ...doc.data() });
        });

        renderizarProdutos(todosOsProdutos); // Renderiza os produtos na tela
        atualizarCarrinho(); // Atualiza a exibição do carrinho
    }).catch((error) => {
        console.error("Erro ao buscar produtos: ", error);
        productList.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    });
    // --- Fim do Carregamento de Produtos ---

    // --- Lógica de Autenticação com Firebase ---
    const authFormContainer = document.getElementById('auth-form-container');
    const userInfoContainer = document.getElementById('user-info-container');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const authErrorMessage = document.getElementById('auth-error-message');
    const closeAuthModalSpan = document.querySelector('.close-auth-modal');
    const userEmailSpan = document.getElementById('user-email');

    // Função para atualizar a UI com base no estado de autenticação
    function updateAuthUI(user) {
        if (user) {
            // Altera o texto do botão no cabeçalho para o email do usuário
            btnOpenAuthModal.innerHTML = `<i class="fas fa-user"></i> ${user.email.split('@')[0]}`;
            authFormContainer.style.display = 'none';
            userInfoContainer.style.display = 'block';
            userEmailSpan.innerText = user.email;
            authErrorMessage.innerText = ''; // Limpa erros anteriores
        } else {
            // Volta o texto do botão no cabeçalho para o padrão
            btnOpenAuthModal.innerHTML = '<i class="fas fa-user"></i> Minha Conta';
            authFormContainer.style.display = 'block';
            userInfoContainer.style.display = 'none';
            authEmailInput.value = '';
            authPasswordInput.value = '';
            authErrorMessage.innerText = ''; // Limpa erros ao deslogar
        }
    }

    // Funções para abrir/fechar o modal de autenticação
    function openAuthModal() {
        authModal.style.display = 'flex';
        authErrorMessage.innerText = ''; // Limpa a mensagem de erro ao abrir o modal
        updateAuthUI(auth.currentUser); // Garante que a UI do modal esteja correta
    }
    function closeAuthModal() {
        authModal.style.display = 'none';
    }

    // Ouve as mudanças no estado de autenticação
    auth.onAuthStateChanged((user) => {
        updateAuthUI(user);
        // Se o usuário logar/deslogar, fecha o modal se estiver aberto
        if (authModal.style.display === 'flex') {
            closeAuthModal();
        }
    });

    // Eventos para os botões de autenticação
    if (btnSignup) {
        btnSignup.addEventListener('click', () => {
            window.location.href = 'cadastro.html'; // Redireciona para a página de cadastro
        });
    }

    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = authEmailInput.value;
            const password = authPasswordInput.value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                // O onAuthStateChanged cuidará de atualizar a UI. Apenas fechamos o modal.
                closeAuthModal();
            } catch (error) {
                authErrorMessage.innerText = `E-mail ou senha incorretos. Tente novamente.`;
                console.error("Erro ao fazer login:", error);
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await auth.signOut();
                authErrorMessage.innerText = 'Você saiu da sua conta.';
                closeAuthModal(); // Fecha o modal após logout bem-sucedido
            } catch (error) {
                authErrorMessage.innerText = `Erro ao sair: ${error.message}`;
                console.error("Erro ao sair:", error);
            }
        });
    }

    // Eventos para abrir e fechar o modal de autenticação
    if (btnOpenAuthModal) {
        btnOpenAuthModal.addEventListener('click', openAuthModal);
    }
    if (closeAuthModalSpan) {
        closeAuthModalSpan.addEventListener('click', closeAuthModal);
    }
    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });
    // --- Fim da Lógica de Autenticação ---

    // --- Eventos do Carrinho Sidebar ---
    function toggleCarrinho() {
        carrinhoSidebar.classList.toggle('open');
        carrinhoOverlay.classList.toggle('open');
    }

    if (btnOpenCart) btnOpenCart.addEventListener('click', toggleCarrinho);
    if (btnCloseCart) btnCloseCart.addEventListener('click', toggleCarrinho);
    if (carrinhoOverlay) carrinhoOverlay.addEventListener('click', toggleCarrinho);
    // --- Fim dos Eventos do Carrinho ---

    // Evento para fechar o modal de produto clicando fora
    window.addEventListener('click', (evento) => {
        if (evento.target == modalProduto) {
            fecharModalProduto();
        }
    });

    // Evento para fechar o modal de produto clicando no 'X'
    if (fecharModalBtn) {
        fecharModalBtn.addEventListener('click', fecharModalProduto);
    }

    // Evento para o botão "Finalizar Compra"
    const btnFinalizar = document.querySelector('.btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', mostrarPix);
    }

    // Evento para o botão "Limpar Carrinho"
    const btnLimparCarrinho = document.getElementById('limparCarrinho');
    if (btnLimparCarrinho) {
        btnLimparCarrinho.addEventListener('click', limparCarrinho);
    }

    // Evento para o botão "Voltar ao Topo"
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
        window.onscroll = () => {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                backToTopBtn.style.display = "flex";
            } else {
                backToTopBtn.style.display = "none";
            }
        };
    }

    // Evento para a barra de busca
    if (searchInput) {
        searchInput.addEventListener('input', buscarProduto);
    }

    // Evento para a ordenação de produtos
    if (sortBySelect) {
        sortBySelect.addEventListener('change', ordenarProdutos);
    }

    // Evento para fechar o modal PIX
    const btnFecharPix = document.getElementById('btn-fechar-pix');
    if (btnFecharPix) {
        btnFecharPix.addEventListener('click', fecharPix);
    }

    // Evento para copiar a chave PIX
    const btnCopyPix = document.getElementById('btn-copy-pix');
    if (btnCopyPix) {
        btnCopyPix.addEventListener('click', copiarChavePix);
    }
});

// --- Funções Globais da Aplicação ---

function renderizarProdutos(produtos) {
    const productList = document.querySelector('.product-list');
    productList.innerHTML = ''; // Limpa a lista antes de renderizar

    if (produtos.length === 0) {
        productList.innerHTML = '<p>Nenhum produto encontrado com este critério.</p>';
        return;
    }

    produtos.forEach(produto => {
        const produtoHTML = `
            <div class="product-card" data-id="${produto.id}">
                <div class="product-image-container">
                    <img src="${produto.image || ''}" alt="Imagem de ${produto.title || 'Produto'}">
                    <div class="product-hover-buttons">
                        <button class="btn-details">Ver Detalhes</button>
                        <button class="btn-add-cart">Adicionar ao Carrinho</button>
                    </div>
                </div>
                <h3 class="product-name">${produto.title || 'Nome Indisponível'}</h3>
                <p class="product-price">R$ ${(produto.price || 0).toFixed(2).replace('.', ',')}</p>
            </div>
        `;
        productList.innerHTML += produtoHTML;
    });

    // Adiciona os eventos aos novos botões criados
    adicionarEventosAosCards();
}

function adicionarEventosAosCards() {
    document.querySelectorAll('.product-card').forEach(card => {
        const id = card.dataset.id;
        const produto = todosOsProdutos.find(p => p.id === id);

        card.querySelector('.btn-details').addEventListener('click', () => {
            abrirModalProduto(produto);
        });

        card.querySelector('.btn-add-cart').addEventListener('click', () => {
            adicionarAoCarrinho(produto.title, produto.price);
        });
    });
}

function adicionarAoCarrinho(nome, preco) {
    // Verifica se o produto já existe no carrinho
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        // Se existe, apenas incrementa a quantidade
        itemExistente.quantidade++;
    } else {
        // Se não existe, adiciona o novo item com quantidade 1
        carrinho.push({ nome, preco, quantidade: 1 });
    }

    total += preco;
    salvarCarrinho(); // Salva no localStorage
    atualizarCarrinho();
}

function buscarProduto() {
    const termo = document.getElementById('search-input').value.toLowerCase();
    const produtosFiltrados = todosOsProdutos.filter(produto => 
        produto.title.toLowerCase().includes(termo)
    );
    renderizarProdutos(produtosFiltrados);
}

function ordenarProdutos() {
    const sortValue = document.getElementById('sort-by').value;
    let produtosOrdenados = [...todosOsProdutos]; // Cria uma cópia para não modificar o original

    switch (sortValue) {
        case 'menor-preco':
            produtosOrdenados.sort((a, b) => a.price - b.price);
            break;
        case 'maior-preco':
            produtosOrdenados.sort((a, b) => b.price - a.price);
            break;
        case 'popularidade':
        default:
            // A ordem padrão do Firebase já pode ser considerada "popularidade"
            // ou podemos voltar ao array original.
            produtosOrdenados = [...todosOsProdutos];
            break;
    }
    renderizarProdutos(produtosOrdenados);
}

//voltar ao topo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Salva o estado do carrinho no localStorage
function salvarCarrinho() {
    // Converte o array de objetos para uma string JSON
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    // Salva o total como string
    localStorage.setItem('total', total);
}

function atualizarCarrinho() {
    const carrinhoContainer = document.querySelector('.produtos-carrinho');
    const totalCarrinho = document.querySelector('.total');
    const cartCounter = document.getElementById('cart-counter');

    carrinhoContainer.innerHTML = '';
    carrinho.forEach((item, index) => {
        const itemCarrinhoDiv = document.createElement('div');
        itemCarrinhoDiv.classList.add('carrinho-item');
        itemCarrinhoDiv.innerHTML = `
            <span>${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            <button class="btn-remover" data-index="${index}" title="Remover Item">&times;</button>
        `;
        carrinhoContainer.appendChild(itemCarrinhoDiv);
    });
    totalCarrinho.innerText = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;

    // Atualiza o contador do ícone do carrinho
    const totalItems = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    cartCounter.innerText = totalItems;
    cartCounter.style.display = totalItems > 0 ? 'block' : 'none';
    // Adiciona os eventos de clique para os novos botões de remover
    document.querySelectorAll('.btn-remover').forEach(botao => {
        botao.addEventListener('click', removerItemDoCarrinho);
    });
}

function removerItemDoCarrinho(evento) {
    const index = parseInt(evento.target.dataset.index);
    const item = carrinho[index];

    // Subtrai o preço de uma unidade do total
    total -= item.preco;
    item.quantidade--;

    // Se a quantidade chegar a zero, remove o item completamente do array
    if (item.quantidade === 0) {
        carrinho.splice(index, 1);
    }

    // Se o total for negativo por algum erro de ponto flutuante, zera.
    if (total < 0) total = 0;

    salvarCarrinho(); // Salva no localStorage
    atualizarCarrinho(); // Atualiza a exibição do carrinho
}

// Mostrar PIX
function mostrarPix() {
    const totalPixSpan = document.getElementById('total-pix');
    const modalPix = document.getElementById('modal-pix');

    if (carrinho.length === 0) {
        alert('O carrinho está vazio!');
        return;
    }
    totalPixSpan.innerText = total.toFixed(2).replace('.', ',');
    modalPix.style.display = 'flex';
}

function copiarChavePix() {
    const chavePix = document.getElementById('pix-chave').innerText;
    const btnCopy = document.getElementById('btn-copy-pix');

    navigator.clipboard.writeText(chavePix).then(() => {
        // Feedback visual para o usuário
        const originalText = btnCopy.innerHTML;
        btnCopy.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        btnCopy.style.backgroundColor = '#28a745'; // Verde
        setTimeout(() => {
            btnCopy.innerHTML = originalText;
            btnCopy.style.backgroundColor = ''; // Volta à cor original
        }, 2000);
    });
}

function fecharPix() {
    document.getElementById('modal-pix').style.display = 'none';
}

function limparCarrinho() {
    carrinho = [];
    total = 0;
    salvarCarrinho(); // Salva no localStorage
    atualizarCarrinho();
}

// --- Lógica para o Modal de Detalhes do Produto ---

// Função para abrir o modal com os detalhes do produto
function abrirModalProduto(produto) {
    const modalProduto = document.getElementById('modal-produto');

    // Preenche o modal com as informações
    document.getElementById('modal-produto-img').src = produto.image || '';
    document.getElementById('modal-produto-nome').innerText = produto.title || 'Nome Indisponível';
    document.getElementById('modal-produto-preco').innerText = `R$ ${(produto.price || 0).toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-produto-descricao').innerText = produto.description || 'Sem descrição detalhada.';

    // Adiciona o evento de clique ao botão "Adicionar ao Carrinho" do modal
    const modalBtnCarrinho = document.getElementById('modal-btn-carrinho');
    
    // Clona e substitui o botão para remover event listeners antigos
    const novoBtn = modalBtnCarrinho.cloneNode(true);
    modalBtnCarrinho.parentNode.replaceChild(novoBtn, modalBtnCarrinho);

    novoBtn.addEventListener('click', () => {
        adicionarAoCarrinho(produto.title, produto.price);
        // Opcional: dar um feedback visual de que foi adicionado
        fecharModalProduto(); // Fecha o modal após adicionar
    });

    // Exibe o modal
    modalProduto.style.display = 'flex';
}

// Função para fechar o modal
function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none';
}
