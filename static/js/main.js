document.addEventListener('DOMContentLoaded', () => {
    // Estado do App
    let cardapio = [];
    let apiConfigurada = false;
    let ultimoPayloadCarrinho = null;
    let comboAtual = null;

    // Elementos da Interface
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const configHeader = document.getElementById('configHeader');
    const configBody = document.getElementById('configBody');
    const configChevron = document.getElementById('configChevron');
    const apiStatusBadge = document.getElementById('apiStatusBadge');
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    const togglePassword = document.getElementById('togglePassword');
    const githubTokenInput = document.getElementById('githubToken');
    const gistIdInput = document.getElementById('gistId');
    const syncPassphraseInput = document.getElementById('syncPassphrase');
    const toggleGithubToken = document.getElementById('toggleGithubToken');
    const toggleSyncPassphrase = document.getElementById('toggleSyncPassphrase');
    const btnSaveCloudSync = document.getElementById('btnSaveCloudSync');
    const btnCloudBackup = document.getElementById('btnCloudBackup');
    const btnCloudRestore = document.getElementById('btnCloudRestore');
    const btnForgetCloudSync = document.getElementById('btnForgetCloudSync');
    const cloudSyncStatus = document.getElementById('cloudSyncStatus');
    const cloudLastSync = document.getElementById('cloudLastSync');
    const comboSelect = document.getElementById('comboSelect');
    const comboHelp = document.getElementById('comboHelp');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const quantidadeInput = document.getElementById('quantidade');
    const quantidadeHelp = document.getElementById('quantidadeHelp');
    
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
    const btnGerarSugestaoLocal = document.getElementById('btnGerarSugestaoLocal');
    const criteriaPanel = document.querySelector('.criteria-panel');
    const menuPanel = document.querySelector('.menu-panel');

    const sourceBadge = document.getElementById('sourceBadge');
    const menuSearch = document.getElementById('menuSearch');
    const menuLoadingState = document.getElementById('menuLoadingState');
    const menuErrorState = document.getElementById('menuErrorState');
    const menuErrorMessage = document.getElementById('menuErrorMessage');
    const menuStats = document.getElementById('menuStats');
    const menuTotalCount = document.getElementById('menuTotalCount');
    const menuList = document.getElementById('menuList');
    const btnRetryLoadMenu = document.getElementById('btnRetryLoadMenu');
    const photoModal = document.getElementById('photoModal');
    const photoModalBackdrop = document.getElementById('photoModalBackdrop');
    const photoModalClose = document.getElementById('photoModalClose');
    const photoModalImg = document.getElementById('photoModalImg');
    const photoModalTitle = document.getElementById('photoModalTitle');

    const resultSection = document.getElementById('resultSection');
    const justificativaNutricional = document.getElementById('justificativaNutricional');
    const selectedItemsBody = document.getElementById('selectedItemsBody');
    const comboTotalValue = document.getElementById('comboTotalValue');
    const whatsappMessage = document.getElementById('whatsappMessage');
    const btnCopyMessage = document.getElementById('btnCopyMessage');
    const btnSendWhatsapp = document.getElementById('btnSendWhatsapp');
    const btnOpenCartAutomation = document.getElementById('btnOpenCartAutomation');
    const copyTooltip = document.getElementById('copyTooltip');
    let ultimoFocoAntesDaFoto = null;

    const CLOUD_STORAGE_KEYS = {
        token: 'qpm_github_gist_token',
        gistId: 'qpm_github_gist_id',
        lastSync: 'qpm_github_gist_last_sync'
    };
    const CLOUD_BACKUP_FILE = 'quero-pedir-marmitas.backup.enc.json';
    const CLOUD_BACKUP_KEYS = ['theme', 'gemini_api_key', 'marmitas_criterios'];
    const CLOUD_CRYPTO_ITERATIONS = 250000;

    const alternarVisibilidadeCampo = (input, button) => {
        if (!input || !button) return;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    };

    const aplicarTemaSalvo = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
    };

    const sincronizarAlturaCardapio = () => {
        if (!criteriaPanel || !menuPanel) return;

        const layoutDuasColunas = window.matchMedia('(min-width: 969px)').matches;
        if (!layoutDuasColunas) {
            menuPanel.style.height = '';
            menuPanel.style.maxHeight = '';
            return;
        }

        window.requestAnimationFrame(() => {
            const alturaCriterios = Math.ceil(criteriaPanel.getBoundingClientRect().height);
            if (alturaCriterios > 0) {
                menuPanel.style.height = `${alturaCriterios}px`;
                menuPanel.style.maxHeight = `${alturaCriterios}px`;
            }
        });
    };

    if (criteriaPanel && menuPanel) {
        if ('ResizeObserver' in window) {
            const criteriaResizeObserver = new ResizeObserver(sincronizarAlturaCardapio);
            criteriaResizeObserver.observe(criteriaPanel);
        }
        window.addEventListener('resize', sincronizarAlturaCardapio);
    }

    // 1. Controle do Tema (Claro/Escuro)
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Restaurar Tema Salvo
    aplicarTemaSalvo();

    // 2. Expandir/Colapsar Configurações Avançadas
    configHeader.addEventListener('click', () => {
        configBody.classList.toggle('collapsed');
        configChevron.classList.toggle('open');
    });

    // Visualizar Senha / API Key
    togglePassword.addEventListener('click', () => {
        alternarVisibilidadeCampo(geminiApiKeyInput, togglePassword);
    });

    if (toggleGithubToken) {
        toggleGithubToken.addEventListener('click', () => {
            alternarVisibilidadeCampo(githubTokenInput, toggleGithubToken);
        });
    }

    if (toggleSyncPassphrase) {
        toggleSyncPassphrase.addEventListener('click', () => {
            alternarVisibilidadeCampo(syncPassphraseInput, toggleSyncPassphrase);
        });
    }

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
            text.textContent = 'IA configurada';
        } else {
            dot.className = 'status-dot red';
            text.textContent = 'IA pendente';
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

    const atualizarCloudSyncStatus = () => {
        if (!cloudSyncStatus) return;

        const tokenSalvo = localStorage.getItem(CLOUD_STORAGE_KEYS.token);
        const gistIdSalvo = localStorage.getItem(CLOUD_STORAGE_KEYS.gistId);
        const lastSync = localStorage.getItem(CLOUD_STORAGE_KEYS.lastSync);

        if (tokenSalvo && gistIdSalvo) {
            cloudSyncStatus.textContent = 'Configurado';
            cloudSyncStatus.classList.add('configured');
        } else if (tokenSalvo) {
            cloudSyncStatus.textContent = 'Token salvo';
            cloudSyncStatus.classList.add('configured');
        } else {
            cloudSyncStatus.textContent = 'Não configurado';
            cloudSyncStatus.classList.remove('configured');
        }

        if (cloudLastSync) {
            cloudLastSync.textContent = lastSync
                ? `Última sincronização: ${new Date(lastSync).toLocaleString('pt-BR')}`
                : 'A senha não fica salva no navegador.';
        }
    };

    const carregarConfigCloudSync = () => {
        if (githubTokenInput) {
            githubTokenInput.value = localStorage.getItem(CLOUD_STORAGE_KEYS.token) || '';
        }
        if (gistIdInput) {
            gistIdInput.value = localStorage.getItem(CLOUD_STORAGE_KEYS.gistId) || '';
        }
        atualizarCloudSyncStatus();
    };

    const salvarConfigCloudSync = (mostrarFeedback = true) => {
        const token = githubTokenInput ? githubTokenInput.value.trim() : '';
        const gistId = gistIdInput ? gistIdInput.value.trim() : '';

        if (token) {
            localStorage.setItem(CLOUD_STORAGE_KEYS.token, token);
        } else {
            localStorage.removeItem(CLOUD_STORAGE_KEYS.token);
        }

        if (gistId) {
            localStorage.setItem(CLOUD_STORAGE_KEYS.gistId, gistId);
        } else {
            localStorage.removeItem(CLOUD_STORAGE_KEYS.gistId);
        }

        atualizarCloudSyncStatus();
        if (mostrarFeedback) {
            mostrarAlertaFlutuante('Acesso de sincronização salvo.', 'sucesso');
        }
    };

    const validarCamposCloudSync = ({ exigirGist = false } = {}) => {
        const token = githubTokenInput ? githubTokenInput.value.trim() : '';
        const gistId = gistIdInput ? gistIdInput.value.trim() : '';
        const passphrase = syncPassphraseInput ? syncPassphraseInput.value : '';

        if (!token) {
            throw new Error('Informe um token do GitHub com permissão gist.');
        }
        if (exigirGist && !gistId) {
            throw new Error('Informe o Gist ID ou salve um backup na nuvem primeiro.');
        }
        if (!passphrase || passphrase.length < 8) {
            throw new Error('Informe uma senha de criptografia com pelo menos 8 caracteres.');
        }

        return { token, gistId, passphrase };
    };

    const bytesToBase64 = (bytes) => {
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    };

    const base64ToBytes = (base64) => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    };

    const obterSubtleCrypto = () => {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Criptografia do navegador indisponível neste ambiente.');
        }
        return window.crypto.subtle;
    };

    const derivarChaveCloud = async (passphrase, salt, iterations) => {
        const subtle = obterSubtleCrypto();
        const material = await subtle.importKey(
            'raw',
            new TextEncoder().encode(passphrase),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations,
                hash: 'SHA-256'
            },
            material,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    };

    const montarDadosBackup = () => {
        const dados = {};
        CLOUD_BACKUP_KEYS.forEach(key => {
            dados[key] = localStorage.getItem(key);
        });

        return {
            app: 'QueroPedirMarmitas',
            schema: 1,
            created_at: new Date().toISOString(),
            origin: window.location.origin,
            data: dados
        };
    };

    const criptografarBackup = async (dados, passphrase) => {
        const subtle = obterSubtleCrypto();
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await derivarChaveCloud(passphrase, salt, CLOUD_CRYPTO_ITERATIONS);
        const plaintext = new TextEncoder().encode(JSON.stringify(dados));
        const ciphertext = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));

        return JSON.stringify({
            app: 'QueroPedirMarmitas',
            schema: 1,
            encryption: 'AES-GCM',
            kdf: 'PBKDF2-SHA-256',
            iterations: CLOUD_CRYPTO_ITERATIONS,
            salt: bytesToBase64(salt),
            iv: bytesToBase64(iv),
            ciphertext: bytesToBase64(ciphertext),
            updated_at: new Date().toISOString()
        }, null, 2);
    };

    const descriptografarBackup = async (conteudoCriptografado, passphrase) => {
        const subtle = obterSubtleCrypto();
        const envelope = JSON.parse(conteudoCriptografado);
        if (envelope.app !== 'QueroPedirMarmitas' || !envelope.ciphertext || !envelope.salt || !envelope.iv) {
            throw new Error('Backup criptografado inválido.');
        }

        const salt = base64ToBytes(envelope.salt);
        const iv = base64ToBytes(envelope.iv);
        const ciphertext = base64ToBytes(envelope.ciphertext);
        const key = await derivarChaveCloud(passphrase, salt, envelope.iterations || CLOUD_CRYPTO_ITERATIONS);
        const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return JSON.parse(new TextDecoder().decode(plaintext));
    };

    const githubHeaders = (token) => ({
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
    });

    const lerErroGithub = async (response) => {
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            return json.message || text;
        } catch (error) {
            return text || `HTTP ${response.status}`;
        }
    };

    const githubRequest = async (url, options) => {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(await lerErroGithub(response));
        }
        return response.json();
    };

    const localizarGistBackup = async (token) => {
        const gists = await githubRequest('https://api.github.com/gists?per_page=100', {
            method: 'GET',
            headers: githubHeaders(token)
        });
        const gist = gists.find(item => item.files && item.files[CLOUD_BACKUP_FILE]);
        return gist ? gist.id : null;
    };

    const salvarConteudoGist = async (token, gistId, conteudo) => {
        const body = {
            description: 'QueroPedirMarmitas - backup criptografado',
            files: {
                [CLOUD_BACKUP_FILE]: {
                    content: conteudo
                }
            }
        };

        if (gistId) {
            return githubRequest(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
                method: 'PATCH',
                headers: githubHeaders(token),
                body: JSON.stringify(body)
            });
        }

        return githubRequest('https://api.github.com/gists', {
            method: 'POST',
            headers: githubHeaders(token),
            body: JSON.stringify({
                ...body,
                public: false
            })
        });
    };

    const obterConteudoGist = async (token, gistId) => {
        const gist = await githubRequest(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
            method: 'GET',
            headers: githubHeaders(token)
        });
        const file = gist.files ? gist.files[CLOUD_BACKUP_FILE] : null;
        if (!file) {
            throw new Error('Arquivo de backup não encontrado neste Gist.');
        }
        if (file.content) {
            return file.content;
        }
        if (file.raw_url) {
            const response = await fetch(file.raw_url);
            if (!response.ok) {
                throw new Error('Não foi possível baixar o conteúdo bruto do Gist.');
            }
            return response.text();
        }
        throw new Error('Conteúdo do backup indisponível no Gist.');
    };

    const aplicarDadosBackup = (backup) => {
        if (!backup || backup.app !== 'QueroPedirMarmitas' || !backup.data) {
            throw new Error('Backup descriptografado inválido.');
        }

        CLOUD_BACKUP_KEYS.forEach(key => {
            const value = backup.data[key];
            if (value === null || value === undefined) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, String(value));
            }
        });

        aplicarTemaSalvo();
        carregarApiKey();
        carregarCriterios();
        aplicarComboSelecionado();
        carregarCardapio();
        sincronizarAlturaCardapio();
    };

    const setCloudButtonsLoading = (loading) => {
        [btnSaveCloudSync, btnCloudBackup, btnCloudRestore, btnForgetCloudSync].forEach(button => {
            if (button) button.disabled = loading;
        });
    };

    if (btnSaveCloudSync) {
        btnSaveCloudSync.addEventListener('click', () => {
            salvarConfigCloudSync();
        });
    }

    if (btnCloudBackup) {
        btnCloudBackup.addEventListener('click', async () => {
            try {
                setCloudButtonsLoading(true);
                const { token, passphrase } = validarCamposCloudSync();
                salvarConfigCloudSync(false);

                let gistId = gistIdInput ? gistIdInput.value.trim() : '';
                if (!gistId) {
                    gistId = await localizarGistBackup(token);
                }

                const conteudo = await criptografarBackup(montarDadosBackup(), passphrase);
                const gist = await salvarConteudoGist(token, gistId, conteudo);
                if (gist && gist.id) {
                    localStorage.setItem(CLOUD_STORAGE_KEYS.gistId, gist.id);
                    if (gistIdInput) gistIdInput.value = gist.id;
                }
                localStorage.setItem(CLOUD_STORAGE_KEYS.lastSync, new Date().toISOString());
                atualizarCloudSyncStatus();
                mostrarAlertaFlutuante('Backup criptografado salvo no Gist privado.', 'sucesso');
            } catch (error) {
                console.error(error);
                mostrarAlertaFlutuante(`Falha ao salvar na nuvem: ${error.message}`, 'erro');
            } finally {
                setCloudButtonsLoading(false);
            }
        });
    }

    if (btnCloudRestore) {
        btnCloudRestore.addEventListener('click', async () => {
            try {
                setCloudButtonsLoading(true);
                const { token, passphrase } = validarCamposCloudSync();
                salvarConfigCloudSync(false);

                let gistId = gistIdInput ? gistIdInput.value.trim() : '';
                if (!gistId) {
                    gistId = await localizarGistBackup(token);
                    if (!gistId) {
                        throw new Error('Nenhum Gist de backup foi encontrado na sua conta.');
                    }
                    localStorage.setItem(CLOUD_STORAGE_KEYS.gistId, gistId);
                    if (gistIdInput) gistIdInput.value = gistId;
                }

                if (!window.confirm('Restaurar o backup vai substituir as configurações locais atuais.')) {
                    return;
                }

                const conteudo = await obterConteudoGist(token, gistId);
                const backup = await descriptografarBackup(conteudo, passphrase);
                aplicarDadosBackup(backup);
                localStorage.setItem(CLOUD_STORAGE_KEYS.lastSync, new Date().toISOString());
                atualizarCloudSyncStatus();
                mostrarAlertaFlutuante('Configurações restauradas da nuvem.', 'sucesso');
            } catch (error) {
                console.error(error);
                mostrarAlertaFlutuante(`Falha ao restaurar: ${error.message}`, 'erro');
            } finally {
                setCloudButtonsLoading(false);
            }
        });
    }

    if (btnForgetCloudSync) {
        btnForgetCloudSync.addEventListener('click', () => {
            localStorage.removeItem(CLOUD_STORAGE_KEYS.token);
            localStorage.removeItem(CLOUD_STORAGE_KEYS.gistId);
            localStorage.removeItem(CLOUD_STORAGE_KEYS.lastSync);
            if (githubTokenInput) githubTokenInput.value = '';
            if (gistIdInput) gistIdInput.value = '';
            if (syncPassphraseInput) syncPassphraseInput.value = '';
            atualizarCloudSyncStatus();
            mostrarAlertaFlutuante('Acesso de sincronização removido deste navegador.', 'info');
        });
    }

    // Gerenciar Critérios no LocalStorage
    const montarTextoOptionCombo = (combo) => {
        const rotulo = combo.rotulo || combo.nome || `Combo ${combo.id}`;
        return combo.preco_a_partir_texto ? `${rotulo} - ${combo.preco_a_partir_texto}` : rotulo;
    };

    const atualizarOptionCombo = (combo) => {
        if (!comboSelect || !combo || combo.id === undefined || combo.id === null) return;

        const option = comboSelect.querySelector(`option[value="${combo.id}"]`);
        if (!option) return;

        option.dataset.nome = combo.nome || option.dataset.nome || '';
        option.dataset.rotulo = combo.rotulo || option.dataset.rotulo || option.textContent.trim();
        option.dataset.url = combo.url || option.dataset.url || '';
        option.dataset.min = combo.min_quantidade || option.dataset.min || '20';
        option.dataset.default = combo.quantidade_padrao || combo.min_quantidade || option.dataset.default || option.dataset.min || '20';
        option.dataset.max = combo.max_quantidade || option.dataset.max || '100';
        option.dataset.precoAPartir = combo.preco_a_partir ?? option.dataset.precoAPartir ?? '';
        option.dataset.precoAPartirTexto = combo.preco_a_partir_texto || option.dataset.precoAPartirTexto || '';
        option.textContent = montarTextoOptionCombo({
            ...combo,
            rotulo: option.dataset.rotulo,
            preco_a_partir_texto: option.dataset.precoAPartirTexto
        });
    };

    const obterComboSelecionado = () => {
        const option = comboSelect ? comboSelect.selectedOptions[0] : null;
        if (!option) return null;

        const minQuantidade = parseInt(option.dataset.min, 10) || 20;
        const quantidadePadrao = parseInt(option.dataset.default, 10) || minQuantidade;
        const maxQuantidade = parseInt(option.dataset.max, 10) || 100;
        const precoAPartir = parseFloat(option.dataset.precoAPartir);

        return {
            id: parseInt(option.value, 10),
            nome: option.dataset.nome || option.textContent.trim(),
            rotulo: option.dataset.rotulo || option.textContent.trim(),
            url: option.dataset.url,
            min_quantidade: minQuantidade,
            quantidade_padrao: quantidadePadrao,
            max_quantidade: maxQuantidade,
            preco_a_partir: Number.isFinite(precoAPartir) ? precoAPartir : null,
            preco_a_partir_texto: option.dataset.precoAPartirTexto || ''
        };
    };

    const aplicarComboSelecionado = (opcoes = {}) => {
        comboAtual = obterComboSelecionado();
        if (!comboAtual) return;

        quantidadeInput.min = comboAtual.min_quantidade;
        quantidadeInput.max = comboAtual.max_quantidade;

        const valorAtual = parseInt(quantidadeInput.value, 10);
        if (opcoes.resetarQuantidade || isNaN(valorAtual) || valorAtual < comboAtual.min_quantidade || valorAtual > comboAtual.max_quantidade) {
            quantidadeInput.value = comboAtual.quantidade_padrao;
        }

        if (quantidadeHelp) {
            quantidadeHelp.textContent = `Mínimo de ${comboAtual.min_quantidade} marmitas para este combo.`;
        }

        if (comboHelp) {
            const precoTexto = comboAtual.preco_a_partir_texto ? ` ${comboAtual.preco_a_partir_texto}.` : '';
            comboHelp.textContent = `${comboAtual.rotulo}.${precoTexto} O cardápio e a automação do carrinho usarão este combo.`;
        }

        ultimoPayloadCarrinho = null;
        if (btnOpenCartAutomation) {
            btnOpenCartAutomation.href = '#';
            btnOpenCartAutomation.classList.add('is-disabled');
            btnOpenCartAutomation.setAttribute('aria-disabled', 'true');
            btnOpenCartAutomation.removeAttribute('target');
        }
    };

    const salvarCriterios = () => {
        const criterios = {
            comboId: comboSelect ? comboSelect.value : null,
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

                if (criterios.comboId && comboSelect && comboSelect.querySelector(`option[value="${criterios.comboId}"]`)) {
                    comboSelect.value = criterios.comboId;
                }
                aplicarComboSelecionado();

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
                aplicarComboSelecionado();
            }
        } catch (e) {
            console.error("Erro ao carregar critérios salvos:", e);
        }
    };

    if (comboSelect) {
        comboSelect.addEventListener('change', () => {
            aplicarComboSelecionado({ resetarQuantidade: true });
            salvarCriterios();
            resultSection.classList.add('hidden');
            menuSearch.value = '';
            carregarCardapio();
            sincronizarAlturaCardapio();
        });
    }

    // 3. Controle da Quantidade de Marmitas (+ / -)
    qtyMinus.addEventListener('click', () => {
        const minimo = comboAtual ? comboAtual.min_quantidade : (parseInt(quantidadeInput.min, 10) || 20);
        let val = parseInt(quantidadeInput.value) || minimo;
        if (val > minimo) {
            quantidadeInput.value = val - 1;
            salvarCriterios();
        }
    });

    qtyPlus.addEventListener('click', () => {
        const maximo = comboAtual ? comboAtual.max_quantidade : (parseInt(quantidadeInput.max, 10) || 100);
        let val = parseInt(quantidadeInput.value) || (comboAtual ? comboAtual.min_quantidade : 20);
        if (val < maximo) {
            quantidadeInput.value = val + 1;
            salvarCriterios();
        }
    });

    quantidadeInput.addEventListener('change', () => {
        const minimo = comboAtual ? comboAtual.min_quantidade : (parseInt(quantidadeInput.min, 10) || 20);
        const maximo = comboAtual ? comboAtual.max_quantidade : (parseInt(quantidadeInput.max, 10) || 100);
        let val = parseInt(quantidadeInput.value);
        if (isNaN(val) || val < minimo) {
            quantidadeInput.value = minimo;
        } else if (val > maximo) {
            quantidadeInput.value = maximo;
        }
        salvarCriterios();
        sincronizarAlturaCardapio();
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
        sincronizarAlturaCardapio();
    });

    // Registra listeners nos campos de texto para salvar automaticamente
    [valorMaximoInput, customObjetivoInput, exclusoesInput, preferenciasInput].forEach(inputEl => {
        inputEl.addEventListener('input', salvarCriterios);
    });

    // 4. Carregar Cardápio da API do Flask
    const carregarCardapio = async () => {
        aplicarComboSelecionado();
        menuLoadingState.classList.remove('hidden');
        menuErrorState.classList.add('hidden');
        menuList.classList.add('hidden');
        menuStats.classList.add('hidden');
        
        sourceBadge.className = 'source-badge loading';
        sourceBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando';

        try {
            const comboId = comboAtual ? comboAtual.id : (comboSelect ? comboSelect.value : 45);
            const response = await fetch(`/api/cardapio?combo_id=${encodeURIComponent(comboId)}`);
            const data = await response.json();

            if (data.sucesso) {
                if (data.combo) {
                    comboAtual = {
                        ...comboAtual,
                        ...data.combo
                    };
                    atualizarOptionCombo(comboAtual);
                    quantidadeInput.min = comboAtual.min_quantidade;
                    quantidadeInput.max = comboAtual.max_quantidade;
                    if (quantidadeHelp) {
                        quantidadeHelp.textContent = `Mínimo de ${comboAtual.min_quantidade} marmitas para este combo.`;
                    }
                    if (comboHelp) {
                        const precoTexto = comboAtual.preco_a_partir_texto ? ` ${comboAtual.preco_a_partir_texto}.` : '';
                        comboHelp.textContent = `${comboAtual.rotulo}.${precoTexto} O cardápio e a automação do carrinho usarão este combo.`;
                    }
                }
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

    const escaparHtml = (valor) => {
        return String(valor || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    };

    const obterEstoqueDisponivel = (item) => {
        const estoque = Number(item && item.quantidade_disponivel);
        return Number.isFinite(estoque) ? Math.max(0, Math.floor(estoque)) : null;
    };

    const obterLimiteItem = (item, maxRepeticoes) => {
        const estoque = obterEstoqueDisponivel(item);
        return estoque === null ? maxRepeticoes : Math.min(maxRepeticoes, estoque);
    };

    const abrirFotoModal = (src, nome) => {
        if (!photoModal || !photoModalImg || !photoModalTitle) return;

        ultimoFocoAntesDaFoto = document.activeElement;
        photoModalImg.src = src;
        photoModalImg.alt = nome;
        photoModalTitle.textContent = nome;
        photoModal.classList.remove('hidden');
        document.body.classList.add('body-modal-open');

        if (photoModalClose) {
            photoModalClose.focus();
        }
    };

    const fecharFotoModal = () => {
        if (!photoModal || !photoModalImg) return;

        photoModal.classList.add('hidden');
        photoModalImg.src = '';
        photoModalImg.alt = '';
        document.body.classList.remove('body-modal-open');

        if (ultimoFocoAntesDaFoto && typeof ultimoFocoAntesDaFoto.focus === 'function') {
            ultimoFocoAntesDaFoto.focus();
        }
    };

    if (photoModalClose) {
        photoModalClose.addEventListener('click', fecharFotoModal);
    }

    if (photoModalBackdrop) {
        photoModalBackdrop.addEventListener('click', fecharFotoModal);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && photoModal && !photoModal.classList.contains('hidden')) {
            fecharFotoModal();
        }
    });

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
            const nomeSeguro = escaparHtml(item.nome);
            const descricaoSegura = escaparHtml(item.descricao || 'Disponível no combo principal.');
            const fotoSegura = escaparHtml(item.foto);
            const estoque = obterEstoqueDisponivel(item);
            const estoqueTexto = estoque === null ? 'Estoque n/i' : `${estoque} disp.`;
            const estoqueTitulo = estoque === null ? 'Estoque não informado' : `${estoque} unidades disponíveis`;
            
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
                    <button type="button" class="menu-item-img-button" aria-label="Ver foto maior de ${nomeSeguro}">
                        <img src="${fotoSegura}" class="menu-item-img" alt="${nomeSeguro}" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden'); this.parentElement.disabled=true; this.parentElement.setAttribute('aria-label', 'Foto indisponivel')">
                        <div class="menu-item-img-placeholder hidden"><i class="fa-solid fa-bowl-food"></i></div>
                    </button>
                `;
            } else {
                imgHtml = `<div class="menu-item-img-placeholder"><i class="fa-solid fa-bowl-food"></i></div>`;
            }

            li.innerHTML = `
                <div class="menu-item-left-wrapper">
                    ${imgHtml}
                    <div class="menu-item-info">
                        <div class="menu-item-name">${nomeSeguro}</div>
                        <div class="menu-item-desc">${descricaoSegura}</div>
                    </div>
                </div>
                <div class="menu-item-right-wrapper">
                    <div class="menu-item-price">R$ ${item.preco.toFixed(2)}</div>
                    <div class="menu-item-stock" title="${escaparHtml(estoqueTitulo)}">
                        <i class="fa-solid fa-box-open"></i> ${escaparHtml(estoqueTexto)}
                    </div>
                    ${tagHtml}
                </div>
            `;

            const photoButton = li.querySelector('.menu-item-img-button');
            if (photoButton) {
                photoButton.addEventListener('click', () => abrirFotoModal(item.foto, item.nome));
            }

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
                        combo: comboAtual || obterComboSelecionado(),
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

    const normalizarTexto = (texto) => {
        return String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const obterSaudacao = () => {
        const hora = new Date().getHours();
        if (hora >= 5 && hora < 12) return 'Bom dia!';
        if (hora >= 12 && hora < 18) return 'Boa tarde!';
        return 'Boa noite!';
    };

    const obterObjetivoFinal = () => {
        let objetivoFinal = objetivoSelect.value;
        if (objetivoFinal === 'Outro') {
            const textoObj = customObjetivoInput.value.trim();
            if (!textoObj) {
                return {
                    sucesso: false,
                    erro: 'Por favor, especifique o seu objetivo nutricional!'
                };
            }
            objetivoFinal = textoObj;
        }

        return { sucesso: true, objetivo: objetivoFinal };
    };

    const extrairTermos = (texto) => {
        return String(texto || '')
            .split(/[,;\n]+/)
            .map(termo => normalizarTexto(termo).replace(/^(sem|evitar|evite|nao quero|não quero)\s+/i, '').trim())
            .filter(termo => termo.length >= 2);
    };

    const textoDoItem = (item) => normalizarTexto(`${item.nome || ''} ${item.descricao || ''}`);

    const contarTermosEncontrados = (texto, termos) => {
        return termos.reduce((total, termo) => total + (texto.includes(termo) ? 1 : 0), 0);
    };

    const categoriaHeuristica = (item) => {
        const texto = textoDoItem(item);
        if (texto.includes('low carb')) return 'lowcarb';
        if (texto.includes('maromba')) return 'maromba';
        if (texto.includes('selecao campea') || texto.includes('seleção campeã')) return 'selecao';
        if (texto.includes('vegetariano') || texto.includes('vegano')) return 'vegetariano';
        return 'geral';
    };

    const pontuarPorObjetivo = (item, objetivo) => {
        const texto = textoDoItem(item);
        const objetivoNormalizado = normalizarTexto(objetivo);
        let score = 50;

        const soma = (termos, peso) => {
            score += contarTermosEncontrados(texto, termos) * peso;
        };

        if (objetivoNormalizado.includes('low carb')) {
            soma(['low carb', 'abobrinha', 'berinjela', 'brocolis', 'brócolis', 'couve flor', 'couve-flor', 'legumes', 'frango', 'peixe', 'tilapia', 'tilápia', 'patinho', 'carne'], 7);
            soma(['arroz', 'batata', 'aipim', 'mandioca', 'massa', 'macarrao', 'macarrão', 'nhoque', 'feijao', 'feijão'], -7);
        } else if (objetivoNormalizado.includes('ganho') || objetivoNormalizado.includes('hipertrofia') || objetivoNormalizado.includes('massa')) {
            soma(['maromba', 'frango', 'patinho', 'carne', 'sobrecoxa', 'salmão', 'salmao', 'tilapia', 'tilápia', 'arroz integral', 'batata doce', 'aipim', 'feijao', 'feijão', 'nhoque'], 6);
            soma(['low carb', 'salada'], -3);
        } else if (objetivoNormalizado.includes('emagrecimento') || objetivoNormalizado.includes('definicao') || objetivoNormalizado.includes('definição') || objetivoNormalizado.includes('menos calorias')) {
            soma(['low carb', 'frango', 'peixe', 'tilapia', 'tilápia', 'patinho', 'legumes', 'abobrinha', 'berinjela', 'brocolis', 'brócolis', 'couve flor', 'couve-flor'], 6);
            soma(['massa', 'nhoque', 'batata', 'arroz branco', 'queijo', 'creme', 'feijoada', 'lasanha'], -5);
        } else if (objetivoNormalizado.includes('vegetariano') || objetivoNormalizado.includes('vegano')) {
            soma(['vegetariano', 'vegano', 'berinjela', 'abobrinha', 'legumes', 'brocolis', 'brócolis', 'couve flor', 'couve-flor'], 9);
        } else {
            soma(['frango', 'peixe', 'tilapia', 'tilápia', 'patinho', 'legumes', 'arroz integral', 'low carb', 'maromba', 'selecao campea', 'seleção campeã'], 3);
            soma(['doce', 'coxinha', 'caldo'], -2);
        }

        // Um leve incentivo para pratos mais baratos quando todos os outros sinais empatam.
        score -= Math.max(0, Number(item.preco || 0) - 28) * 0.12;
        return score;
    };

    const gerarSugestaoLocal = (criterios) => {
        const quantidade = criterios.quantidade;
        const maxRepeticoes = criterios.maxRepeticoes;
        const valorMaximo = criterios.valorMaximo;
        const termosExclusao = extrairTermos(criterios.exclusoes);
        const termosPreferencia = extrairTermos(criterios.preferencias);
        const objetivoNormalizado = normalizarTexto(criterios.objetivo);
        const carnes = ['carne', 'frango', 'peixe', 'tilapia', 'tilápia', 'salmao', 'salmão', 'camarao', 'camarão', 'patinho', 'sobrecoxa', 'bovina', 'boeuf', 'linguica', 'linguiça', 'bacon', 'atum'];

        let candidatos = cardapio
            .filter(item => item && item.nome)
            .filter(item => {
                const texto = textoDoItem(item);
                if (termosExclusao.some(termo => texto.includes(termo))) return false;
                if ((objetivoNormalizado.includes('vegetariano') || objetivoNormalizado.includes('vegano')) && carnes.some(termo => texto.includes(termo))) return false;
                return true;
            })
            .map(item => {
                const texto = textoDoItem(item);
                const scoreObjetivo = pontuarPorObjetivo(item, criterios.objetivo);
                const scorePreferencias = contarTermosEncontrados(texto, termosPreferencia) * 9;
                return {
                    ...item,
                    _score: scoreObjetivo + scorePreferencias,
                    _categoria: categoriaHeuristica(item)
                };
            })
            .sort((a, b) => {
                if (b._score !== a._score) return b._score - a._score;
                if ((a.preco || 0) !== (b.preco || 0)) return (a.preco || 0) - (b.preco || 0);
                return String(a.nome).localeCompare(String(b.nome));
            });

        if (candidatos.length === 0) {
            throw new Error('Nenhum prato ficou disponivel depois de aplicar exclusoes e objetivo.');
        }

        const capacidadeTotal = candidatos.reduce((soma, item) => soma + obterLimiteItem(item, maxRepeticoes), 0);
        if (capacidadeTotal < quantidade) {
            throw new Error(`Com os filtros atuais e o estoque disponivel, so da para montar ${capacidadeTotal} marmitas respeitando o maximo de repeticoes.`);
        }

        const escolhidos = [];
        const contagemPorId = new Map();
        const contagemPorCategoria = new Map();
        let valorTotal = 0;

        while (escolhidos.length < quantidade) {
            const disponiveis = candidatos.filter(item => (contagemPorId.get(String(item.id)) || 0) < obterLimiteItem(item, maxRepeticoes));
            const dentroDoOrcamento = valorMaximo
                ? disponiveis.filter(item => valorTotal + Number(item.preco || 0) <= valorMaximo)
                : disponiveis;
            const baseEscolha = dentroDoOrcamento.length > 0 ? dentroDoOrcamento : disponiveis;

            const melhor = baseEscolha
                .map(item => {
                    const id = String(item.id);
                    const repeticoes = contagemPorId.get(id) || 0;
                    const categoriaQtd = contagemPorCategoria.get(item._categoria) || 0;
                    const ajusteVariedade = repeticoes * 12 + categoriaQtd * 1.5;
                    const ajusteOrcamento = valorMaximo && valorTotal + Number(item.preco || 0) > valorMaximo ? 25 : 0;
                    return {
                        item,
                        scoreDinamico: item._score - ajusteVariedade - ajusteOrcamento
                    };
                })
                .sort((a, b) => {
                    if (b.scoreDinamico !== a.scoreDinamico) return b.scoreDinamico - a.scoreDinamico;
                    if ((a.item.preco || 0) !== (b.item.preco || 0)) return (a.item.preco || 0) - (b.item.preco || 0);
                    return String(a.item.nome).localeCompare(String(b.item.nome));
                })[0];

            if (!melhor) break;

            const item = melhor.item;
            const id = String(item.id);
            escolhidos.push(item);
            contagemPorId.set(id, (contagemPorId.get(id) || 0) + 1);
            contagemPorCategoria.set(item._categoria, (contagemPorCategoria.get(item._categoria) || 0) + 1);
            valorTotal += Number(item.preco || 0);
        }

        const agregados = [...contagemPorId.entries()].map(([id, qtd]) => {
            const item = candidatos.find(candidato => String(candidato.id) === id);
            const precoUnitario = Number(item.preco || 0);
            return {
                id: item.id,
                nome: item.nome,
                quantidade: qtd,
                preco_unitario: precoUnitario,
                subtotal: precoUnitario * qtd
            };
        }).sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome));

        const totalFinal = agregados.reduce((soma, item) => soma + item.subtotal, 0);
        const saudacao = obterSaudacao();
        const mensagemItens = agregados.map(item => `- ${item.quantidade}x ${item.nome}`).join('\n');
        const passouDoOrcamento = valorMaximo && totalFinal > valorMaximo;

        return {
            itens_selecionados: agregados,
            valor_total: totalFinal,
            justificativa_nutricional: `Selecao gerada localmente, sem chamada de IA. A heuristica priorizou o objetivo "${criterios.objetivo}", aplicou exclusoes e preferencias informadas, respeitou o limite de ${maxRepeticoes} repeticoes por prato, o estoque disponivel e distribuiu as escolhas para manter variedade.${passouDoOrcamento ? ' O valor ficou acima do limite aproximado porque nao havia combinacao suficiente dentro do orcamento com os filtros atuais.' : ''}`,
            mensagem_whatsapp: `${saudacao} Tudo bem?\n\nGostaria de fazer o pedido do meu combo de ${quantidade} marmitas:\n\n${mensagemItens}\n\nMuito obrigado!`
        };
    };

    if (btnGerarSugestaoLocal) {
        btnGerarSugestaoLocal.addEventListener('click', () => {
            if (cardapio.length === 0) {
                mostrarAlertaFlutuante('Aguarde o cardapio ser carregado antes de escolher sem IA.', 'aviso');
                return;
            }

            const objetivoResultado = obterObjetivoFinal();
            if (!objetivoResultado.sucesso) {
                mostrarAlertaFlutuante(objetivoResultado.erro, 'aviso');
                customObjetivoInput.focus();
                return;
            }

            const criterios = {
                combo: comboAtual || obterComboSelecionado(),
                objetivo: objetivoResultado.objetivo,
                quantidade: parseInt(quantidadeInput.value, 10) || (comboAtual ? comboAtual.quantidade_padrao : 20),
                maxRepeticoes: parseInt(maxRepeticoesInput.value, 10) || 3,
                valorMaximo: valorMaximoInput.value ? parseFloat(valorMaximoInput.value) : null,
                exclusoes: exclusoesInput.value.trim(),
                preferencias: preferenciasInput.value.trim()
            };

            try {
                resultSection.classList.add('hidden');
                const dados = gerarSugestaoLocal(criterios);
                renderizarResultados(dados);
                mostrarAlertaFlutuante('Marmitas escolhidas localmente, sem usar tokens da API.', 'sucesso');
                setTimeout(() => {
                    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            } catch (error) {
                console.error(error);
                mostrarAlertaFlutuante(error.message, 'erro');
            }
        });
    }

    const encontrarItemCardapio = (itemSugestao) => {
        const idSugestao = itemSugestao.id || itemSugestao.opcao_id || itemSugestao.composicao_opcao_id;
        if (idSugestao !== undefined && idSugestao !== null && idSugestao !== '') {
            const porId = cardapio.find(item => String(item.id) === String(idSugestao));
            if (porId) return porId;
        }

        const nomeSugestao = normalizarTexto(itemSugestao.nome);
        if (!nomeSugestao) return null;

        return cardapio.find(item => normalizarTexto(item.nome) === nomeSugestao)
            || cardapio.find(item => normalizarTexto(item.nome).includes(nomeSugestao))
            || cardapio.find(item => nomeSugestao.includes(normalizarTexto(item.nome)));
    };

    const encodeBase64Url = (value) => {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    };

    const montarPayloadCarrinho = (dados) => {
        const itensSelecionados = dados.itens_selecionados || [];
        const itens = [];
        const naoEncontrados = [];

        itensSelecionados.forEach(item => {
            const itemCardapio = encontrarItemCardapio(item);
            const quantidade = parseInt(item.quantidade, 10) || 0;

            if (!itemCardapio || itemCardapio.origem !== 'site' || !itemCardapio.id || quantidade <= 0) {
                naoEncontrados.push(item.nome || 'Item sem nome');
                return;
            }

            const estoque = obterEstoqueDisponivel(itemCardapio);
            if (estoque !== null && quantidade > estoque) {
                naoEncontrados.push(`${itemCardapio.nome} (estoque: ${estoque})`);
                return;
            }

            itens.push({
                id: itemCardapio.id,
                q: quantidade,
                nome: itemCardapio.nome
            });
        });

        return {
            combo_id: comboAtual ? comboAtual.id : 45,
            combo_nome: comboAtual ? comboAtual.nome : null,
            combo_url: comboAtual ? comboAtual.url : null,
            origem: 'QueroPedirMarmitas',
            total: itens.reduce((soma, item) => soma + item.q, 0),
            itens,
            naoEncontrados
        };
    };

    const atualizarLinkCarrinho = (dados) => {
        if (!btnOpenCartAutomation) return;

        ultimoPayloadCarrinho = montarPayloadCarrinho(dados);
        const temItens = ultimoPayloadCarrinho.itens.length > 0;
        const temPendencias = ultimoPayloadCarrinho.naoEncontrados.length > 0;

        if (!temItens || temPendencias) {
            btnOpenCartAutomation.href = '#';
            btnOpenCartAutomation.classList.add('is-disabled');
            btnOpenCartAutomation.setAttribute('aria-disabled', 'true');
            btnOpenCartAutomation.removeAttribute('target');
            return;
        }

        const token = encodeBase64Url(JSON.stringify(ultimoPayloadCarrinho));
        const comboUrl = (comboAtual && comboAtual.url) || ultimoPayloadCarrinho.combo_url;
        btnOpenCartAutomation.href = `${comboUrl}#qpm_cart=${token}`;
        btnOpenCartAutomation.target = '_blank';
        btnOpenCartAutomation.classList.remove('is-disabled');
        btnOpenCartAutomation.setAttribute('aria-disabled', 'false');
    };

    // 6. Renderizar os Resultados Recebidos do Gemini
    const renderizarResultados = (dados) => {
        // Justificativa
        justificativaNutricional.textContent = dados.justificativa_nutricional;

        // Tabela de Pratos
        selectedItemsBody.innerHTML = '';
        
        const itens = dados.itens_selecionados || [];
        itens.forEach(item => {
            const precoUnitario = parseFloat(item.preco_unitario) || 0;
            const subtotal = parseFloat(item.subtotal) || (precoUnitario * (parseInt(item.quantidade, 10) || 0));
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="menu-item-name" style="font-size: 0.85rem">${item.nome}</div></td>
                <td class="text-center font-bold" style="color: var(--accent-primary); font-size: 0.95rem">${item.quantidade}x</td>
                <td class="text-right">R$ ${precoUnitario.toFixed(2)}</td>
                <td class="text-right font-bold">R$ ${subtotal.toFixed(2)}</td>
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

        atualizarLinkCarrinho(dados);
        if (ultimoPayloadCarrinho && ultimoPayloadCarrinho.naoEncontrados.length > 0) {
            mostrarAlertaFlutuante('Nao foi possivel preparar o carrinho para todos os itens selecionados.', 'aviso');
        }

        // Exibir a seção
        resultSection.classList.remove('hidden');
    };

    // 7. Botão Copiar Mensagem
    if (btnOpenCartAutomation) {
        btnOpenCartAutomation.addEventListener('click', (event) => {
            if (!ultimoPayloadCarrinho || btnOpenCartAutomation.classList.contains('is-disabled')) {
                event.preventDefault();
                mostrarAlertaFlutuante('Gere uma sugestao valida antes de montar o carrinho.', 'aviso');
                return;
            }

            if (ultimoPayloadCarrinho.naoEncontrados.length > 0) {
                event.preventDefault();
                mostrarAlertaFlutuante('Revise os itens sem ID antes de abrir o carrinho.', 'aviso');
            }
        });
    }

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
    carregarConfigCloudSync();
    carregarCriterios();
    aplicarComboSelecionado();
    carregarCardapio();
    sincronizarAlturaCardapio();
});
