// Variáveis globais para o estado da aplicação
let carrinho = [];
let total = 0;
let todosOsProdutos = []; // Armazena todos os produtos carregados do Firebase

document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  const auth = firebase.auth();
  const productListDestaque = document.getElementById("productListContainer");
  const modalProduto = document.getElementById("modal-produto");
  const fecharModalBtn = document.getElementById("fechar-modal-produto");
  const searchInput = document.getElementById("search-input");
  const sortBySelect = document.getElementById("sort-by");

  // Elementos do Carrinho Sidebar
  const btnOpenCart = document.getElementById("btn-open-cart");
  const btnCloseCart = document.getElementById("close-sidebar-btn");
  const carrinhoSidebar = document.getElementById("carrinho-sidebar");
  const carrinhoOverlay = document.getElementById("carrinho-overlay");

  // Elementos do Modal de Autenticação
  const btnOpenAuthModal = document.getElementById("btn-open-auth-modal");
  const authModal = document.getElementById("auth-modal");

  // --- LocalStorage for Cart ---
  // Load cart from localStorage on startup
  carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  total = parseFloat(localStorage.getItem("total")) || 0;
  // --- End LocalStorage for Cart ---

  // --- Carregamento de Produtos do Firebase ---
  db.collection("products")
    .get()
    .then((querySnapshot) => {
      if (productListDestaque) productListDestaque.innerHTML = ""; // Limpa a mensagem "Carregando..."
      if (querySnapshot.empty) {
        if (productListDestaque)
          productListDestaque.innerHTML = "<p>Nenhum produto encontrado.</p>";
        return;
      }
      todosOsProdutos = []; // Limpa o array antes de preencher
      querySnapshot.forEach((doc) => {
        // Armazena os dados e o ID do documento
        todosOsProdutos.push({ id: doc.id, ...doc.data() });
      });

      renderizarProdutos(todosOsProdutos, "productListContainer"); // Renderiza os produtos na tela
      atualizarCarrinho(); // Atualiza a exibição do carrinho
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos: ", error);
      if (productListDestaque)
        productListDestaque.innerHTML =
          "<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>";
    });
  // --- Fim do Carregamento de Produtos ---

  // --- Lógica de Autenticação com Firebase ---
  const authFormContainer = document.getElementById("auth-form-container");
  const userInfoContainer = document.getElementById("user-info-container");
  const authEmailInput = document.getElementById("auth-email");
  const authPasswordInput = document.getElementById("auth-password");
  const btnSignup = document.getElementById("btn-signup");
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");
  const authErrorMessage = document.getElementById("auth-error-message");
  const closeAuthModalSpan = document.querySelector(".close-auth-modal");
  const userEmailSpan = document.getElementById("user-email");

  // Função para atualizar a UI com base no estado de autenticação
  function updateAuthUI(user) {
    if (user) {
      // Altera o texto do botão no cabeçalho para o email do usuário
      btnOpenAuthModal.innerHTML = `<i class="fas fa-user"></i> ${
        user.email.split("@")[0]
      }`;
      authFormContainer.style.display = "none";
      userInfoContainer.style.display = "block";
      userEmailSpan.innerText = user.email;
      authErrorMessage.innerText = ""; // Limpa erros anteriores
    } else {
      // Volta o texto do botão no cabeçalho para o padrão
      btnOpenAuthModal.innerHTML = '<i class="fas fa-user"></i> Minha Conta';
      authFormContainer.style.display = "block";
      userInfoContainer.style.display = "none";
      authEmailInput.value = "";
      authPasswordInput.value = "";
      authErrorMessage.innerText = ""; // Limpa erros ao deslogar
    }
  }

  // Funções para abrir/fechar o modal de autenticação
  function openAuthModal() {
    authModal.style.display = "flex";
    authErrorMessage.innerText = ""; // Limpa a mensagem de erro ao abrir o modal
    updateAuthUI(auth.currentUser); // Garante que a UI do modal esteja correta
  }
  function closeAuthModal() {
    authModal.style.display = "none";
  }

  // Ouve as mudanças no estado de autenticação
  auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    // Se o usuário logar/deslogar, fecha o modal se estiver aberto
    if (authModal.style.display === "flex") {
      closeAuthModal();
    }
  });

  // Eventos para os botões de autenticação
  if (btnSignup) {
    btnSignup.addEventListener("click", () => {
      window.location.href = "cadastro.html"; // Redireciona para a página de cadastro
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
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
    btnLogout.addEventListener("click", async () => {
      try {
        await auth.signOut();
        authErrorMessage.innerText = "Você saiu da sua conta.";
        closeAuthModal(); // Fecha o modal após logout bem-sucedido
      } catch (error) {
        authErrorMessage.innerText = `Erro ao sair: ${error.message}`;
        console.error("Erro ao sair:", error);
      }
    });
  }

  // Eventos para abrir e fechar o modal de autenticação
  if (btnOpenAuthModal) {
    btnOpenAuthModal.addEventListener("click", openAuthModal);
  }
  if (closeAuthModalSpan) {
    closeAuthModalSpan.addEventListener("click", closeAuthModal);
  }
  window.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });
  // --- Fim da Lógica de Autenticação ---

  // --- Eventos do Carrinho Sidebar ---
  function toggleCarrinho() {
    carrinhoSidebar.classList.toggle("open");
    carrinhoOverlay.classList.toggle("open");
  }

  if (btnOpenCart) btnOpenCart.addEventListener("click", toggleCarrinho);
  if (btnCloseCart) btnCloseCart.addEventListener("click", toggleCarrinho);
  if (carrinhoOverlay)
    carrinhoOverlay.addEventListener("click", toggleCarrinho);
  // --- Fim dos Eventos do Carrinho ---

  // Evento para fechar o modal de produto clicando fora
  window.addEventListener("click", (evento) => {
    if (evento.target == modalProduto) {
      fecharModalProduto();
    }
  });

  // Evento para fechar o modal de produto clicando no 'X'
  if (fecharModalBtn) {
    fecharModalBtn.addEventListener("click", fecharModalProduto);
  }

  // Evento para o botão "Finalizar Compra"
  const btnFinalizar = document.querySelector(".btn-finalizar");
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", () => {
      if (carrinho.length === 0) {
        // Mostra o alerta SÓ SE o carrinho estiver vazio no momento do clique.
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Seu carrinho está vazio!",
        });
        return;
      }
      // Se o carrinho não estiver vazio, chama a função para mostrar o PIX.
      mostrarPix();
    });
  }

  // Evento para o botão "Limpar Carrinho"
  // ... (código existente até a função limparCarrinho)

  function limparCarrinho(pagamentoFinalizado = false) {
    // Se o carrinho já estiver vazio, mostra um alerta e para a execução.
    if (carrinho.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "O carrinho já está vazio!",
      });
      return;
    }

    carrinho = [];
    total = 0;
    salvarCarrinho(); // Salva no localStorage
    atualizarCarrinho(); // Mostra o alerta de sucesso apenas se não for uma limpeza após pagamento.

    if (!pagamentoFinalizado) {
      Swal.fire({
        icon: "success",
        title: "Tudo Limpo!",
        text: "Seu carrinho foi limpo com sucesso!",
      });
    }
  }

  // ============================================
  // 📢 NOVO: FUNÇÃO DE CONFIRMAÇÃO VIA WHATSAPP
  // ============================================

  function confirmarPagamento() {
    // Verificação de segurança (embora o botão só apareça com o carrinho cheio)
    if (carrinho.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Ops!",
        text: "O carrinho está vazio. Não há nada para confirmar.",
      });
      return;
    }

    // 1. Fecha o modal PIX
    fecharPix();

    // --- Prepara a Mensagem para o WhatsApp ---
    // 🚨 IMPORTANTE: Substitua 'SEUNUMEROAQUI' pelo seu número real (ex: 5511987654321)
    const numeroWhatsApp = "5511971822511";

    let mensagem =
      "Olá, YB MAKE's! Acabei de efetuar uma compra PIX e desejo enviar o comprovante.\n\n";
    mensagem += "✅ *RESUMO DO MEU PEDIDO:*\n";

    // Cria a lista de produtos
    carrinho.forEach((item) => {
      // Formata cada linha do item
      const precoTotalItem = (item.preco * item.quantidade)
        .toFixed(2)
        .replace(".", ",");
      mensagem += `* ${item.nome} (x${item.quantidade}) - R$ ${precoTotalItem}\n`;
    });

    // Adiciona o total da compra
    const totalFormatado = total.toFixed(2).replace(".", ",");
    mensagem += `\n*TOTAL DA COMPRA:* R$ ${totalFormatado}`;
    mensagem +=
      "\n\nSegue o comprovante. Por favor, confirme o recebimento! 😊";

    // Codifica a mensagem para URL
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      mensagem
    )}`;

    // 2. Mostra o alerta de AVISO antes de redirecionar para o WhatsApp
    Swal.fire({
      title: "Quase lá! Estamos te esperando! 💖",
      html: `
            <p>Para concluir a compra e garantir o envio, toque em <strong>'Enviar Comprovante'</strong>. Você será redirecionado para o nosso WhatsApp com o resumo do pedido pronto!</p>
            <p style='margin-top: 15px; font-weight: bold;'>Total: R$ ${totalFormatado}</p>
        `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: '<i class="fab fa-whatsapp"></i> Enviar Comprovante',
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#25D366", // Verde WhatsApp
    }).then((result) => {
      if (result.isConfirmed) {
        // Ação principal: Abre o link do WhatsApp em uma nova aba
        window.open(linkWhatsApp, "_blank");

        // 3. Limpa o carrinho
        // Usamos a função limparCarrinho(true) para limpar sem mostrar o alerta de sucesso normal.
        limparCarrinho(true);

        // 4. Alerta para o Cliente (Feedback Final)
        Swal.fire({
          title: "Pedido Recebido! 🎉",
          text: "Verifique seu WhatsApp para enviar o comprovante. Retornaremos o contato em breve!",
          icon: "success",
          confirmButtonColor: "#ff69b4",
        });
      }
    });
  }
  // --- Eventos do Carrinho Sidebar ---

  // Evento para o botão "Voltar ao Topo"
  const backToTopBtn = document.getElementById("backToTop");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", scrollToTop);
    window.onscroll = () => {
      if (
        document.body.scrollTop > 100 ||
        document.documentElement.scrollTop > 100
      ) {
        backToTopBtn.style.display = "flex";
      } else {
        backToTopBtn.style.display = "none";
      }
    };
  }

  // Evento para a barra de busca
  if (searchInput) {
    searchInput.addEventListener("input", buscarProduto);
  }

  // Evento para a ordenação de produtos
  if (sortBySelect) {
    sortBySelect.addEventListener("change", ordenarProdutos);
  }

  // Evento para fechar o modal PIX
  const btnFecharPix = document.getElementById("btn-fechar-pix");
  if (btnFecharPix) {
    btnFecharPix.addEventListener("click", fecharPix);
  }

  // Evento para copiar a chave PIX
  const btnCopyPix = document.getElementById("btn-copy-pix");
  if (btnCopyPix) {
    btnCopyPix.addEventListener("click", copiarChavePix);
  }

  // Evento para o botão "Já Efetuei o Pagamento"
  const btnConfirmarPagamento = document.getElementById("confirma-pagamento");
  if (btnConfirmarPagamento) {
    btnConfirmarPagamento.addEventListener("click", () => {
      // 1. Fecha o modal PIX
      fecharPix();

      // 2. Mostra o alerta de confirmação de sucesso
      Swal.fire({
        title: "Pagamento Confirmado! 🎉",
        html: "<p>Agradecemos a sua compra! Seu pedido será processado e enviado após a confimação do pagamento.</p><p style='font-size:0.9em;'>Você receberá uma confirmação por e-mail.</p>",
        icon: "success",
        confirmButtonText: "Entendi",
        confirmButtonColor: "#ff69b4", // Cor da sua loja
      }).then(() => {
        // 3. Limpa o carrinho após a confirmação
        limparCarrinho(true); // Passa um parâmetro para não mostrar o alerta de "carrinho vazio"
      });
    });
  }

  // Inicializa todos os carrosséis da página
  inicializarCarrossel("finalSkincareCarousel");
  carregarNovidades();
  inicializarCarrossel("novidadesCarousel");
  carregarNovidades();
});
//-------------------------------------
// --- Funções Globais da Aplicação ---
//-------------------------------------

function renderizarProdutos(produtos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return; // Se o container não existir, não faz nada

  container.innerHTML = ""; // Limpa a lista antes de renderizar

  if (produtos.length === 0) {
    container.innerHTML = "<p>Nenhum produto encontrado com este critério.</p>";
    return;
  }

  produtos.forEach((produto) => {
    const produtoHTML = `
            <div class="product-card" data-id="${produto.id}">
                <div class="product-image-container">
                    <img src="${produto.image || ""}" alt="Imagem de ${
      produto.title || "Produto"
    }">
                    <div class="product-hover-buttons">
                        <button class="btn-details">Ver Detalhes</button>
                        <button class="btn-add-cart">Adicionar ao Carrinho</button>
                    </div>
                </div>
                <h3 class="product-name">${
                  produto.title || "Nome Indisponível"
                }</h3>
                <p class="product-price">R$ ${(produto.price || 0)
                  .toFixed(2)
                  .replace(".", ",")}</p>
            </div>
        `;
    container.innerHTML += produtoHTML;
  });

  // Adiciona os eventos aos novos botões criados
  adicionarEventosAosCards();
}

function adicionarEventosAosCards() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const id = card.dataset.id;
    const produto = todosOsProdutos.find((p) => p.id === id);

    card.querySelector(".btn-details").addEventListener("click", () => {
      abrirModalProduto(produto);
    });

    card.querySelector(".btn-add-cart").addEventListener("click", () => {
      // CORREÇÃO: Passando a imagem do produto para a função
      adicionarAoCarrinho(produto.title, produto.price, produto.image);
    });
  });
}

function adicionarAoCarrinho(nome, preco, imagem) {
  // Verifica se o produto já existe no carrinho
  const itemExistente = carrinho.find((item) => item.nome === nome);

  if (itemExistente) {
    // Se existe, apenas incrementa a quantidade
    itemExistente.quantidade++;
  } else {
    // CORREÇÃO: Adiciona o novo item com a imagem
    carrinho.push({ nome, preco, imagem, quantidade: 1 });
  }

  total += preco;
  salvarCarrinho(); // Salva no localStorage
  atualizarCarrinho();

  // CORREÇÃO: Alerta de sucesso com a imagem do produto
  Swal.fire({
    toast: true,
    position: "top-end",
    html: `
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${imagem}" alt="${nome}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
        <span style="font-weight: bold;">Produto adicionado!</span>
      </div>
    `,
    showConfirmButton: false,
    timer: 2000, // Aumentei um pouco o tempo para dar pra ver a imagem
    timerProgressBar: true,
  });
}

function buscarProduto() {
  const termo = document.getElementById("search-input").value.toLowerCase();
  const produtosFiltrados = todosOsProdutos.filter((produto) =>
    produto.title.toLowerCase().includes(termo)
  );
  renderizarProdutos(produtosFiltrados, "productListContainer");
}

function ordenarProdutos() {
  const sortValue = document.getElementById("sort-by").value;
  let produtosOrdenados = [...todosOsProdutos]; // Cria uma cópia para não modificar o original

  switch (sortValue) {
    case "menor-preco":
      produtosOrdenados.sort((a, b) => a.price - b.price);
      break;
    case "maior-preco":
      produtosOrdenados.sort((a, b) => b.price - a.price);
      break;
    case "popularidade":
    default:
      // A ordem padrão do Firebase já pode ser considerada "popularidade"
      // ou podemos voltar ao array original.
      produtosOrdenados = [...todosOsProdutos];
      break;
  }
  renderizarProdutos(produtosOrdenados, "productListContainer");
}

//voltar ao topo
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Salva o estado do carrinho no localStorage
function salvarCarrinho() {
  // Converte o array de objetos para uma string JSON
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  // Salva o total como string
  localStorage.setItem("total", total);
}

function atualizarCarrinho() {
  const carrinhoContainer = document.querySelector(".produtos-carrinho");
  const totalCarrinho = document.querySelector(".total");
  const cartCounter = document.getElementById("cart-counter");

  carrinhoContainer.innerHTML = "";
  carrinho.forEach((item, index) => {
    const itemCarrinhoDiv = document.createElement("div");
    itemCarrinhoDiv.classList.add("carrinho-item");
    itemCarrinhoDiv.innerHTML = `
            <!-- CORREÇÃO: Adicionando a imagem ao item do carrinho -->
            <img src="${item.imagem}" alt="${
      item.nome
    }" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; margin-right: 10px;">
            <div style="flex-grow: 1;">
              <span style="display: block; font-size: 0.9em;">${item.nome} (x${
      item.quantidade
    })</span>
              <span style="display: block; font-size: 0.8em; color: #666;">R$ ${(
                item.preco * item.quantidade
              )
                .toFixed(2)
                .replace(".", ",")}</span>
            </div>
            <button class="btn-remover" data-index="${index}" title="Remover Item">&times;</button>
        `;
    carrinhoContainer.appendChild(itemCarrinhoDiv);
  });
  totalCarrinho.innerText = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;

  // Atualiza o contador do ícone do carrinho
  const totalItems = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  cartCounter.innerText = totalItems;
  cartCounter.style.display = totalItems > 0 ? "block" : "none";
  // Adiciona os eventos de clique para os novos botões de remover
  document.querySelectorAll(".btn-remover").forEach((botao) => {
    botao.addEventListener("click", removerItemDoCarrinho);
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
  const totalPixSpan = document.getElementById("total-pix");
  const modalPix = document.getElementById("modal-pix");

  if (carrinho.length === 0) {
    alert("O carrinho está vazio!");
    return;
  }
  totalPixSpan.innerText = total.toFixed(2).replace(".", ",");
  modalPix.style.display = "flex";
}

function copiarChavePix() {
  const chavePix = document.getElementById("pix-chave").innerText;
  const btnCopy = document.getElementById("btn-copy-pix");

  navigator.clipboard.writeText(chavePix).then(() => {
    // Feedback visual para o usuário
    const originalText = btnCopy.innerHTML;
    btnCopy.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    btnCopy.style.backgroundColor = "#28a745"; // Verde
    setTimeout(() => {
      btnCopy.innerHTML = originalText;
      btnCopy.style.backgroundColor = ""; // Volta à cor original
    }, 2000);
  });
}

function fecharPix() {
  document.getElementById("modal-pix").style.display = "none";
}

// ... (código existente até a função limparCarrinho)

function limparCarrinho() {
  const limparCarrinho = document.getElementById("limparCarrinho");
  if (!limparCarrinho)
    limparCarrinho.addEventListener("click", () => {
      if (carrinho.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "O carrinho já está vazio!",
        });
        return;
      }
    });
}

function limparCarrinho(pagamentoFinalizado = false) {
  // Se o carrinho já estiver vazio, mostra um alerta e para a execução.
  if (carrinho.length === 0) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text: "O carrinho já está vazio!",
    });
    return;
  }

  carrinho = [];
  total = 0;
  salvarCarrinho(); // Salva no localStorage
  atualizarCarrinho(); // Mostra o alerta de sucesso apenas se não for uma limpeza após pagamento.

  if (!pagamentoFinalizado) {
    Swal.fire({
      icon: "success",
      title: "Tudo Limpo!",
      text: "Seu carrinho foi limpo com sucesso!",
    });
  }
}

// ============================================
// 📢 NOVO: FUNÇÃO DE CONFIRMAÇÃO VIA WHATSAPP
// ============================================

function confirmarPagamento() {
  // Verificação de segurança (embora o botão só apareça com o carrinho cheio)
  if (carrinho.length === 0) {
    Swal.fire({
      icon: "error",
      title: "Ops!",
      text: "O carrinho está vazio. Não há nada para confirmar.",
    });
    return;
  }

  // 1. Fecha o modal PIX
  fecharPix();

  // --- Prepara a Mensagem para o WhatsApp ---
  // 🚨 IMPORTANTE: Substitua 'SEUNUMEROAQUI' pelo seu número real (ex: 5511987654321)
  const numeroWhatsApp = "5511971822511";

  let mensagem =
    "Olá, YB MAKE's! Acabei de efetuar uma compra PIX e desejo enviar o comprovante.\n\n";
  mensagem += "✅ *RESUMO DO MEU PEDIDO:*\n";

  // Cria a lista de produtos
  carrinho.forEach((item) => {
    // Formata cada linha do item
    const precoTotalItem = (item.preco * item.quantidade)
      .toFixed(2)
      .replace(".", ",");
    mensagem += `* ${item.nome} (x${item.quantidade}) - R$ ${precoTotalItem}\n`;
  });

  // Adiciona o total da compra
  const totalFormatado = total.toFixed(2).replace(".", ",");
  mensagem += `\n*TOTAL DA COMPRA:* R$ ${totalFormatado}`;
  mensagem += "\n\nSegue o comprovante. Por favor, confirme o recebimento! 😊";

  // Codifica a mensagem para URL
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
    mensagem
  )}`;

  // 2. Mostra o alerta de AVISO antes de redirecionar para o WhatsApp
  Swal.fire({
    title: "Quase lá! Estamos te esperando! 💖",
    html: `
            <p>Para concluir a compra e garantir o envio, toque em <strong>'Enviar Comprovante'</strong>. Você será redirecionado para o nosso WhatsApp com o resumo do pedido pronto!</p>
            <p style='margin-top: 15px; font-weight: bold;'>Total: R$ ${totalFormatado}</p>
        `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: '<i class="fab fa-whatsapp"></i> Enviar Comprovante',
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#25D366", // Verde WhatsApp
  }).then((result) => {
    if (result.isConfirmed) {
      // Ação principal: Abre o link do WhatsApp em uma nova aba
      window.open(linkWhatsApp, "_blank");

      // 3. Limpa o carrinho
      // Usamos a função limparCarrinho(true) para limpar sem mostrar o alerta de sucesso normal.
      limparCarrinho(true);

      // 4. Alerta para o Cliente (Feedback Final)
      Swal.fire({
        title: "Pedido Recebido! 🎉",
        text: "Verifique seu WhatsApp para enviar o comprovante. Retornaremos o contato em breve!",
        icon: "success",
        confirmButtonColor: "#ff69b4",
      });
    }
  });
}

// --- Lógica para o Modal de Detalhes do Produto ---

// Função para abrir o modal com os detalhes do produto
function abrirModalProduto(produto) {
  const modalProduto = document.getElementById("modal-produto");

  // Preenche o modal com as informações
  document.getElementById("modal-produto-img").src = produto.image || "";
  document.getElementById("modal-produto-nome").innerText =
    produto.title || "Nome Indisponível";
  document.getElementById("modal-produto-preco").innerText = `R$ ${(
    produto.price || 0
  )
    .toFixed(2)
    .replace(".", ",")}`;
  document.getElementById("modal-produto-descricao").innerText =
    produto.description || "Sem descrição detalhada.";

  // Adiciona o evento de clique ao botão "Adicionar ao Carrinho" do modal
  const modalBtnCarrinho = document.getElementById("modal-btn-carrinho");

  // Clona e substitui o botão para remover event listeners antigos
  const novoBtn = modalBtnCarrinho.cloneNode(true);
  modalBtnCarrinho.parentNode.replaceChild(novoBtn, modalBtnCarrinho);

  novoBtn.addEventListener("click", () => {
    // CORREÇÃO: Passando a imagem também no modal de detalhes
    adicionarAoCarrinho(produto.title, produto.price, produto.image);
    // Opcional: dar um feedback visual de que foi adicionado
    fecharModalProduto(); // Fecha o modal após adicionar
  });

  // Exibe o modal
  modalProduto.style.display = "flex";
}

// Função para fechar o modal
function fecharModalProduto() {
  document.getElementById("modal-produto").style.display = "none";
}

// --- Lógica do Carrossel (Reutilizável) ---
function inicializarCarrossel(carouselId) {
  const container = document.getElementById(carouselId);
  if (!container) return;

  const track = container.querySelector(".carousel-track");
  const items = container.querySelectorAll(".carousel-item");
  const prevBtn = container.querySelector(".carousel-nav-btn.prev");
  const nextBtn = container.querySelector(".carousel-nav-btn.next");
  const dotsContainer = container.querySelector(".carousel-dots");
  let currentIndex = 0;

  if (!track || items.length === 0 || !prevBtn || !nextBtn || !dotsContainer)
    return;

  // Criar os "dots" de navegação
  dotsContainer.innerHTML = "";
  items.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      currentIndex = index;
      updateCarousel();
    });
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll(".dot");

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
  });

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel();
  });

  // Autoplay (opcional, descomente para ativar)
  setInterval(() => {
    nextBtn.click();
  }, 5000); // Muda a cada 5 segundos

  updateCarousel(); // Inicializa na posição correta
}

// --- Lógica de Novidades ---
function carregarNovidades() {
  const db = firebase.firestore();
  const novidadesList = document.getElementById("novidades");

  // Busca produtos marcados como "novidades" no Firestore
  db.collection("products")
    .where("novidades", "==", true)
    .get()
    .then((querySnapshot) => {
      if (novidadesList) novidadesList.innerHTML = ""; // Limpa a lista
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos:", error);
      if (novidadesList)
        novidadesList.innerHTML =
          "<p>Erro ao carregar as Novidades Tente novamente mais tarde.</p>";
    });
}
// logica maquiagem
make.addEventListener("click", () => {
  window.location.href = "makeup.html"; // Redireciona para a página de maquiagem
});
// logica skincare
skin.addEventListener("click", () => {
  window.location.href = "skincare.html"; // Redireciona para a página de skincare
});
// logica haircare
hair.addEventListener("click", () => {
  window.location.href = "haircare.html"; // Redireciona para a página de haircare
});
// Logica marcas
brand.addEventListener("click", () => {
  window.location.href = "brands.html"; // Redireciona para a página de marcas
});
marcas.addEventListener("click", () => {
  window.localStorage.href = "maquiagem.html"; // Redireciona para a página de produtos
});
//=========================
//       Maps
//=========================
// Localização da YB MAKE's Cosméticos (Exemplo de São Paulo)
// SUBSTITUA ESTES VALORES PELA LATITUDE E LONGITUDE REAIS DA SUA LOJA!
const lojaLocalizacao = { lat: -23.868837868001805, lng: -46.7536695087922 }; // Exemplo: São Paulo

function initMap() {
  // 1. Cria o objeto de mapa
  const map = new google.maps.Map(
    document.getElementById("google-map-container"),
    {
      zoom: 15, // Nível de zoom (quanto maior, mais perto)
      center: lojaLocalizacao,
    }
  );

  // 2. Adiciona um marcador (pin) no endereço
  new google.maps.Marker({
    position: lojaLocalizacao,
    map: map,
    title: "YB MAKE's Cosméticos",
  });
}

// ============================
// Função das marcas exibidas
// ============================

// Exemplo 1: EUDORA
function showEudoraDetails() {
  Swal.fire({
    title: "Eudora - Sua Beleza, Seu Poder ✨",
    icon: "info",
    html: `
            <p style="margin-bottom: 10px;">Uma das maiores marcas nacionais, com foco em produtos de alta performance e fragrâncias marcantes.</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Destaque:</strong> Linha de Batons Soul Kiss Me e as Bases Glam. <br>
                <strong>Oferta:</strong> Kits exclusivos de perfumaria e maquiagem com 20% OFF!
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Ver Linha Eudora",
    cancelButtonText: "Fechar",
    confirmButtonColor: "#9C34A9", // Cor roxa/lilás
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "#promocoes"; // Exemplo de destino
    }
  });
}
// Chame: showEudoraDetails(); quando o logo da Eudora for clicado.
// Exemplo 2: PRINCIPIA
function showPrincipiaDetails() {
  Swal.fire({
    title: "Principia - Ciência e Acessibilidade 🔬",
    icon: "question",
    html: `
            <p style="margin-bottom: 10px;">Skincare funcional focado em alta concentração de ativos como Niacinamida e Vitamina C. Simples e direto!</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Produto Essencial:</strong> Sérum com Ácido Hialurônico.<br>
                <strong>Dica:</strong> Monte sua rotina básica (Limpeza + Sérum + Hidratante).
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Explorar Skincare",
    cancelButtonText: "Fechar",
    confirmButtonColor: "#1E90FF", // Cor azul (ciência/dermato)
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "#skincare"; // Leva para a seção de Skincare
    }
  });
}
// Chame: showPrincipiaDetails();
// Exemplo 3: BRUNA TAVARES (BT)
function showBTDetails() {
  Swal.fire({
    title: "Bruna Tavares - Tendência e Qualidade Premium 💖",
    icon: "success", // Usamos sucesso porque é uma marca muito querida
    html: `
            <p style="margin-bottom: 10px;">Lançamentos que viralizam! Maquiagens com fórmulas que unem alta performance, inovação e embalagens lindas.</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Best-Seller:</strong> Linha BT Velvet e o BT Hydra Primer.<br>
                <strong>Lançamento:</strong> Novos tons da base Skinplush!
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Ver Destaques BT",
    cancelButtonText: "Fechar",
    confirmButtonColor: "#ff69b4", // Cor rosa forte (a sua cor principal)
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "#novidades"; // Leva para os lançamentos
    }
  });
}
// Event Listener para a grade de marcas
document.addEventListener("DOMContentLoaded", () => {
  const brandGrid = document.querySelector(".brand-grid");
  if (brandGrid) {
    brandGrid.addEventListener("click", (event) => {
      const brandItem = event.target.closest(".brand-item");
      if (brandItem) {
        const brandId = brandItem.getAttribute("data-brand");

        // Mapeamento de ID para a função correta
        switch (brandId) {
          case "eudora":
            showEudoraDetails();
            break;
          case "principia":
            showPrincipiaDetails();
            break;
          case "brunatavares":
            showBTDetails();
            break;
          default:
            // Se for uma marca não configurada
            Swal.fire({
              icon: "info",
              title: "Detalhes indisponíveis",
              text: "Informações desta marca em breve!",
              timer: 2000,
              showConfirmButton: false,
            });
        }
      }
    });
  }
  // ... (Outros listeners do DOMContentLoaded)
});
