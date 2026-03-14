// =========================================================================
// =================== VARIÁVEIS GLOBAIS E INICIALIZAÇÃO ===================
// =========================================================================

let carrinho = [];
let total = 0;
let todosOsProdutos = []; // Armazena todos os produtos carregados do Firebase

/**
 * O evento DOMContentLoaded garante que todo o código que manipula o HTML
 * só seja executado depois que a página estiver completamente carregada.
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- INICIALIZAÇÃO ---
  const auth = firebase.auth();
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
  // CORREÇÃO: Declarando as variáveis que estavam faltando
  const modalProduto = document.getElementById("modal-produto");
  const closeAuthModalSpan = document.querySelector(".close-auth-modal");

  // Carrega o carrinho do localStorage ao iniciar
  carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  total = parseFloat(localStorage.getItem("total")) || 0;
  carregarProdutosFirebase(); // Inicia o carregamento dos produtos

  // Eventos para abrir e fechar o modal de autenticação
  if (btnOpenAuthModal) {
    btnOpenAuthModal.addEventListener("click", openAuthModal);
  }
  if (closeAuthModalSpan) {
    closeAuthModalSpan.addEventListener("click", closeAuthModal);
  }

  if (btnOpenCart) btnOpenCart.addEventListener("click", toggleCarrinho);
  if (btnCloseCart) btnCloseCart.addEventListener("click", toggleCarrinho);
  if (carrinhoOverlay)
    carrinhoOverlay.addEventListener("click", toggleCarrinho);

  // Evento para fechar o modal de produto clicando fora
  window.addEventListener("click", (evento) => {
    if (evento.target == modalProduto) {
      fecharModalProduto();
    }
  });

  const fecharModalBtn = document.getElementById("fechar-modal-produto");
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
  const btnLimparCarrinho = document.getElementById("limparCarrinho");
  if (btnLimparCarrinho) {
    btnLimparCarrinho.addEventListener("click", () => limparCarrinho(false));
  }

  // Evento para o botão "Já Efetuei o Pagamento"
  const btnConfirmarPagamento = document.getElementById("confirma-pagamento");
  if (btnConfirmarPagamento) {
    btnConfirmarPagamento.addEventListener(
      "click",
      confirmarPagamentoViaWhatsApp,
    );
  }

  // CORREÇÃO: Movendo os eventos do modal PIX para dentro do DOMContentLoaded
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

  // Eventos de busca e ordenação
  if (searchInput) searchInput.addEventListener("input", buscarProduto);
  if (sortBySelect) sortBySelect.addEventListener("change", ordenarProdutos);

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

  // Eventos de autenticação
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");

  if (btnLogin) {
    btnLogin.addEventListener("click", handleLogin);
  }
  if (btnLogout) {
    btnLogout.addEventListener("click", handleLogout);
  }

  // Ouve as mudanças no estado de autenticação
  auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    if (authModal.style.display === "flex") {
      closeAuthModal();
    }
  });

  // Evento para fechar o modal de autenticação clicando fora
  window.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  // CORREÇÃO: Atrasando a inicialização do carrossel para evitar o scroll automático no carregamento.
  // Isso dá tempo para o usuário ver o topo da página antes que o script do carrossel seja ativado.
  setTimeout(() => {
    inicializarCarrossel("finalSkincareCarousel");
  }, 1500); // Atraso de 1.5 segundos.

  carregarNovidades();
});

// =========================================================================
// =================== FIREBASE E CARREGAMENTO DE PRODUTOS =================
// =========================================================================

function carregarProdutosFirebase() {
  const db = firebase.firestore();
  const productListDestaque = document.getElementById("productListContainer");

  db.collection("products")
    .get()
    .then((querySnapshot) => {
      if (productListDestaque) productListDestaque.innerHTML = ""; // Limpa "Carregando..."
      if (querySnapshot.empty) {
        if (productListDestaque)
          productListDestaque.innerHTML = "<p>Nenhum produto encontrado.</p>";
        return;
      }
      todosOsProdutos = [];
      querySnapshot.forEach((doc) => {
        todosOsProdutos.push({ id: doc.id, ...doc.data() });
      });

      renderizarProdutos(todosOsProdutos, "productListContainer");
      atualizarCarrinho();
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos: ", error);
      if (productListDestaque) {
        productListDestaque.innerHTML =
          "<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>";
      }
    });
}

function renderizarProdutos(produtos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (produtos.length === 0) {
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
        <h3 class="product-name">${produto.title || "Nome Indisponível"}</h3>
        <p class="product-price">R$ ${(produto.price || 0)
          .toFixed(2)
          .replace(".", ",")}</p>
      </div>
    `;
    container.innerHTML += produtoHTML;
  });

  adicionarEventosAosCards();
}

// =========================================================================
// =================== LÓGICA DE PAGAMENTO (PIX E WHATSAPP) =================
// =========================================================================

function confirmarPagamentoViaWhatsApp() {
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

  // Gera a imagen do qrcode
  const qrcode = new QRCode(document.getElementById("qrcode-pix"));
  qrcode.makeCode(linkWhatsApp);

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
    mensagem,
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

// Variável global para não duplicar o QR Code toda vez que abrir o modal
let qrcodeGerado = null;

function formatarCampoEmv(id, valor) {
  const tamanho = String(valor.length).padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

function calcularCrc16(payload) {
  let resultado = 0xffff;
  for (let offset = 0; offset < payload.length; offset++) {
    resultado ^= payload.charCodeAt(offset) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((resultado & 0x8000) !== 0) {
        resultado = (resultado << 1) ^ 0x1021;
      } else {
        resultado <<= 1;
      }
      resultado &= 0xffff;
    }
  }
  return resultado.toString(16).toUpperCase().padStart(4, "0");
}

function gerarPayloadPix({ chave, nome, cidade, valor, txid = "***" }) {
  const nomeFormatado = nome.slice(0, 25);
  const cidadeFormatada = cidade.slice(0, 15);

  const gui = formatarCampoEmv("00", "br.gov.bcb.pix");
  const chaveEmv = formatarCampoEmv("01", chave);
  const merchantAccountInfo = formatarCampoEmv("26", `${gui}${chaveEmv}`);

  const payloadSemCrc = [
    formatarCampoEmv("00", "01"),
    merchantAccountInfo,
    formatarCampoEmv("52", "0000"),
    formatarCampoEmv("53", "986"),
    formatarCampoEmv("54", valor),
    formatarCampoEmv("58", "BR"),
    formatarCampoEmv("59", nomeFormatado),
    formatarCampoEmv("60", cidadeFormatada),
    formatarCampoEmv("62", formatarCampoEmv("05", txid)),
    "6304",
  ].join("");

  const crc = calcularCrc16(payloadSemCrc);
  return `${payloadSemCrc}${crc}`;
}

function fecharPix() {
  const modalPix = document.getElementById("modal-pix");
  if (modalPix) {
    modalPix.style.display = "none";
  }
}

function mostrarPix() {
  const totalPixSpan = document.getElementById("total-pix");
  const modalPix = document.getElementById("modal-pix");
  const qrcodeContainer = document.getElementById("qrcode-pix");

  if (carrinho.length === 0) {
    Swal.fire("Ops!", "O carrinho está vazio!", "error");
    return;
  }

  // Formata o valor para 2 casas decimais (ex: 10.00)
  const valorFormatado = total.toFixed(2);
  totalPixSpan.innerText = valorFormatado.replace(".", ",");

  // A MÁGICA: Gera o BR Code (padrão do Banco Central)
  // Nota: Para um sistema real, o ideal seria o backend gerar isso.
  const chave = "yasmin_princesinha@icloud.com";
  const nome = "YASMIN B";
  const cidade = "SAOPAULO";

  const payloadPix = gerarPayloadPix({
    chave,
    nome,
    cidade,
    valor: valorFormatado,
  });

  modalPix.style.display = "flex";
  qrcodeContainer.innerHTML = "";

  new QRCode(qrcodeContainer, {
    text: payloadPix,
    width: 180,
    height: 180,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}
function copiarChavePix() {
  const chavePix = document.getElementById("pix-chave").innerText;
  const btnCopy = document.getElementById("btn-copy-pix");
  const originalText = btnCopy.innerHTML;

  // Função para mudar o visual do botão (sucesso)
  const mostrarSucesso = () => {
    btnCopy.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    btnCopy.style.backgroundColor = "#28a745";
    btnCopy.style.color = "#fff";
    setTimeout(() => {
      btnCopy.innerHTML = originalText;
      btnCopy.style.backgroundColor = "";
      btnCopy.style.color = "";
    }, 2000);
  };

  // 1. Tenta o método moderno (Clipboard API)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(chavePix)
      .then(() => mostrarSucesso())
      .catch((err) => {
        console.error("Erro ao copiar via API: ", err);
        tentarCopiaManual(chavePix, mostrarSucesso);
      });
  } else {
    // 2. Método de segurança (Fallback para HTTP ou navegadores antigos)
    tentarCopiaManual(chavePix, mostrarSucesso);
  }
}

// Função auxiliar para copiar criando um campo de texto invisível
function tentarCopiaManual(texto, callbackSucesso) {
  const inputTemporario = document.createElement("textarea");
  inputTemporario.value = texto;
  document.body.appendChild(inputTemporario);
  inputTemporario.select();
  inputTemporario.setSelectionRange(0, 99999); // Para mobile

  try {
    document.execCommand("copy");
    callbackSucesso();
  } catch (err) {
    console.error("Falha ao copiar manualmente: ", err);
    alert(
      "Não foi possível copiar. Por favor, selecione o texto e copie manualmente.",
    );
  }

  document.body.removeChild(inputTemporario);
}

function confirmarPagamentoViaWhatsApp() {
  if (carrinho.length === 0) {
    Swal.fire({ icon: "error", title: "Ops!", text: "O carrinho está vazio." });
    return;
  }

  const numeroWhatsApp = "5511971822511";
  let mensagem =
    "Olá, YB MAKE's! Acabei de efetuar uma compra PIX e desejo enviar o comprovante.\n\n";
  mensagem += "✅ *RESUMO DO MEU PEDIDO:*\n";

  carrinho.forEach((item) => {
    const precoTotalItem = (item.preco * item.quantidade)
      .toFixed(2)
      .replace(".", ",");
    mensagem += `* ${item.nome} (x${item.quantidade}) - R$ ${precoTotalItem}\n`;
  });

  const totalFormatado = total.toFixed(2).replace(".", ",");
  mensagem += `\n*TOTAL DA COMPRA:* R$ ${totalFormatado}`;

  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

  fecharPix();

  Swal.fire({
    title: "Quase lá! 💖",
    html: `<p>Toque em <strong>'Enviar Comprovante'</strong> para validar sua compra no WhatsApp.</p>`,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: '<i class="fab fa-whatsapp"></i> Enviar Comprovante',
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#25D366",
  }).then((result) => {
    if (result.isConfirmed) {
      window.open(linkWhatsApp, "_blank");
      limparCarrinho(true);
      Swal.fire(
        "Pedido Recebido! 🎉",
        "Enviamos os detalhes para o seu WhatsApp.",
        "success",
      );
    }
  });
}

// =========================================================================
// =================== LÓGICA DOS CARDS DE PRODUTO =========================
// =========================================================================

// Adiciona os eventos aos cards
function adicionarEventosAosCards() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const id = card.dataset.id;
    const produto = todosOsProdutos.find((p) => p.id === id);

    // CORREÇÃO: Adicionando uma verificação de segurança.
    // Se o produto não for encontrado no array, pula para o próximo card para evitar erros.
    if (!produto) return;

    card.querySelector(".btn-details").addEventListener("click", () => {
      abrirModalProduto(produto);
    });

    card.querySelector(".btn-add-cart").addEventListener("click", () => {
      adicionarAoCarrinho(produto.title, produto.price, produto.image);
    });
  });
}

// =========================================================================
// =================== LÓGICA DO CARRINHO DE COMPRAS =======================
// =========================================================================

function adicionarAoCarrinho(nome, preco, imagem) {
  // Verifica se o produto já existe no carrinho
  const itemExistente = carrinho.find((item) => item.nome === nome);

  if (itemExistente) {
    // Se existe, apenas incrementa a quantidade
    itemExistente.quantidade++;
  } else {
    // Adiciona o novo item com a imagem
    carrinho.push({ nome, preco, imagem, quantidade: 1 });
  }

  total += preco;
  salvarCarrinho(); // Salva no localStorage
  atualizarCarrinho();

  // Alerta de sucesso com a imagem do produto
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
    timer: 2000,
    timerProgressBar: true,
  });
}

function removerItemDoCarrinho(evento) {
  const index = parseInt(evento.target.dataset.index);
  const item = carrinho[index];

  total -= item.preco;
  item.quantidade--;

  if (item.quantidade === 0) {
    carrinho.splice(index, 1);
  }

  if (total < 0) total = 0;

  salvarCarrinho();
  atualizarCarrinho();
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

  const totalItems = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  cartCounter.innerText = totalItems;
  cartCounter.style.display = totalItems > 0 ? "block" : "none";

  document.querySelectorAll(".btn-remover").forEach((botao) => {
    botao.addEventListener("click", removerItemDoCarrinho);
  });
}

function limparCarrinho(pagamentoFinalizado = false) {
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
  salvarCarrinho();
  atualizarCarrinho();

  if (!pagamentoFinalizado) {
    Swal.fire({
      icon: "success",
      title: "Tudo Limpo!",
      text: "Seu carrinho foi limpo com sucesso!",
    });
  }
}

// =========================================================================
// =================== BUSCA, ORDENAÇÃO E UTILITÁRIOS ======================
// =========================================================================

function buscarProduto() {
  const termo = document.getElementById("search-input").value.toLowerCase();
  const produtosFiltrados = todosOsProdutos.filter((produto) =>
    produto.title.toLowerCase().includes(termo),
  );
  renderizarProdutos(produtosFiltrados, "productListContainer");
}

function ordenarProdutos() {
  // 1. Pega o termo de busca atual. Se estiver vazio, a busca não está ativa.
  const termoBusca = document
    .getElementById("search-input")
    .value.toLowerCase();
  const sortValue = document.getElementById("sort-by").value;

  // 2. Decide qual lista de produtos usar: a completa ou a filtrada pela busca.
  let produtosParaOrdenar = todosOsProdutos;
  if (termoBusca) {
    produtosParaOrdenar = todosOsProdutos.filter((produto) =>
      produto.title.toLowerCase().includes(termoBusca),
    );
  }

  switch (sortValue) {
    case "menor-preco":
      produtosParaOrdenar.sort((a, b) => a.price - b.price);
      break;
    case "maior-preco":
      produtosParaOrdenar.sort((a, b) => b.price - a.price);
      break;
    case "popularidade":
    default:
      // Para popularidade, apenas usamos a lista (já filtrada ou não) sem ordenação extra.
      break;
  }
  // 3. Renderiza a lista (agora ordenada corretamente).
  renderizarProdutos(produtosParaOrdenar, "productListContainer");
}

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  localStorage.setItem("total", total);
}

//voltar ao topo
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function toggleCarrinho() {
  document.getElementById("carrinho-sidebar").classList.toggle("open");
  document.getElementById("carrinho-overlay").classList.toggle("open");
}

// =========================================================================
// =================== MODAIS (PRODUTO E AUTENTICAÇÃO) =====================
// =========================================================================

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
    adicionarAoCarrinho(produto.title, produto.price, produto.image);
    fecharModalProduto();
  });

  modalProduto.style.display = "flex";
}

function fecharModalProduto() {
  document.getElementById("modal-produto").style.display = "none";
}

function openAuthModal() {
  const authModal = document.getElementById("auth-modal");
  const authErrorMessage = document.getElementById("auth-error-message");
  authModal.style.display = "flex";
  authErrorMessage.innerText = "";
  updateAuthUI(firebase.auth().currentUser);
}

function closeAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
}

function updateAuthUI(user) {
  const btnOpenAuthModal = document.getElementById("btn-open-auth-modal");
  const authFormContainer = document.getElementById("auth-form-container");
  const userInfoContainer = document.getElementById("user-info-container");
  const userEmailSpan = document.getElementById("user-email");

  if (user) {
    btnOpenAuthModal.innerHTML = `<i class="fas fa-user"></i> ${
      user.email.split("@")[0]
    }`;
    authFormContainer.style.display = "none";
    userInfoContainer.style.display = "block";
    userEmailSpan.innerText = user.email;
  } else {
    btnOpenAuthModal.innerHTML = '<i class="fas fa-user"></i> Minha Conta';
    authFormContainer.style.display = "block";
    userInfoContainer.style.display = "none";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
  }
}

async function handleLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const authErrorMessage = document.getElementById("auth-error-message");
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    closeAuthModal();
  } catch (error) {
    authErrorMessage.innerText = `E-mail ou senha incorretos. Tente novamente.`;
    console.error("Erro ao fazer login:", error);
  }
}

async function handleLogout() {
  const authErrorMessage = document.getElementById("auth-error-message");
  try {
    await firebase.auth().signOut();
    closeAuthModal();
  } catch (error) {
    authErrorMessage.innerText = `Erro ao sair: ${error.message}`;
    console.error("Erro ao sair:", error);
  }
}

function mostrarKitsPresentes() {
  const kitsPresentes = document.getElementById("kits-presentes");
  Swal.fire({
    title: "Kits Presentes",
    icon: "info",
    html: `
            <p style="margin-bottom: 10px;">Kits Presentes são kits de beleza que você pode usar para fazer seu perfil.</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Destaque:</strong> Kits Presentes são kits de beleza que você pode usar para fazer seu perfil.<br>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Ver Kits Presentes",
    cancelButtonText: "Fechar",
    confirmButtonColor: "#9C34A9", // Cor roxa/lilás
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "#promocoes"; // Exemplo de destino
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const kitsPresentesBtn = document.getElementById("kits-presentes");
  if (kitsPresentesBtn) {
    kitsPresentesBtn.addEventListener("click", mostrarKitsPresentes);
  }
});

// =========================================================================
// =================== LÓGICA DO CARROSSEL E NOVIDADES =====================
// =========================================================================

// --- Lógica do Carrossel (Reutilizável) ---
function inicializarCarrossel(carouselId) {
  const container = document.getElementById(carouselId);
  if (!container) return;

  // CORREÇÃO: Os botões e pontos agora são buscados a partir do 'container' principal, não do 'track'.
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
  const novidadesContainer = document.getElementById(
    "novidadesProductListContainer",
  );

  // Busca produtos marcados como "novidades" no Firestore
  db.collection("products")
    .where("novidades", "==", true)
    .get()
    .then((querySnapshot) => {
      // Renderiza os produtos encontrados no container correto
      const produtosNovidades = [];
      querySnapshot.forEach((doc) =>
        produtosNovidades.push({ id: doc.id, ...doc.data() }),
      );
      renderizarProdutos(produtosNovidades, "novidadesProductListContainer");
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos:", error);
      if (novidadesContainer)
        novidadesContainer.innerHTML =
          "<p>Erro ao carregar as Novidades Tente novamente mais tarde.</p>";
    });
}

// =========================================================================
// =================== LÓGICA DAS MARCAS (MODAIS) ==========================
// =========================================================================

// Exemplo 1: EUDORA
function showEudoraDetails() {
  Swal.fire({
    title: "Super Poderes - Sua Beleza, Seu Poder ✨",
    icon: "info",
    html: `
            <p style="margin-bottom: 10px;">A marca Super Poderes é brasileira e faz cosmeticos acessiveis a todos.</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Destaque:</strong> Hidratantes, Corretivos e outros. <br>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Ver Linha Super Poderes",
    cancelButtonText: "Fechar",
    confirmButtonColor: "#9C34A9", // Cor roxa/lilás
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "#promocoes"; // Exemplo de destino
    }
  });
}

// Exemplo 2: PRINCIPIA
function showPrincipiaDetails() {
  Swal.fire({
    title: "Max Love - Beleza Acessivel e Criativa 💄",
    icon: "question",
    html: `
            <p style="margin-bottom: 10px;">Maquiagem e Skincare com otima qualidade e preço justo, pensando na sua beleza</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Produto Essencial:</strong> SBase Liquida Matte Max.<br>
                <strong>Dica:</strong> Monte sua rotina básica (Limpeza + Sérum + Hidratante).
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Explorar Skincare",
    cancelButtonText: "Fechar",
    confirmButtonColor: "#1E90FF", // Cor azul (ciência/dermato)
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = ""; // Leva para a seção de Skincare
    }
  });
}

// Exemplo 3: BRUNA TAVARES (BT)
function showBTDetails() {
  Swal.fire({
    title: " Lua e Neve 🌜 ❅ ",
    icon: "success", // Usamos sucesso porque é uma marca muito querida
    html: `
            <p style="margin-bottom: 10px;">Marca que combina charme e leveza em cada produto.</p>
            <div style="text-align: left; margin-top: 15px;">
                <strong>Best-Seller:</strong> Iluminador Gelo Lunar e Batom Frost kiss.<br>
                <strong>Lançamento:</strong> Linha Neve Glow com hidratante e primers luminosos.<br>
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
});

// ===================
// ====== MAPS =======
// ===================
