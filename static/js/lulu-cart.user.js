// ==UserScript==
// @name         QueroPedirMarmitas - Carrinho Lulu
// @namespace    https://localhost/quero-pedir-marmitas
// @version      1.2.0
// @description  Monta o combo da Marmitas da Lulu a partir da selecao gerada pelo app local.
// @match        https://marmitasdalulu.com.br/*
// @match        https://www.marmitasdalulu.com.br/*
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    const HASH_PARAM = 'qpm_cart';
    const DEFAULT_COMBO_ID = 45;
    const MAX_WAIT_MS = 20000;
    const SAVE_SETTLE_MS = 700;
    const SESSION_TOKEN_KEY = 'qpm_cart_token';

    const readTokenFromHash = (hashValue) => {
        const hash = String(hashValue || '').startsWith('#') ? String(hashValue).slice(1) : String(hashValue || '');
        if (!hash) return null;

        try {
            return new URLSearchParams(hash).get(HASH_PARAM);
        } catch (error) {
            return null;
        }
    };

    const readTokenFromSearch = (searchValue) => {
        try {
            return new URLSearchParams(searchValue || '').get(HASH_PARAM);
        } catch (error) {
            return null;
        }
    };

    const cleanAutomationTokenFromUrl = () => {
        try {
            const url = new URL(window.location.href);
            let changed = false;

            if (readTokenFromHash(url.hash)) {
                url.hash = '';
                changed = true;
            }

            if (url.searchParams.has(HASH_PARAM)) {
                url.searchParams.delete(HASH_PARAM);
                changed = true;
            }

            if (changed) {
                window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
            }
        } catch (error) {
            // Se a URL nao puder ser limpa, o restante da automacao ainda pode seguir.
        }
    };

    const captureInitialToken = () => {
        const token = readTokenFromHash(window.location.hash) || readTokenFromSearch(window.location.search);
        if (!token) return null;

        try {
            sessionStorage.setItem(SESSION_TOKEN_KEY, token);
        } catch (error) {
            console.warn('[QPM] Nao foi possivel guardar o payload temporariamente.', error);
        }

        cleanAutomationTokenFromUrl();
        console.log('[QPM] Payload capturado da URL.');
        return token;
    };

    const initialToken = captureInitialToken();

    const pageWindow = (() => {
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                return unsafeWindow;
            }
        } catch (error) {
            // Alguns gerenciadores de userscript nao expoem unsafeWindow.
        }
        return window;
    })();

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const log = (...args) => {
        console.log('[QPM]', ...args);
    };

    const showStatus = (message, type = 'info') => {
        let box = document.getElementById('qpm-cart-status');
        if (!box) {
            box = document.createElement('div');
            box.id = 'qpm-cart-status';
            box.style.cssText = [
                'position: fixed',
                'right: 18px',
                'bottom: 18px',
                'z-index: 2147483647',
                'max-width: min(360px, calc(100vw - 36px))',
                'padding: 14px 16px',
                'border-radius: 10px',
                'font: 600 14px/1.35 Arial, sans-serif',
                'box-shadow: 0 12px 32px rgba(0,0,0,.28)',
                'background: #26351c',
                'color: #fff',
                'border: 1px solid rgba(255,255,255,.18)'
            ].join(';');
            (document.body || document.documentElement).appendChild(box);
        }

        box.textContent = message;
        box.style.background = type === 'error' ? '#8f2424' : type === 'success' ? '#1e6b3d' : '#26351c';
    };

    const readStoredToken = () => {
        try {
            return sessionStorage.getItem(SESSION_TOKEN_KEY);
        } catch (error) {
            return null;
        }
    };

    const decodePayload = () => {
        const token = initialToken
            || readTokenFromHash(window.location.hash)
            || readTokenFromSearch(window.location.search)
            || readStoredToken();
        if (!token) return null;

        const base64 = decodeURIComponent(token).replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    };

    const getPrefiroApp = () => {
        return pageWindow.$pd || window.$pd || null;
    };

    const waitForPrefiro = async () => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < MAX_WAIT_MS) {
            const pd = getPrefiroApp();
            if (
                pd
                && pd.shared
                && pd.shared.produtos
                && pd.cart
                && Array.isArray(pd.cart.items)
                && typeof pd.Cart__produtoModel === 'function'
                && typeof pd.Cart__set === 'function'
            ) {
                return pd;
            }
            await sleep(250);
        }
        return null;
    };

    const groupPayloadItems = (payload) => {
        const grouped = new Map();
        (payload.itens || []).forEach(item => {
            const id = String(item.id || '').trim();
            const qtd = parseInt(item.q, 10) || 0;
            if (!id || qtd <= 0) return;
            grouped.set(id, (grouped.get(id) || 0) + qtd);
        });
        return grouped;
    };

    const getStorageKey = (pd) => {
        return (pd && pd.Conf && pd.Conf.cookieName)
            || `${pageWindow.$CLIENTE || pageWindow.$_cliente || 'marmitasdalulu'}_Cart`;
    };

    const getCartUrl = () => {
        const rootUrl = String(pageWindow.$ROOTURL || `${window.location.origin}/marmitasdalulu`).replace(/\/$/, '');
        return `${rootUrl}/carrinho`;
    };

    const getCombo = (pd, comboId) => {
        return pd.shared.produtos[String(comboId)] || pd.shared.produtos[comboId] || null;
    };

    const getOpcaoId = (opcao) => {
        return String(opcao.composicao_opcao_id || opcao.opcao_id || opcao.id || '').trim();
    };

    const getOpcaoPreco = (opcao) => {
        const promocional = Number(opcao.coo_preco_promocional);
        if (Number.isFinite(promocional) && promocional > 0) return promocional;

        const preco = Number(opcao.coo_preco);
        return Number.isFinite(preco) ? preco : 0;
    };

    const calcularValorTotal = (model) => {
        const valorBase = Number(model.valor || 0);
        const composicoesTotal = (model.composicao || []).reduce((totalComposicao, composicao) => {
            return totalComposicao + (composicao.opcoes || []).reduce((totalOpcao, opcao) => {
                return totalOpcao + getOpcaoPreco(opcao) * (Number(opcao.qtd) || 0);
            }, 0);
        }, 0);

        return (valorBase + composicoesTotal) * (Number(model.quantidade) || 1);
    };

    const applyQuantities = (model, groupedItems) => {
        let selectedCount = 0;
        const found = new Set();

        (model.composicao || []).forEach(composicao => {
            (composicao.opcoes || []).forEach(opcao => {
                const id = getOpcaoId(opcao);
                const qtd = groupedItems.get(id) || 0;
                opcao.qtd = qtd;
                if (qtd > 0) {
                    selectedCount += qtd;
                    found.add(id);
                }
            });
        });

        const missing = [...groupedItems.keys()].filter(id => !found.has(id));
        return { selectedCount, missing };
    };

    const removeExistingCombo = (pd, comboId) => {
        if (!pd.cart || !Array.isArray(pd.cart.items)) return;

        for (let index = pd.cart.items.length - 1; index >= 0; index -= 1) {
            const item = pd.cart.items[index];
            if (String(item && item.produto_id) === String(comboId)) {
                if (item.uuid && typeof pd.Cart__remove === 'function') {
                    pd.Cart__remove(item.uuid, 'uuid', true);
                } else {
                    pd.cart.items.splice(index, 1);
                }
            }
        }
    };

    const persistWithLocalStorageFallback = (pd, storageKey) => {
        if (typeof pd.Cart__save === 'function') {
            pd.salvandoCarrinho = false;
            pd.Cart__save();
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(pd.cart.items || []));
        } catch (error) {
            console.warn('[QPM] Nao foi possivel gravar fallback localStorage.', error);
        }
    };

    const selectedCountFromCartItem = (cartItem) => {
        return (cartItem.composicao || []).reduce((totalComposicao, composicao) => {
            return totalComposicao + (composicao.opcoes || []).reduce((totalOpcao, opcao) => {
                return totalOpcao + (Number(opcao.qtd) || 0);
            }, 0);
        }, 0);
    };

    const getStoredCombo = (storageKey, comboId) => {
        try {
            const itens = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return (Array.isArray(itens) ? itens : []).find(item => String(item && item.produto_id) === String(comboId));
        } catch (error) {
            console.warn('[QPM] Nao foi possivel ler o carrinho salvo.', error);
            return null;
        }
    };

    const buildComboModel = (pd, combo, groupedItems) => {
        const model = pd.Cart__produtoModel(combo, 1);
        const result = applyQuantities(model, groupedItems);

        if (result.missing.length > 0) {
            throw new Error(`Opcoes nao encontradas no combo atual: ${result.missing.join(', ')}`);
        }

        if (result.selectedCount <= 0) {
            throw new Error('Nenhuma marmita foi marcada no combo.');
        }

        const minSelecionadas = Math.max(...(model.composicao || []).map(composicao => Number(composicao.com_qtd_minima || 0)), 0);
        if (minSelecionadas > 0 && result.selectedCount < minSelecionadas) {
            throw new Error(`O combo exige pelo menos ${minSelecionadas} marmitas, mas a selecao tem ${result.selectedCount}.`);
        }

        const variacaoId = combo.user && combo.user.variacao
            ? combo.user.variacao
            : Object.keys(combo.variacoes || {})[0];

        model.quantidade = 1;
        model.quantidadeOriginal = 1;
        model.variacao_id = variacaoId;
        model.valor = typeof pd.Variacao__preco === 'function'
            ? pd.Variacao__preco(model.produto_id)
            : Number(model.valor || 0);
        model.valor_total = calcularValorTotal(model);
        model.observacao = 'Montado pelo QueroPedirMarmitas';
        model.isItemCarrinho = false;
        model.boolComposicoesQtd = (model.composicao || []).map(() => true);
        model.controleComposicoesQtd = (model.composicao || []).map(() => true);

        return { model, selectedCount: result.selectedCount };
    };

    const run = async () => {
        let payload = null;
        try {
            payload = decodePayload();
        } catch (error) {
            showStatus('Nao consegui ler a selecao do QueroPedirMarmitas.', 'error');
            console.error('[QPM] Payload invalido.', error);
            return;
        }

        if (!payload) return;

        try {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
        } catch (error) {
            // Ignora limpeza do payload temporario.
        }

        const groupedItems = groupPayloadItems(payload);
        if (groupedItems.size === 0) {
            showStatus('A selecao nao tem itens validos para o carrinho.', 'error');
            return;
        }

        showStatus('Montando carrinho com a selecao do QueroPedirMarmitas...');
        log('Payload recebido.', payload);

        const pd = await waitForPrefiro();
        if (!pd) {
            showStatus('Nao encontrei o app da PrefiroDelivery nesta pagina. Confira se o userscript esta ativo neste site.', 'error');
            log('window.$pd indisponivel.', {
                hasUnsafeWindow: pageWindow !== window,
                hasPagePd: Boolean(pageWindow.$pd),
                hasWindowPd: Boolean(window.$pd)
            });
            return;
        }

        try {
            const comboId = payload.combo_id || DEFAULT_COMBO_ID;
            const combo = getCombo(pd, comboId);
            if (!combo) {
                throw new Error(`Combo ${comboId} nao encontrado.`);
            }

            const storageKey = getStorageKey(pd);
            const { model, selectedCount } = buildComboModel(pd, combo, groupedItems);

            if (typeof pd.Cart__validateInsert === 'function' && !pd.Cart__validateInsert(model)) {
                throw new Error('A PrefiroDelivery recusou a inclusao deste combo no carrinho.');
            }

            removeExistingCombo(pd, comboId);
            pd.Cart__set(model);
            persistWithLocalStorageFallback(pd, storageKey);

            await sleep(SAVE_SETTLE_MS);
            persistWithLocalStorageFallback(pd, storageKey);

            const storedCombo = getStoredCombo(storageKey, comboId);
            const storedCount = storedCombo ? selectedCountFromCartItem(storedCombo) : 0;
            if (!storedCombo || storedCount <= 0) {
                throw new Error(`O combo nao ficou salvo na chave ${storageKey}.`);
            }

            log('Carrinho salvo.', {
                storageKey,
                selectedCount,
                storedCount,
                cartItems: pd.cart.items.length
            });
            showStatus(`Carrinho montado com ${storedCount} marmitas. Abrindo revisao...`, 'success');
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            setTimeout(() => {
                window.location.assign(getCartUrl());
            }, 800);
        } catch (error) {
            showStatus(`Nao consegui montar o carrinho: ${error.message}`, 'error');
            console.error('[QPM] Falha ao montar carrinho.', error);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
        run();
    }
})();
