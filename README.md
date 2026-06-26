# QueroPedirMarmitas 🍽️

Um assistente web local e inteligente projetado para automatizar e otimizar o pedido de combos de refeições saudáveis. O sistema lê as marmitas disponíveis em tempo real diretamente do cardápio do site de delivery, aplica seus critérios nutricionais/financeiros personalizados e utiliza a **API do Gemini (Google AI)** para escolher a melhor combinação de pratos, gerando uma mensagem perfeitamente formatada pronta para enviar ao WhatsApp de atendimento.

---

## ✨ Recursos

- **Raspagem em Tempo Real (Web Scraping)**: Conecta-se diretamente ao site de delivery para obter os pratos atuais, ingredientes e preços em milissegundos, sem a lentidão de navegadores headless.
- **Seleção Dinâmica de Combo**: Busca automaticamente no site os combos disponíveis, exibe o preço "A partir de R$..." de cada um e ajusta cardápio, quantidade mínima e automação do carrinho.
- **Mecanismo de Resiliência (Excel Fallback)**: Caso o site mude de estrutura ou esteja fora do ar, o sistema lê os pratos automaticamente a partir do arquivo Excel local no diretório do projeto.
- **Persistência de Preferências**: Suas escolhas (objetivo, quantidade de marmitas, restrições e chave de API) ficam salvas de forma segura no navegador (*localStorage*), eliminando a necessidade de redigitá-las.
- **Escolha Inteligente Limitada**: Permite definir um limite máximo de repetições por prato (ex: no máximo 3 unidades de cada marmita) para garantir diversidade na sua alimentação semanal.
- **Escolha Local sem IA**: Monta uma sugestão no próprio navegador usando heurísticas por objetivo, preferências, exclusões, orçamento e limite de repetição, sem consumir tokens da API.
- **Saudação Dinâmica por Horário**: Ajusta a saudação automaticamente com base na hora do dia ("Bom dia!", "Boa tarde!" ou "Boa noite! Tudo bem?").
- **Geração e Cópia Simplificada**: Remove os preços do texto a ser enviado no WhatsApp (para que o atendimento confirme os valores oficialmente) e oferece atalhos para copiar e enviar a mensagem diretamente.
- **Montagem Assistida do Carrinho**: Gera um link para abrir o combo escolhido no site da Marmitas da Lulu com os itens selecionados e, com o userscript instalado, montar o carrinho para revisão manual.
- **Interface Premium**: Design moderno com suporte a temas Escuro/Claro, efeitos de vidro translúcido (*glassmorphism*) e fotos reais das marmitas integradas ao cardápio com fallback robusto.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3, Flask, Requests, OpenPyXL (Leitura de Excel).
- **IA**: Google Gemini API (modelo `gemini-2.5-flash` via biblioteca oficial `google-generativeai`).
- **Frontend**: HTML5, CSS3 nativo (variáveis CSS modernas, flexbox, grid, glassmorphism), Vanilla JavaScript.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
Certifique-se de ter o **Python 3** instalado na sua máquina.

### Passo a Passo

1. **Clone o repositório ou baixe os arquivos**:
   ```bash
   git clone https://github.com/taianrj/QueroPedirMarmitas.git
   cd QueroPedirMarmitas
   ```

2. **Instale as dependências necessárias**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Inicie o servidor local**:
   ```bash
   python app.py
   ```

4. **Acesse no seu navegador**:
   Abra o endereço **[http://localhost:5000](http://localhost:5000)**.

---

## 💻 Inicialização Automática no Windows (Servidor Ocioso)

Para não precisar abrir o terminal toda vez que quiser usar o sistema, configuramos scripts de automação para que o servidor inicie sozinho em segundo plano (de forma silenciosa) quando você ligar o computador:

1. Pressione as teclas **`Windows + R`** no teclado.
2. Digite **`shell:startup`** e clique em **OK** (isso abre a pasta do Windows que executa aplicativos no boot).
3. Copie o arquivo **`iniciar_oculto.vbs`** da pasta deste projeto e **cole (ou crie um atalho)** dentro dessa pasta de inicialização.

O servidor agora rodará de forma invisível. Você pode adicionar a página `http://localhost:5000` aos favoritos do seu navegador e acessá-la quando desejar.

---

## 🔐 Configuração da API Key
Para utilizar o sistema, você precisará de uma chave de API do Gemini, que pode ser obtida gratuitamente no **[Google AI Studio](https://aistudio.google.com/)**.
A chave é salva localmente e de forma segura apenas no armazenamento interno do seu próprio navegador (*localStorage*).

---

## 🛒 Montagem do Carrinho no Site

O botão **Guia da Automacao do Carrinho** abre uma página local com instruções e o conteúdo do arquivo `static/js/lulu-cart.user.js`, que deve ser instalado em uma extensão de userscript como Tampermonkey ou Violentmonkey.

O Chrome bloqueia a instalação direta de scripts a partir do `localhost`, então copie o script pela página de guia, crie um novo script no painel do Tampermonkey/Violentmonkey e cole o conteúdo lá.

Depois de gerar uma sugestão com a IA ou com **Escolher marmitas sem IA**, use **Montar Carrinho no Site**. O app abre a página do combo com um payload curto na URL; o userscript roda dentro do site da Marmitas da Lulu, adiciona as opções ao carrinho da PrefiroDelivery e leva você para revisar o pedido. Ele não finaliza compra, não envia pedido e não preenche pagamento automaticamente.
