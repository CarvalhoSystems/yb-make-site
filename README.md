# 💄 YB MAKE's Cosméticos

> E-commerce profissional de maquiagem e skincare, com design moderno, carrinho de compras, integração com Firebase e sistema de pagamento PIX.

![YB MAKE's](https://img.shields.io/badge/Status-Em%20Desenvolvimento-green)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)

---

## 📋 Sobre o Projeto

YB MAKE's Cosméticos é uma loja virtual completa para venda de produtos de beleza, maquiagem e skincare. Desenvolvido com foco em performance, experiência do usuário e design feminino elegante.

### ✨ Funcionalidades Principais

- ✅ Catálogo de produtos organizado por categorias
- ✅ Carrinho de compras lateral dinâmico
- ✅ Sistema de autenticação de usuários (Login/Cadastro)
- ✅ Integração com Firebase Authentication e Firestore
- ✅ Finalização de compra com PIX e QR Code gerado automaticamente
- ✅ Busca de produtos em tempo real
- ✅ Filtros e ordenação por preço/popularidade
- ✅ Painel administrativo para gerenciamento de produtos
- ✅ Design 100% responsivo para mobile
- ✅ Animações e transições suaves
- ✅ Seção de marcas parceiras
- ✅ Depoimentos de clientes
- ✅ Integração com Google Maps
- ✅ Botão flutuante de WhatsApp
- ✅ Sistema de avaliações e provas sociais

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia             | Função                                    |
| ---------------------- | ----------------------------------------- |
| **HTML5**              | Estrutura e marcação do site              |
| **CSS3**               | Estilização e layout responsivo           |
| **JavaScript Vanilla** | Toda a lógica do frontend                 |
| **Firebase**           | Autenticação, Banco de Dados e Hospedagem |
| **SweetAlert2**        | Alertas e modais bonitos                  |
| **Font Awesome**       | Ícones                                    |
| **QRCode.js**          | Geração automática de QR Code para PIX    |
| **Google Maps API**    | Mapa de localização                       |

---

## 📂 Estrutura do Projeto

```
Make-YB/
├── 📄 index.html                 # Página principal da loja
├── 📄 cadastro.html              # Página de cadastro de usuário
├── 📄 README.md                  # Este arquivo
├── 📁 src/
│   ├── 🎨 index.css              # Estilos principais
│   ├── ⚡ main.js                # Lógica principal da loja
│   ├── ⚡ cadastro.js            # Lógica de cadastro
│   ├── ⚡ firebase-config.js     # Configuração do Firebase
│   └── 🖼️  favicons e manifestos
├── 📁 admin/
│   ├── 📄 index.html             # Painel administrativo
│   ├── 🎨 adm.css                # Estilos do admin
│   └── ⚡ admin.js               # Lógica do painel administrativo
└── 📁 imagens/
    └── 🖼️  Todas as imagens dos produtos e logos
```

---

## 🚀 Como Executar o Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/CarvalhoSystems/Make-YB.git
cd Make-YB
```

### 2. Configurar o Firebase

Edite o arquivo `src/firebase-config.js` com suas credenciais do Firebase:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};
```

### 3. Abrir o projeto

Basta abrir o arquivo `index.html` no navegador ou utilizar um servidor local:

```bash
# Com Python
python -m http.server 8000

# Ou com Node.js (npx serve)
npx serve
```

Depois acesse: `http://localhost:8000`

---

## 🎯 Funcionalidades Futuras

- [ ] Integração com gateway de pagamento oficial
- [ ] Sistema de acompanhamento de pedidos
- [ ] Lista de desejos
- [ ] Cupons de desconto
- [ ] Avaliação de produtos por clientes
- [ ] Sistema de recomendações
- [ ] Notificações push
- [ ] Blog com dicas de beleza

---

## 👥 Equipe

Desenvolvido por **Carvalho Systems** para YB MAKE's Cosméticos.

---

## 📞 Contato

✅ Instagram: [@ybprincesinha_makecosmeticos](https://www.instagram.com/ybprincesinha_makecosmeticos)
✅ WhatsApp: +55 11 97182-2511

---

> 📅 Ano: 2026 | Todos os direitos reservados YB Make's Cosméticos
