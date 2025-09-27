document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const productList = document.querySelector('.product-list');

    db.collection("products").get().then((querySnapshot) => {
        productList.innerHTML = ''; // Limpa a mensagem "Carregando..."
        if (querySnapshot.empty) {
            productList.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            console.log("Dados do produto do Firebase:", produto); // <-- Adicione esta linha
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

        // Após carregar os produtos, inicializa os eventos
        inicializarEventosProdutos();
        inicializarEventosCarrinho();

    }).catch((error) => {
        console.error("Erro ao buscar produtos: ", error);
        productList.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    });
});

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

        // Carrinho
        const carrinhoContainer = document.querySelector('.produtos-carrinho');
        const totalCarrinho = document.querySelector('.total');

        let carrinho = [];
        let total = 0;

        function atualizarCarrinho() {
            carrinhoContainer.innerHTML = '';
            carrinho.forEach((item, index) => {
                const itemCarrinhoDiv = document.createElement('div');
                itemCarrinhoDiv.classList.add('carrinho-item');
                itemCarrinhoDiv.innerHTML = `
                    <span>${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    <button class="btn-remover" data-index="${index}" title="Remover Item">❌</button>
                `;
                carrinhoContainer.appendChild(itemCarrinhoDiv);
            });
            totalCarrinho.innerText = `Total: R$ ${total.toFixed(2)}`;

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

            atualizarCarrinho(); // Atualiza a exibição do carrinho
        }

        // Mostrar PIX
        function mostrarPix() {
            if(carrinho.length === 0){
                alert('O carrinho está vazio!');
                return;
            }
            document.getElementById('total-pix').innerText = total.toFixed(2);
            document.getElementById('modal-pix').style.display = 'flex';
        }

        function fecharPix() {
            document.getElementById('modal-pix').style.display = 'none';
        }
        function limparCarrinho() {
            carrinho = [];
            total = 0;
            atualizarCarrinho();
        }

        // --- Lógica para o Modal de Detalhes do Produto ---

        const modalProduto = document.getElementById('modal-produto');
        const fecharModalBtn = document.querySelector('.fechar-modal-produto');

        // Função para abrir o modal com os detalhes do produto
        function abrirModalProduto(produtoCard) {
            // Coleta as informações do card do produto
            const nome = produtoCard.querySelector('h2')?.innerText || 'Nome Indisponível';
            const precoTexto = produtoCard.querySelector('p')?.innerText || 'R$ 0,00';
            // A descrição é o segundo <p> dentro do .content. Se não existir, usa um fallback.
            const descricaoElement = produtoCard.querySelectorAll('p')[1];
            const descricao = descricaoElement ? descricaoElement.innerText : 'Descrição Indisponível';
            const img = produtoCard.querySelector('img')?.src || '';

            // --- Para depuração: Verifique o console do navegador ---
            console.log("Dados extraídos para o modal:");
            console.log("Nome:", nome);
            console.log("Preço Texto:", precoTexto);
            console.log("Descrição:", descricao);
            console.log("Imagem SRC:", img);
            // -------------------------------------------------------

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
            modalProduto.style.display = 'none';
        }

        // Evento para fechar o modal clicando no 'X'
        fecharModalBtn.addEventListener('click', fecharModalProduto);

        // Evento para fechar o modal clicando fora dele
        window.addEventListener('click', (evento) => {
            if (evento.target == modalProduto) {
                fecharModalProduto();
            }
        });