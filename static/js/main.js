document.addEventListener('DOMContentLoaded', () => {
    // Estado do App
    let cardapio = [];
    let apiConfigurada = false;

    // Elementos da Interface
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const configHeader = document.getElementById('configHeader');
    const configBody = document.getElementById('configBody');
    const configChevron = document.getElementById('configChevron');
    const apiStatusBadge = document.getElementById('apiStatusBadge');
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    const togglePassword = document.getElementById('togglePassword');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const quantidadeInput = document.getElementById('quantidade');
    
    const repMinus = document.getElementById('repMinus');
    const repPlus = document.getElementById('repPlus');
    const maxRepeticoesInput = document.getElementById('maxRepeticoes');

    const valorMaximoInput = document.getElementById('valorMaximo');
    const objetivoSelect = document.getElementById('objetivo');
    const customObjetivoGroup = document.getElementById('customObjetivoGroup');
    const customObjetivoInput = document.getElementById('customObjetivo');
    const exclusoesInput = document.getElementById('exclusoes');
    const preferenciasInput = document.getElementById('preferencias');
    const criteriaForm = document.getElementById('criteriaForm');
    const btnGerarSugestao = document.getElementById('btnGerarSugestao');

    const sourceBadge = document.getElementById('sourceBadge');
    const menuSearch = document.getElementById('menuSearch');
    const menuLoadingState = document.getElementById('menuLoadingState');
    const menuErrorState = document.getElementById('menuErrorState');
    const menuErrorMessage = document.getElementById('menuErrorMessage');
    const menuStats = document.getElementById('menuStats');
    const menuTotalCount = document.getElementById('menuTotalCount');
    const menuList = document.getElementById('menuList');
    const btnRetryLoadMenu = document.getElementById('btnRetryLoadMenu');

    const resultSection = document.getElementById('resultSection');
    const justificativaNutricional = document.getElementById('justificativaNutricional');
    const selectedItemsBody = document.getElementById('selectedItemsBody');
    const comboTotalValue = document.getElementById('comboTotalValue');
    const whatsappMessage = document.getElementById('whatsappMessage');
    const btnCopyMessage = document.getElementById('btnCopyMessage');
    const btnSendWhatsapp = document.getElementById('btnSendWhatsapp');
    const copyTooltip = document.getElementById('copyTooltip');

    // 1. Controle do Tema (Claro/Escuro)
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Restaurar Tema Salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }

    // 2. Expandir/Colapsar Configurações de API
    configHeader.addEventListener('click', () => {
        configBody.classList.toggle('collapsed');
        configChevron.classList.toggle('open');
    });

    // Visualizar Senha / API Key
    togglePassword.addEventListener('click', () => {
        const type = geminiApiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        geminiApiKeyInput.setAttribute('type', type);
        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Gerenciar API Key no LocalStorage
    const carregarApiKey = () => {
        const key = localStorage.getItem('gemini_api_key');
        if (key) {
            geminiApiKeyInput.value = key;
            atualizarBadgeStatusApi(true);
            apiConfigurada = true;
        } else {
            atualizarBadgeStatusApi(false);
            apiConfigurada = false;
            // Abre o painel de configurações se não tiver chave
            configBody.classList.remove('collapsed');
            configChevron.classList.add('open');
        }
    };

    const atualizarBadgeStatusApi = (configurada) => {
        const dot = apiStatusBadge.querySelector('.status-dot');
        const text = apiStatusBadge.querySelector('.status-text');
        
        if (configurada) {
            dot.className = 'status-dot green';
            text.textContent = 'Configurada';
        } else {
            dot.className = 'status-dot red';
            text.textContent = 'Não configurada';
        }
    };

    btnSaveApiKey.addEventListener('click', () => {
        const key = geminiApiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('gemini_api_key', key);
            atualizarBadgeStatusApi(true);
            apiConfigurada = true;
            mostrarAlertaFlutuante('Chave API salva com sucesso!', 'sucesso');
            // Colapsa após salvar
            setTimeout(() => {
                configBody.classList.add('collapsed');
                configChevron.classList.remove('open');
            }, 500);
        } else {
            localStorage.removeItem('gemini_api_key');
            atualizarBadgeStatusApi(false);
            apiConfigurada = false;
            mostrarAlertaFlutuante('Chave removida.', 'info');
        }
    });

    // Gerenciar Critérios no LocalStorage
    const salvarCriterios = () => {
        const criterios = {
            quantidade: quantidadeInput.value,
            maxRepeticoes: maxRepeticoesInput.value,
            valorMaximo: valorMaximoInput.value,
            objetivo: objetivoSelect.value,
            customObjetivo: customObjetivoInput.value,
            exclusoes: exclusoesInput.value,
            preferencias: preferenciasInput.value
        };
        localStorage.setItem('marmitas_criterios', JSON.stringify(criterios));
    };

    const carregarCriterios = () => {
        try {
            const dataStr = localStorage.getItem('marmitas_criterios');
            if (dataStr) {
                const criterios = JSON.parse(dataStr);
                
                if (criterios.quantidade) quantidadeInput.value = criterios.quantidade;
                if (criterios.maxRepeticoes) maxRepeticoesInput.value = criterios.maxRepeticoes;
                if (criterios.valorMaximo) valorMaximoInput.value = criterios.valorMaximo;
                if (criterios.objetivo) {
                    objetivoSelect.value = criterios.objetivo;
                    if (criterios.objetivo === 'Outro') {
                        customObjetivoGroup.classList.remove('hidden');
                        customObjetivoInput.required = true;
                        if (criterios.customObjetivo) customObjetivoInput.value = criterios.customObjetivo;
                    }
                }
                if (criterios.exclusoes) exclusoesInput.value = criterios.exclusoes;
                if (criterios.preferencias) preferenciasInput.value = criterios.preferencias;
            }
        } catch (e) {
            console.error("Erro ao carregar critérios salvos:", e);
        }
    };

    // 3. Controle da Quantidade de Marmitas (+ / -)
    qtyMinus.addEventListener('click', () => {
        let val = parseInt(quantidadeInput.value) || 20;
        if (val > 20) {
            quantidadeInput.value = val - 1;
            salvarCriterios();
        }
    });

    qtyPlus.addEventListener('click', () => {
        let val = parseInt(quantidadeInput.value) || 20;
        if (val < 100) {
            quantidadeInput.value = val + 1;
            salvarCriterios();
        }
    });

    quantidadeInput.addEventListener('change', () => {
        let val = parseInt(quantidadeInput.value);
        if (isNaN(val) || val < 20) {
            quantidadeInput.value = 20;
        } else if (val > 100) {
            quantidadeInput.value = 100;
        }
        salvarCriterios();
    });

    // Controle da Quantidade Máxima de Repetições por Marmita (+ / -)
    repMinus.addEventListener('click', () => {
        let val = parseInt(maxRepeticoesInput.value) || 3;
        if (val > 1) {
            maxRepeticoesInput.value = val - 1;
            salvarCriterios();
        }
    });

    repPlus.addEventListener('click', () => {
        let val = parseInt(maxRepeticoesInput.value) || 3;
        if (val < 10) {
            maxRepeticoesInput.value = val + 1;
            salvarCriterios();
        }
    });

    maxRepeticoesInput.addEventListener('change', () => {
        let val = parseInt(maxRepeticoesInput.value);
        if (isNaN(val) || val < 1) {
            maxRepeticoesInput.value = 1;
        } else if (val > 10) {
            maxRepeticoesInput.value = 10;
        }
        salvarCriterios();
    });

    // Seletor de Objetivo (Exibe campo "Outro")
    objetivoSelect.addEventListener('change', () => {
        if (objetivoSelect.value === 'Outro') {
            customObjetivoGroup.classList.remove('hidden');
            customObjetivoInput.required = true;
            customObjetivoInput.focus();
        } else {
            customObjetivoGroup.classList.add('hidden');
            customObjetivoInput.required = false;
            customObjetivoInput.value = '';
        }
        salvarCriterios();
    });

    // Registra listeners nos campos de texto para salvar automaticamente
    [valorMaximoInput, customObjetivoInput, exclusoesInput, preferenciasInput].forEach(inputEl => {
        inputEl.addEventListener('input', salvarCriterios);
    });

    // 4. Carregar Cardápio da API do Flask
    const carregarCardapio = async () => {
        menuLoadingState.classList.remove('hidden');
        menuErrorState.classList.add('hidden');
        menuList.classList.add('hidden');
        menuStats.classList.add('hidden');
        
        sourceBadge.className = 'source-badge loading';
        sourceBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando';

        try {
            const response = await fetch('/api/cardapio');
            const data = await response.json();

            if (data.sucesso) {
                cardapio = data.marmitas;
                exibirCardapio(cardapio);
                
                // Atualizar o Badge de Origem
                sourceBadge.className = `source-badge ${data.origem}`;
                if (data.origem === 'site') {
                    sourceBadge.innerHTML = '<i class="fa-solid fa-earth-americas"></i> Site da Lulu';
                } else {
                    sourceBadge.innerHTML = '<i class="fa-solid fa-file-excel"></i> Planilha Local';
                }
                
                if (data.alerta) {
                    console.warn(data.alerta);
                    mostrarAlertaFlutuante("Usando dados locais da planilha Excel (erro de conexão com site).", "aviso");
                }
            } else {
                throw new Error(data.erro || 'Erro desconhecido');
            }
        } catch (error) {
            console.error(error);
            menuLoadingState.classList.add('hidden');
            menuErrorState.classList.remove('hidden');
            menuErrorMessage.textContent = `Falha ao carregar cardápio: ${error.message}`;
            sourceBadge.className = 'source-badge loading';
            sourceBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Erro';
        }
    };

    const exibirCardapio = (itens) => {
        menuLoadingState.classList.add('hidden');
        menuList.classList.remove('hidden');
        menuStats.classList.remove('hidden');

        menuTotalCount.textContent = `${itens.length} pratos encontrados`;
        menuList.innerHTML = '';

        if (itens.length === 0) {
            menuList.innerHTML = '<li class="loading-state"><p>Nenhum prato corresponde à pesquisa.</p></li>';
            return;
        }

        itens.forEach(item => {
            const li = document.createElement('li');
            li.className = 'menu-item';
            
            // Tenta achar se tem categorias comuns no nome do prato e cria uma tag
            let tagHtml = '';
            if (item.nome.includes('LINHA MAROMBA')) {
                tagHtml = '<span class="menu-tag-label tag-maromba">MAROMBA</span>';
            } else if (item.nome.includes('LINHA LOW CARB')) {
                tagHtml = '<span class="menu-tag-label tag-lowcarb">LOW CARB</span>';
            } else if (item.nome.includes('SELEÇÃO CAMPEÃ')) {
                tagHtml = '<span class="menu-tag-label tag-selecao">SELEÇÃO</span>';
            }

            // Montar tag de imagem ou placeholder
            let imgHtml = '';
            if (item.foto) {
                imgHtml = `
                    <div style="position: relative; flex-shrink: 0;">
                        <img src="${item.foto}" class="menu-item-img" alt="${item.nome}" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                        <div class="menu-item-img-placeholder hidden"><i class="fa-solid fa-bowl-food"></i></div>
                    </div>
                `;
            } else {
                imgHtml = `<div class="menu-item-img-placeholder"><i class="fa-solid fa-bowl-food"></i></div>`;
            }

            li.innerHTML = `
                <div class="menu-item-left-wrapper">
                    ${imgHtml}
                    <div class="menu-item-info">
                        <div class="menu-item-name">${item.nome}</div>
                        <div class="menu-item-desc">${item.descricao || 'Disponível no combo principal.'}</div>
                    </div>
                </div>
                <div class="menu-item-right-wrapper">
                    <div class="menu-item-price">R$ ${item.preco.toFixed(2)}</div>
                    ${tagHtml}
                </div>
            `;
            menuList.appendChild(li);
        });
    };

    // Filtro de Pesquisa no Cardápio
    menuSearch.addEventListener('input', () => {
        const query = menuSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const filtrados = cardapio.filter(item => {
            const nomeNormalizado = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const descNormalizado = (item.descricao || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return nomeNormalizado.includes(query) || descNormalizado.includes(query);
        });
        exibirCardapio(filtrados);
    });

    btnRetryLoadMenu.addEventListener('click', carregarCardapio);

    // 5. Enviar Dados ao Gemini e Obter Sugestão
    criteriaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            mostrarAlertaFlutuante('Por favor, configure sua chave da API do Gemini antes de gerar a sugestão!', 'erro');
            configBody.classList.remove('collapsed');
            configChevron.classList.add('open');
            geminiApiKeyInput.focus();
            return;
        }

        if (cardapio.length === 0) {
            mostrarAlertaFlutuante('Aguarde o cardápio ser carregado antes de fazer a solicitação.', 'aviso');
            return;
        }

        // Determinar objetivo nutricional final
        let objetivoFinal = objetivoSelect.value;
        if (objetivoFinal === 'Outro') {
            const textoObj = customObjetivoInput.value.trim();
            if (!textoObj) {
                mostrarAlertaFlutuante('Por favor, especifique o seu objetivo nutricional!', 'aviso');
                customObjetivoInput.focus();
                return;
            }
            objetivoFinal = textoObj;
        }

        const quantidade = parseInt(quantidadeInput.value);
        const maxRepeticoes = parseInt(maxRepeticoesInput.value) || 3;
        const valorMaximo = valorMaximoInput.value ? parseFloat(valorMaximoInput.value) : null;
        const exclusoes = exclusoesInput.value.trim();
        const preferencias = preferenciasInput.value.trim();

        // Alterar estado do botão para loading
        btnGerarSugestao.disabled = true;
        btnGerarSugestao.querySelector('.btn-text').classList.add('hidden');
        btnGerarSugestao.querySelector('.btn-loader').classList.remove('hidden');
        btnGerarSugestao.classList.remove('btn-pulse');
        
        // Ocultar resultados anteriores
        resultSection.classList.add('hidden');

        try {
            const response = await fetch('/api/gerar-sugestao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    marmitas: cardapio,
                    criterios: {
                        objetivo: objetivoFinal,
                        quantidade: quantidade,
                        max_repeticoes: maxRepeticoes,
                        valor_maximo: valorMaximo,
                        exclusoes: exclusoes,
                        preferencias: preferencias
                    }
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                renderizarResultados(data.dados);
                mostrarAlertaFlutuante('Marmitas escolhidas com sucesso pelo Gemini!', 'sucesso');
                
                // Rolagem suave até a seção de resultados
                setTimeout(() => {
                    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            } else {
                throw new Error(data.erro || 'Erro ao processar sugestão.');
            }
        } catch (error) {
            console.error(error);
            const msgErro = error.message;
            if (msgErro.includes('429') || msgErro.toLowerCase().includes('quota') || msgErro.toLowerCase().includes('rate limit')) {
                mostrarAlertaFlutuante('Limite de requisições do Gemini atingido (máx. 5 por minuto na chave gratuita). Aguarde 30 segundos e tente novamente!', 'aviso');
            } else {
                mostrarAlertaFlutuante(`Erro: ${msgErro}`, 'erro');
            }
        } finally {
            // Reverter estado do botão
            btnGerarSugestao.disabled = false;
            btnGerarSugestao.querySelector('.btn-text').classList.remove('hidden');
            btnGerarSugestao.querySelector('.btn-loader').classList.add('hidden');
            btnGerarSugestao.classList.add('btn-pulse');
        }
    });

    // 6. Renderizar os Resultados Recebidos do Gemini
    const renderizarResultados = (dados) => {
        // Justificativa
        justificativaNutricional.textContent = dados.justificativa_nutricional;

        // Tabela de Pratos
        selectedItemsBody.innerHTML = '';
        
        const itens = dados.itens_selecionados || [];
        itens.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="menu-item-name" style="font-size: 0.85rem">${item.nome}</div></td>
                <td class="text-center font-bold" style="color: var(--accent-primary); font-size: 0.95rem">${item.quantidade}x</td>
                <td class="text-right">R$ ${item.preco_unitario.toFixed(2)}</td>
                <td class="text-right font-bold">R$ ${item.subtotal.toFixed(2)}</td>
            `;
            selectedItemsBody.appendChild(tr);
        });

        // Valor Total
        const total = parseFloat(dados.valor_total) || 0;
        comboTotalValue.textContent = `R$ ${total.toFixed(2)}`;

        // Mensagem Pronta e Ações
        whatsappMessage.value = dados.mensagem_whatsapp;
        
        // Link do WhatsApp
        // Lulu WhatsApp API Link
        const msgEncodada = encodeURIComponent(dados.mensagem_whatsapp);
        btnSendWhatsapp.href = `https://api.whatsapp.com/send?text=${msgEncodada}`;

        // Exibir a seção
        resultSection.classList.remove('hidden');
    };

    // 7. Botão Copiar Mensagem
    btnCopyMessage.addEventListener('click', () => {
        const texto = whatsappMessage.value;
        if (!texto) return;

        navigator.clipboard.writeText(texto)
            .then(() => {
                // Efeito do botão
                btnCopyMessage.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
                btnCopyMessage.classList.remove('btn-secondary');
                btnCopyMessage.style.backgroundColor = 'var(--status-green)';
                btnCopyMessage.style.color = 'white';

                // Mostrar Tooltip
                copyTooltip.classList.add('show');

                setTimeout(() => {
                    // Reverter botão
                    btnCopyMessage.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar Mensagem';
                    btnCopyMessage.className = 'btn btn-secondary btn-full';
                    btnCopyMessage.style = '';
                    
                    // Ocultar Tooltip
                    copyTooltip.classList.remove('show');
                }, 2000);
            })
            .catch(err => {
                console.error('Erro ao copiar texto: ', err);
                mostrarAlertaFlutuante('Não foi possível copiar automaticamente.', 'erro');
            });
    });

    // Utilitário: Alerta Flutuante na Tela
    const mostrarAlertaFlutuante = (mensagem, tipo = 'info') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-popup ${tipo}`;
        
        let icon = 'info-circle';
        if (tipo === 'sucesso') icon = 'circle-check';
        if (tipo === 'aviso') icon = 'triangle-exclamation';
        if (tipo === 'erro') icon = 'circle-exclamation';
        
        alertDiv.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${mensagem}</span>`;
        document.body.appendChild(alertDiv);

        // Animação de Entrada
        setTimeout(() => alertDiv.classList.add('visible'), 50);

        // Animação de Saída
        setTimeout(() => {
            alertDiv.classList.remove('visible');
            setTimeout(() => alertDiv.remove(), 300);
        }, 4000);
    };

    // Adicionar CSS para o alerta flutuante de forma dinâmica se não estiver no CSS
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .alert-popup {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background-color: var(--bg-secondary);
            border: 1px solid var(--panel-border);
            padding: 1rem 1.5rem;
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.8rem;
            z-index: 9999;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            font-size: 0.9rem;
            font-weight: 500;
            transform: translateY(50px);
            opacity: 0;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
            max-width: 400px;
            pointer-events: none;
        }
        .alert-popup.visible {
            transform: translateY(0);
            opacity: 1;
        }
        .alert-popup.sucesso { border-left: 4px solid var(--status-green); }
        .alert-popup.sucesso i { color: var(--status-green); }
        .alert-popup.erro { border-left: 4px solid var(--status-red); }
        .alert-popup.erro i { color: var(--status-red); }
        .alert-popup.aviso { border-left: 4px solid hsl(35, 85%, 55%); }
        .alert-popup.aviso i { color: hsl(35, 85%, 55%); }
        .alert-popup.info { border-left: 4px solid var(--status-blue); }
        .alert-popup.info i { color: var(--status-blue); }
    `;
    document.head.appendChild(styleSheet);

    // Inicialização
    carregarApiKey();
    carregarCriterios();
    carregarCardapio();
});
