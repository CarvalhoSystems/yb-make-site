// Global variables for cart and total, initialized to empty/zero.
// These will be loaded from localStorage inside DOMContentLoaded.
let carrinho = [];
let total = 0;

document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth(); // Initialize Firebase Auth

    const productList = document.querySelector('.product-list');
    const carrinhoContainer = document.querySelector('.produtos-carrinho');
    const totalCarrinho = document.querySelector('.total');
    const modalProduto = document.getElementById('modal-produto');
    const fecharModalBtn = document.querySelector('.fechar-modal-produto');

    // New elements for auth modal
    const btnOpenAuthModal = document.getElementById('btn-open-auth-modal');
    const authModal = document.getElementById('auth-modal');

    // --- LocalStorage for Cart ---
    // Load cart from localStorage on startup
    carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    total = parseFloat(localStorage.getItem('total')) || 0;
    // --- End LocalStorage for Cart ---

    // --- Firebase Product Loading ---
    db.collection("products").get().then((querySnapshot) => {
        productList.innerHTML = ''; // Limpa a mensagem "Carregando..."
        if (querySnapshot.empty) {
            productList.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            // console.log("Dados do produto do Firebase:", produto); // Keep for debugging if needed
            const produtoHTML = `
                <div class="content">
                    <img src="${produto.image || ''}" alt="Imagem de ${produto.title || 'Produto'}">
                    <h2>${produto.title || 'Nome Indisponível'}</h2>
                    <p>R$ ${(produto.price || 0).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-carrinho">🛒 Adicionar ao Carrinho</button>
                    <p>${produto.description || 'Sem descrição.'}</p>
                </div>
            `;
            productList.innerHTML += produtoHTML;
        });

        inicializarEventosProdutos();
        inicializarEventosCarrinho();
        atualizarCarrinho(); // Update cart display after loading from localStorage
    }).catch((error) => {
        console.error("Erro ao buscar produtos: ", error);
        productList.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    });
    // --- End Firebase Product Loading ---

    // --- Firebase Authentication Logic ---
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

    // Function to update UI based on auth state
    function updateAuthUI(user) {
        if (user) {
            // Altera o texto do botão no cabeçalho para o email do usuário
            btnOpenAuthModal.innerText = user.email;
            authFormContainer.style.display = 'none';
            userInfoContainer.style.display = 'block';
            userEmailSpan.innerText = user.email;
            authErrorMessage.innerText = ''; // Limpa erros anteriores
        } else {
            // Volta o texto do botão no cabeçalho para o padrão
            btnOpenAuthModal.innerText = 'Minha Conta';
            authFormContainer.style.display = 'block';
            userInfoContainer.style.display = 'none';
            authEmailInput.value = '';
            authPasswordInput.value = '';
            authErrorMessage.innerText = ''; // Limpa erros ao deslogar
        }
    }

    // Function to open auth modal
    function openAuthModal() {
        authModal.style.display = 'flex';
        authErrorMessage.innerText = ''; // Limpa a mensagem de erro ao abrir o modal
        updateAuthUI(auth.currentUser); // Garante que a UI do modal esteja correta
    }
    // Function to close auth modal
    function closeAuthModal() {
        authModal.style.display = 'none';
    }

    // Listen for authentication state changes
    auth.onAuthStateChanged((user) => {
        updateAuthUI(user);
    });
    // If user logs in/out, close the modal if it was open
    if (authModal.style.display === 'flex') {
        closeAuthModal();
    }

    // Event listeners for auth buttons
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
                authErrorMessage.innerText = 'Login realizado com sucesso!'; // Fecha o modal após login bem-sucedido
            } catch (error) {
                authErrorMessage.innerText = `Erro ao fazer login E-mail ou senha incorretos.`;
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

    // Event listeners for opening and closing the auth modal
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
    // --- End Firebase Authentication Logic ---

    // Event for closing product modal by clicking outside
    window.addEventListener('click', (evento) => {
        if (evento.target == modalProduto) {
            fecharModalProduto();
        }
    });

    // Event for closing product modal by clicking 'X'
    if (fecharModalBtn) {
        fecharModalBtn.addEventListener('click', fecharModalProduto);
    }

    // Attach event listener for "Finalizar Compra" button
    const btnFinalizar = document.querySelector('.btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', mostrarPix);
    }

    // Attach event listener for "Limpar Carrinho" button
    const btnLimparCarrinho = document.getElementById('limparCarrinho');
    if (btnLimparCarrinho) {
        btnLimparCarrinho.addEventListener('click', limparCarrinho);
    }

    // Attach event listener for "Voltar ao Topo" button
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
    }

    // Attach event listener for search button
    const searchButton = document.querySelector('.search-box button');
    if (searchButton) {
        searchButton.addEventListener('click', buscarProduto);
    }
});

// --- All functions defined outside DOMContentLoaded ---

function inicializarEventosProdutos() {
    // Adiciona o evento de clique para cada imagem de produto (para abrir o modal)
    document.querySelectorAll('.product-list .content img').forEach(img => {
        img.addEventListener('click', (evento) => {
            const produtoCard = evento.target.closest('.content');
            abrirModalProduto(produtoCard);
        });
        img.style.cursor = 'pointer';
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

function inicializarEventosCarrinho() {
    // Adiciona evento aos botões "Adicionar ao Carrinho"
    document.querySelectorAll('.btn-carrinho').forEach(botao => {
        botao.addEventListener('click', () => {
            const produto = botao.parentElement;
            const nome = produto.querySelector('h2').innerText;
            const precoTexto = produto.querySelectorAll('p')[0].innerText.replace('R$ ', '').replace(',', '.');
            const preco = parseFloat(precoTexto);
            adicionarAoCarrinho(nome, preco);
        });
    });
}

function buscarProduto() {
    const input = document.getElementById('pesquisa').value.toLowerCase();
    const produtos = document.querySelectorAll('.product-list .content');
    produtos.forEach(produto => {
        const nome = produto.querySelector('h2').textContent.toLowerCase();
        produto.style.display = nome.includes(input) ? 'block' : 'none';
    });
}

//voltar ao topo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// **NOVA FUNÇÃO** para salvar o estado do carrinho no localStorage
function salvarCarrinho() {
    // Converte o array de objetos para uma string JSON
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    // Salva o total como string
    localStorage.setItem('total', total);
}

function atualizarCarrinho() {
    const carrinhoContainer = document.querySelector('.produtos-carrinho');
    const totalCarrinho = document.querySelector('.total');

    carrinhoContainer.innerHTML = '';
    carrinho.forEach((item, index) => {
        const itemCarrinhoDiv = document.createElement('div');
        itemCarrinhoDiv.classList.add('carrinho-item');
        itemCarrinhoDiv.innerHTML = `
            <span>${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            <button class="btn-remover" data-index="${index}" title="Remover Item">❌</button>
        `;
        carrinhoContainer.appendChild(itemCarrinhoDiv);
    });
    totalCarrinho.innerText = `Total: R$ ${total.toFixed(2).replace('.', ',')}`; // Use replace('.', ',') para o formato R$

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
function abrirModalProduto(produtoCard) {
    const modalProduto = document.getElementById('modal-produto');
    // Coleta as informações do card do produto
    const nome = produtoCard.querySelector('h2')?.innerText || 'Nome Indisponível';
    const precoTexto = produtoCard.querySelector('p')?.innerText || 'R$ 0,00';
    // A descrição é o segundo <p> dentro do .content. Se não existir, usa um fallback.
    const descricaoElement = produtoCard.querySelectorAll('p')[1];
    const descricao = descricaoElement ? descricaoElement.innerText : 'Sem descrição.';
    const img = produtoCard.querySelector('img')?.src || '';

    // Preenche o modal com as informações
    document.getElementById('modal-produto-img').src = img;
    document.getElementById('modal-produto-nome').innerText = nome;
    document.getElementById('modal-produto-preco').innerText = precoTexto;
    document.getElementById('modal-produto-descricao').innerText = descricao;

    // Adiciona o evento de clique ao botão "Adicionar ao Carrinho" do modal
    const modalBtnCarrinho = document.getElementById('modal-btn-carrinho');
    
    // Remove event listeners antigos para evitar adicionar o mesmo item várias vezes
    const novoBtn = modalBtnCarrinho.cloneNode(true);
    modalBtnCarrinho.parentNode.replaceChild(novoBtn, modalBtnCarrinho);

    novoBtn.addEventListener('click', () => {
        const preco = parseFloat(precoTexto.replace('R$ ', '').replace(',', '.'));
        adicionarAoCarrinho(nome, preco);
        fecharModalProduto(); // Fecha o modal após adicionar
    });

    // Exibe o modal
    modalProduto.style.display = 'flex';
}

// Função para fechar o modal
function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none';
}
