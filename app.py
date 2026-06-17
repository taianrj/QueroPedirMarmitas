import os
import re
import json
import urllib.request
import urllib.parse
from flask import Flask, jsonify, request, render_template, send_from_directory
import openpyxl
import google.generativeai as genai

app = Flask(__name__, template_folder='templates', static_folder='static')

# Configurações
EXCEL_PATH = os.path.join(os.path.dirname(__file__), "Marmitas da Lulu - Combo 20 unidades.xlsx")
URL_PRINCIPAL = "https://marmitasdalulu.com.br/marmitasdalulu/produto/45/monte-seu-combo--vida-saudavel--a-partir-de-20-unidades"
BASE_URL = "https://marmitasdalulu.com.br"

def extrair_marmitas_do_site():
    """Faz a raspagem do cardápio direto do site Marmitas da Lulu."""
    try:
        # 1. Obter o HTML da página do combo para descobrir o script all-static.js
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        req = urllib.request.Request(URL_PRINCIPAL, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        # 2. Encontrar o caminho do script all-static.js
        # Exemplo no HTML: <script src="/cliente/marmitasdalulu/assets/all-static.js?v=17062026143936"></script>
        match_script = re.search(r'src=["\'](/cliente/[^"\']/assets/all-static\.js\?v=[0-9]+)["\']', html)
        if not match_script:
            # Fallback genérico se o hash mudar de formato
            match_script = re.search(r'src=["\'](/cliente/.*?all-static\.js[^"\']*)["\']', html)
            
        if not match_script:
            raise Exception("Não foi possível encontrar a tag do script all-static.js no HTML do site.")
            
        script_path = match_script.group(1)
        script_url = BASE_URL + script_path
        
        # 3. Baixar o arquivo JavaScript
        req_js = urllib.request.Request(script_url, headers=headers)
        with urllib.request.urlopen(req_js, timeout=10) as response:
            js_content = response.read().decode('utf-8', errors='ignore')
            
        # 4. Extrair a variável $_produtos do script
        match_produtos = re.search(r'window\.\$_produtos\s*=\s*(.*?);(?=window\.|\Z)', js_content, re.DOTALL)
        if not match_produtos:
            raise Exception("Variável window.$_produtos não encontrada no JavaScript do site.")
            
        produtos = json.loads(match_produtos.group(1).strip())
        
        # 5. Encontrar o produto correspondente ao Combo
        combo_prod = produtos.get('45')
        if not combo_prod:
            # Busca resiliente por nome do combo
            for pid, p in produtos.items():
                if "monte seu combo" in p.get('prd_nome', '').lower():
                    combo_prod = p
                    break
                    
        if not combo_prod:
            raise Exception("Produto do tipo Combo de Marmitas não encontrado no cardápio do site.")
            
        # 6. Extrair os pratos (opções da composição do combo)
        marmitas = []
        composicoes = combo_prod.get('composicoes', [])
        if not composicoes:
            raise Exception("Composições do combo não encontradas.")
            
        # Geralmente a primeira composição ("Escolha as suas opções...") traz os pratos
        opcoes = composicoes[0].get('opcoes', [])
        for op in opcoes:
            nome = op.get('coo_nome', '').strip()
            descricao = op.get('coo_complemento', '').strip()
            preco = op.get('coo_preco')
            
            # Decodificar entidades HTML básicas (ex: &eacute; para é)
            # Como vamos usar a API, podemos repassar para limpar, mas fazemos um replace básico
            descricao = clean_html_entities(descricao)
            
            marmitas.append({
                'id': op.get('composicao_opcao_id'),
                'nome': nome,
                'descricao': descricao,
                'preco': float(preco) if preco is not None else 0.0,
                'foto': op.get('coo_foto'),
                'origem': 'site'
            })
            
        return marmitas, None
    except Exception as e:
        return None, str(e)

def extrair_marmitas_do_excel():
    """Faz a leitura do cardápio a partir da planilha Excel local."""
    try:
        if not os.path.exists(EXCEL_PATH):
            return None, "Arquivo Excel não encontrado no diretório do projeto."
            
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        if "Opções de marmita" not in wb.sheetnames:
            return None, "Aba 'Opções de marmita' não encontrada na planilha."
            
        sheet = wb["Opções de marmita"]
        marmitas = []
        
        # O cabeçalho é Marmita e Valor na linha 1
        # Linhas de dados começam na linha 2
        for r in range(2, sheet.max_row + 1):
            nome_val = sheet.cell(r, 1).value
            preco_val = sheet.cell(r, 2).value
            
            if nome_val:
                nome = str(nome_val).strip()
                # Limpar o preço
                # Exemplo de preço: "+R$ 28,11" ou "28.11" ou 28.11
                preco = 0.0
                if preco_val is not None:
                    if isinstance(preco_val, (int, float)):
                        preco = float(preco_val)
                    else:
                        # Limpar string
                        preco_str = str(preco_val).replace('+R$', '').replace('R$', '').replace('\xa0', '').strip()
                        preco_str = preco_str.replace('.', '').replace(',', '.') # Converter padrão PT-BR para float
                        try:
                            preco = float(preco_str)
                        except ValueError:
                            preco = 0.0
                            
                marmitas.append({
                    'id': f"xls_{r}",
                    'nome': nome,
                    'descricao': "Disponível na planilha local",
                    'preco': preco,
                    'foto': None,
                    'origem': 'excel'
                })
                
        return marmitas, None
    except Exception as e:
        return None, str(e)

def clean_html_entities(text):
    """Substitui algumas entidades HTML básicas comuns no site."""
    if not text:
        return ""
    replacements = {
        "&ldquo;": '"', "&rdquo;": '"', "&lsquo;": "'", "&rsquo;": "'",
        "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
        "&quot;": '"', "&#039;": "'", "&aacute;": "á", "&eacute;": "é",
        "&iacute;": "í", "&oacute;": "ó", "&uacute;": "ú",
        "&atilde;": "ã", "&otilde;": "õ", "&acirc;": "â", "&ecirc;": "ê",
        "&ocirc;": "ô", "&ccedil;": "ç", "&Aacute;": "Á", "&Eacute;": "É",
        "&Iacute;": "Í", "&Oacute;": "Ó", "&Uacute;": "Ú",
        "&Atilde;": "Ã", "&Otilde;": "Õ", "&Ccedil;": "Ç"
    }
    for ent, char in replacements.items():
        text = text.replace(ent, char)
    # Remover tags HTML remanescentes se houver
    text = re.sub(r'<[^>]+>', '', text)
    return text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cardapio')
def api_cardapio():
    # Tenta raspar do site primeiro
    marmitas, erro_site = extrair_marmitas_do_site()
    
    if marmitas:
        return jsonify({
            'sucesso': True,
            'origem': 'site',
            'marmitas': marmitas
        })
        
    # Se falhar, tenta ler do Excel como fallback
    print(f"Raspagem do site falhou: {erro_site}. Tentando ler do Excel...")
    marmitas_xls, erro_xls = extrair_marmitas_do_excel()
    
    if marmitas_xls:
        return jsonify({
            'sucesso': True,
            'origem': 'excel',
            'alerta': f"Erro ao acessar site ({erro_site}). Dados carregados do Excel local.",
            'marmitas': marmitas_xls
        })
        
    return jsonify({
        'sucesso': False,
        'erro': f"Não foi possível carregar os dados. Site: {erro_site} | Excel: {erro_xls}"
    }), 500

@app.route('/api/gerar-sugestao', methods=['POST'])
def api_gerar_sugestao():
    dados = request.json
    api_key = dados.get('api_key')
    marmitas = dados.get('marmitas', [])
    criterios = dados.get('criterios', {})
    
    if not api_key:
        return jsonify({'sucesso': False, 'erro': 'A chave de API do Gemini é obrigatória.'}), 400
        
    if not marmitas:
        return jsonify({'sucesso': False, 'erro': 'Nenhuma marmita informada para seleção.'}), 400
        
    try:
        # Configurar API do Gemini
        genai.configure(api_key=api_key)
        
        # Parâmetros de critérios
        objetivo = criterios.get('objetivo', 'Saudável / Variado')
        quantidade = int(criterios.get('quantidade', 20))
        max_repeticoes = int(criterios.get('max_repeticoes', 3))
        valor_maximo = criterios.get('valor_maximo')
        exclusoes = criterios.get('exclusoes', '')
        preferencias = criterios.get('preferencias', '')
        
        # Obter a saudação dinâmica baseada no horário local do servidor
        from datetime import datetime
        hora_atual = datetime.now().hour
        if 5 <= hora_atual < 12:
            saudacao = "Bom dia!"
        elif 12 <= hora_atual < 18:
            saudacao = "Boa tarde!"
        else:
            saudacao = "Boa noite!"

        # Formatar a lista de marmitas para o prompt
        lista_marmitas_str = ""
        for idx, m in enumerate(marmitas):
            lista_marmitas_str += f"[{idx}] {m['nome']} - Preço: R$ {m['preco']:.2f} | Ingredientes/Descrição: {m['descricao']}\n"
            
        prompt = f"""
Você é um nutricionista especialista e assistente de delivery. Seu objetivo é ajudar o usuário a escolher a combinação ideal de marmitas saudáveis a partir do cardápio do site "Marmitas da Lulu".

Aqui está a lista de marmitas disponíveis no cardápio atualmente:
{lista_marmitas_str}

CRITÉRIOS DO USUÁRIO:
- Objetivo Nutricional: {objetivo}
- Quantidade total de marmitas a selecionar: {quantidade} unidades.
- Quantidade máxima de repetição de cada prato: {max_repeticoes} unidades (não pedir mais do que {max_repeticoes} do mesmo tipo).
{f"- Valor total máximo aproximado: R$ {valor_maximo:.2f}" if valor_maximo else "- Orçamento: Sem limite específico (escolher as melhores de acordo com a nutrição)"}
- Ingredientes a serem EXCLUÍDOS ou restrições alimentares: {exclusoes if exclusoes else "Nenhuma restrição especial"}
- Preferências alimentares específicas: {preferencias if preferencias else "Nenhuma preferência especial"}

SUAS DIRETRIZES DE SELEÇÃO:
1. QUANTIDADE EXATA: A soma das quantidades de todas as marmitas escolhidas deve ser EXATAMENTE igual a {quantidade}. Nem mais, nem menos.
2. MÁXIMO DE REPETIÇÕES: Você NÃO pode selecionar mais do que {max_repeticoes} unidades de uma única marmita. Por exemplo, se for configurado 3, a quantidade máxima de um prato individual na lista selecionada pode ser 1x, 2x ou 3x, mas NUNCA 4x ou mais. Isso é obrigatório para garantir a variedade.
3. ORÇAMENTO: Se houver um valor total máximo aproximado, a soma dos preços de todas as marmitas escolhidas deve ficar dentro ou o mais próximo possível desse valor. Lembre-se de multiplicar a quantidade de cada prato pelo seu preço individual na soma.
4. OBJETIVO NUTRICIONAL: Escolha os pratos adequados ao objetivo. Se for "Low Carb", prefira marmitas da linha Low Carb ou com poucos carboidratos. Se for "Ganho de Massa / Maromba", prefira opções proteicas e com carboidratos complexos (linha Maromba). Se for "Emagrecimento", prefira pratos menos calóricos.
5. EXCLUSÕES: Não selecione NENHUMA marmita que contenha ingredientes listados nas restrições/exclusões do usuário. Analise bem o nome e a descrição do prato para garantir isso.
6. PREFERÊNCIAS: Dê peso maior às marmitas que se alinhem às preferências do usuário.

FORMATO DE RETORNO ESPERADO (Gere APENAS um JSON no formato especificado abaixo, sem crases de formatação markdown e sem textos adicionais antes ou depois. O JSON deve ser diretamente interpretável por `json.loads`):
{{
  "itens_selecionados": [
    {{
      "nome": "NOME DO PRATO EXATO",
      "quantidade": 3,
      "preco_unitario": 28.11,
      "subtotal": 84.33
    }}
  ],
  "valor_total": 560.20,
  "justificativa_nutricional": "Uma breve explicação em português do Brasil (1 parágrafo) de como essa seleção atende ao objetivo nutricional, limite de repetições e preferências do usuário.",
  "mensagem_whatsapp": "A mensagem formatada pronta para enviar no WhatsApp para fazer o pedido. Deve ser cortês, clara e estruturada.\\n\\nREGRAS CRÍTICAS DE FORMATAÇÃO DA MENSAGEM DO WHATSAPP:\\n1. Comece a mensagem exatamente com: '{saudacao} Tudo bem?' e uma quebra de linha.\\n2. NUNCA cite a palavra 'Lulu' ou use nomes próprios de atendentes.\\n3. NÃO coloque o valor total calculado na mensagem do WhatsApp, pois o usuário deseja que o atendimento do delivery informe o valor oficial. Remova qualquer menção ao preço total ou subtotais.\\n\\nExemplo de estrutura da mensagem:\\n{saudacao} Tudo bem?\\n\\nGostaria de fazer o pedido do meu combo de {quantidade} marmitas:\\n\\n- 3x LINHA MAROMBA: SOBRECOXA...\\n- 2x LINHA LOW CARB: PATINHO...\\n\\nMuito obrigado!\\n\\n(A mensagem deve listar apenas os pratos e quantidades exatas no formato acima, sem preços e sem totais)"
}}
"""

        # Chamar o modelo Gemini 2.5 Flash
        # O modelo recomendado para tarefas rápidas e estruturadas é 'gemini-3.5-flash'
        model = genai.GenerativeModel('gemini-3.5-flash')
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        # Fazer o parse da resposta
        resposta_json = json.loads(response.text.strip())
        return jsonify({
            'sucesso': True,
            'dados': resposta_json
        })
        
    except json.JSONDecodeError as jde:
        print("Erro ao decodificar JSON retornado pelo Gemini:", response.text)
        return jsonify({
            'sucesso': False,
            'erro': "O Gemini gerou uma resposta, mas ela não veio no formato JSON correto. Tente gerar novamente.",
            'detalhe': str(jde),
            'resposta_crua': response.text if 'response' in locals() else None
        }), 500
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'erro': f"Erro ao processar requisição com o Gemini: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Criar diretórios se não existirem
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    print("Iniciando servidor local do QueroPedirMarmitas...")
    app.run(debug=True, port=5000)
