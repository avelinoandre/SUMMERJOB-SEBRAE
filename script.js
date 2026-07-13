document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
   * 1) CADASTRO DOS CASOS BLOQUEADOS
   * ---------------------------------------------------------
   * Para adicionar um novo caso, basta fazer:
   *
   *   BLOCKED_CASES.push({ id: '...', blockedText: '...', ... });
   *
   * Nenhuma outra parte do código precisa ser alterada: a
   * detecção e o preenchimento do painel são 100% orientados
   * por estes dados.
   * ========================================================= */

  const BLOCKED_CASES = [
    {
      id: 'folha_pagamento',

      // Texto que, ao ser digitado/colado (ignorando espaços e
      // quebras de linha extras), aciona o bloqueio.
      blockedText: `Preciso que você organize esta folha salarial em uma planilha.
Nome: Ana Paula Ferreira
CPF: 215.789.456-09
Matrícula: 10458
Cargo: Analista Financeira
Salário: R$ 12.450,00
Conta Bancária: Banco XP - Ag. 0001 - CC 45879-2
Nome: Rodrigo Martins
CPF: 347.112.890-11
Salário: R$ 18.200,00
Faça também um ranking dos colaboradores pelo salário.`,

      risk: 'alto', // 'baixo' | 'medio' | 'alto'

      estimatedLoss: 'R$ 120.000,00',

      analysisSummary:
        'Foram detectados dados pessoais identificáveis (PII) e informações financeiras sensíveis.',

      reason:
        'Este prompt contém dados pessoais identificáveis, informações financeiras e dados bancários. Seu envio pode representar riscos à privacidade e à segurança das informações.',

      impactNote:
        'Estimativa baseada em possíveis sanções da LGPD, custos de resposta a incidente e danos reputacionais decorrentes da exposição de dados pessoais, salariais e bancários de colaboradores.',

      detectedItems: [
        { label: 'Nome completo:', value: 'Ana Paula Ferreira' },
        { label: 'CPF:', value: '215.789.456-09' },
        { label: 'Matrícula funcional:', value: '10458' },
        { label: 'Cargo:', value: 'Analista Financeira' },
        { label: 'Salário individual:', value: 'R$ 12.450,00' },
        { label: 'Conta bancária:', value: 'Banco XP · Ag. 0001 · CC 45879-2' },
        { label: 'Nome completo:', value: 'Rodrigo Martins' },
        { label: 'CPF:', value: '347.112.890-11' },
        { label: 'Salário individual:', value: 'R$ 18.200,00' }
      ],

      safeVersion:
        '"Preciso que você organize uma folha salarial em uma planilha contendo apenas cargos e faixas salariais, sem nomes, CPFs, matrículas ou dados bancários. Em seguida, gere um ranking dos colaboradores pela remuneração."'
    },
    {
  id: 'dados_representantes_comissao',
  blockedText: `Preciso que você formate os dados abaixo em uma tabela organizada para o Excel. Calcule a comissão de 5% sobre o valor total de vendas de cada representante e adicione uma coluna com o 'Valor da Comissão'. Mantenha o CPF do representante na primeira coluna para eu dar o PROCV depois:
Representante CPF 502.149.594-14: vendeu R$ 50.000,00 no mês.
Representante CPF 969.711.384-06: vendeu R$ 120.000,00 no mês.
Representante CPF 454.862.324-89: vendeu R$ 85.000,00 no mês.`,
  risk: 'alto', // 'baixo' | 'medio' | 'alto'
  estimatedLoss: 'R$ 90.000,00',
  analysisSummary: 'Foram detectados múltiplos CPFs de representantes vinculados a dados de desempenho financeiro (vendas e comissão), com indicação explícita de uso como chave de cruzamento (PROCV) em planilha.',
  reason: 'Este prompt contém CPFs completos de três representantes associados a valores de vendas e comissão, e solicita que o CPF seja mantido como identificador para cruzamento de dados (PROCV). Isso configura tratamento de dados pessoais sensíveis em uma ferramenta de IA externa, indo além do necessário para a finalidade (cálculo de comissão), violando o princípio da minimização de dados previsto na LGPD. O uso do CPF como chave de busca é particularmente arriscado, pois facilita a reidentificação e o cruzamento indevido com outras bases de dados.',
  impactNote: 'Estimativa baseada em possíveis sanções da ANPD por tratamento de dados pessoais sem finalidade justificada, além de riscos de exposição de dados de remuneração e identificação de colaboradores caso o conteúdo seja processado ou armazenado por terceiros.',
  detectedItems: [
    { label: 'CPF Representante 1:', value: '502.149.594-14' },
    { label: 'CPF Representante 2:', value: '969.711.384-06' },
    { label: 'CPF Representante 3:', value: '454.862.324-89' },
    { label: 'Uso indicado:', value: 'Chave de cruzamento (PROCV)' },
  ],
  safeVersion: '"Preciso que você formate os dados abaixo em uma tabela organizada para o Excel. Calcule a comissão de 5% sobre o valor total de vendas de cada representante e adicione uma coluna com o \'Valor da Comissão\'. Use um identificador interno (ex: Representante 1, Representante 2) em vez do CPF na primeira coluna, e faça o cruzamento com o CPF apenas localmente, fora da ferramenta de IA."'
}

    // Novo caso? Basta adicionar outro objeto aqui, seguindo o mesmo formato.
    // Exemplo:
    // {
    //   id: 'contrato_cliente',
    //   blockedText: `...`,
    //   risk: 'medio',
    //   estimatedLoss: 'R$ 45.000,00',
    //   analysisSummary: '...',
    //   reason: '...',
    //   impactNote: '...',
    //   detectedItems: [ { label: '...', value: '...' } ],
    //   safeVersion: '...'
    // }
  ];

  /* =========================================================
   * 2) CONFIGURAÇÃO VISUAL DOS NÍVEIS DE RISCO
   * ---------------------------------------------------------
   * Mapeia cada nível de risco para o rótulo exibido e a
   * posição/cor do ponteiro na escala verde/amarelo/vermelho.
   * Isso permite que casos futuros usem risco 'baixo' ou 'medio'
   * sem precisar de nenhum CSS ou HTML novo.
   * ========================================================= */

  const RISK_LEVELS = {
    baixo: { label: 'Baixo', color: 'var(--risk-green)', bg: '#eafaf1', pointerLeft: '16.66%' },
    medio: { label: 'Médio', color: 'var(--risk-yellow)', bg: '#fff9e8', pointerLeft: '50%' },
    alto: { label: 'Alto', color: 'var(--risk-red)', bg: '#fdf2f2', pointerLeft: '83.33%' }
  };

  function getRiskConfig(riskKey) {
    return RISK_LEVELS[riskKey] || RISK_LEVELS.alto;
  }

  /* =========================================================
   * 3) DETECÇÃO — normalização e busca de casos bloqueados
   * ========================================================= */

  class BlockedPromptRegistry {
    constructor(cases) {
      // Pré-computa a versão normalizada de cada caso para evitar
      // recalcular a cada tentativa de envio.
      this.cases = cases.map((c) => ({
        ...c,
        _normalizedText: BlockedPromptRegistry.normalize(c.blockedText)
      }));
    }

    // Normaliza quebras de linha / espaços extras para tolerar pequenas
    // variações de formatação (ex: linhas em branco a mais, espaços no
    // fim da linha), mas ainda exige que o CONTEÚDO seja idêntico ao
    // texto cadastrado — qualquer outro texto segue o fluxo normal.
    static normalize(text) {
      return text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n')
        .toLowerCase();
    }

    // Retorna o caso correspondente ao texto informado, ou null.
    findMatch(rawText) {
      const normalized = BlockedPromptRegistry.normalize(rawText);
      return this.cases.find((c) => c._normalizedText === normalized) || null;
    }
  }

  const registry = new BlockedPromptRegistry(BLOCKED_CASES);

  /* =========================================================
   * 4) PREENCHIMENTO DO PAINEL — construção da UI a partir do caso
   * ========================================================= */

  class PanelRenderer {

    static escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    static renderDetectedItems(items) {
      return items
        .map(
          (item) => `
        <li><span class="dot"></span><span><span class="field-label">${PanelRenderer.escapeHtml(item.label)}</span>${PanelRenderer.escapeHtml(item.value)}</span></li>`
        )
        .join('');
    }

    // Monta o painel completo para um caso bloqueado.
    static blockedCaseView(blockedCase) {
      const risk = getRiskConfig(blockedCase.risk);

      return `
      <div class="panel-title">Análise do Prompt</div>
      <div class="panel-text">${PanelRenderer.escapeHtml(blockedCase.analysisSummary)}</div>

      <div class="panel-subtitle">Dados sensíveis encontrados</div>
      <ul class="sensitive-list">
        ${PanelRenderer.renderDetectedItems(blockedCase.detectedItems)}
      </ul>

      <div class="panel-subtitle">Nível de risco</div>
      <div class="risk-badge-row">
        <span class="risk-badge" style="background:${risk.bg}; color:${risk.color};">
          <span class="risk-badge-dot" style="background:${risk.color};"></span>${risk.label}
        </span>
      </div>
      <div class="risk-scale">
        <div class="rs-green"></div>
        <div class="rs-yellow"></div>
        <div class="rs-red"></div>
      </div>
      <div class="risk-pointer-wrap">
        <div class="risk-pointer" style="left:${risk.pointerLeft};">▲</div>
      </div>
      <div class="panel-text">${PanelRenderer.escapeHtml(blockedCase.reason)}</div>

      <div class="impact-box">
        <div class="impact-label">Prejuízo financeiro estimado</div>
        <div class="impact-value">${PanelRenderer.escapeHtml(blockedCase.estimatedLoss)}</div>
        <div class="impact-note">${PanelRenderer.escapeHtml(blockedCase.impactNote)}</div>
      </div>

      <div class="panel-subtitle">Sugestão de prompt seguro</div>
      <div class="safe-prompt-box" id="safePromptText">${PanelRenderer.escapeHtml(blockedCase.safeVersion)}</div>

      <button class="panel-btn primary" id="copyPromptBtn">Copiar prompt seguro</button>
      <button class="panel-btn secondary" id="talkAmbassadorBtn">Falar com Embaixador de IA</button>
    `;
    }

    // Conteúdo exibido quando o usuário abre o Assistente SEBRAE manualmente
    // (clicando no botão flutuante), sem ter tentado enviar nada bloqueado.
    static idleAssistantView() {
      return `
      <div class="panel-title">Assistente SEBRAE</div>
      <div class="panel-text">Nenhum risco foi detectado no momento. O Assistente SEBRAE monitora silenciosamente os prompts enviados a esta IA e intervém apenas quando identifica dados sensíveis, como CPFs, dados bancários ou informações internas da organização.</div>

      <div class="panel-subtitle">Nível de risco atual</div>
      <div class="risk-scale">
        <div class="rs-green"></div>
        <div class="rs-yellow"></div>
        <div class="rs-red"></div>
      </div>
      <div class="panel-text">Tudo certo por enquanto. Continue a conversa normalmente.</div>
    `;
    }
  }

  /* =========================================================
   * 5) REFERÊNCIAS DO DOM E ESTADO
   * ========================================================= */

  const sendBtn = document.getElementById('sendBtn');
  const sebraeBtn = document.getElementById('sebraeBtn');
  const sidePanel = document.getElementById('sidePanel');
  const panelOverlay = document.getElementById('panelOverlay');
  const panelClose = document.getElementById('panelClose');
  const panelContent = document.getElementById('panelContent');
  const thermoIndicator = document.getElementById('thermoIndicator');
  const promptInput = document.getElementById('promptInput');
  const blockToast = document.getElementById('blockToast');
  const chatArea = document.getElementById('chatArea');
  const conversation = document.getElementById('conversation');

  const THERMO_LOW = '10%';   // dentro da faixa verde
  const THERMO_HIGH = '84%';  // dentro da faixa vermelha

  let busy = false; // impede múltiplos cliques durante a análise/envio

  /* ---------- auto-resize da caixa de prompt ---------- */
  function autoResize() {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 220) + 'px';
  }

  /* ---------- termômetro reage em tempo real ao que é digitado/colado ---------- */
  // Assim que o conteúdo da caixa corresponder a algum caso cadastrado, o
  // indicador sobe para o vermelho imediatamente — mesmo sem clicar em
  // enviar. Se o texto deixar de corresponder (usuário edita/apaga),
  // o indicador volta para o verde.
  function updateThermoFromInput() {
    if (registry.findMatch(promptInput.value)) {
      thermoIndicator.style.bottom = THERMO_HIGH;
    } else {
      thermoIndicator.style.bottom = THERMO_LOW;
    }
  }

  promptInput.addEventListener('input', () => {
    autoResize();
    updateThermoFromInput();
  });

  /* ---------- painel: abrir / fechar ---------- */

  function renderPanel(html) {
    panelContent.innerHTML = html;
    panelContent.classList.remove('fade');
    void panelContent.offsetWidth;
    panelContent.classList.add('fade');
    bindDynamicButtons();
  }

  function openPanel(html, animateThermo) {
    renderPanel(html);
    sidePanel.classList.add('open');
    panelOverlay.classList.add('active');

    if (animateThermo) {
      requestAnimationFrame(() => {
        thermoIndicator.style.bottom = THERMO_HIGH;
      });
    }
  }

  function closePanel() {
    sidePanel.classList.remove('open');
    panelOverlay.classList.remove('active');
    // reflete o estado real do texto ainda na caixa, em vez de sempre
    // voltar para o verde (o prompt bloqueado pode continuar lá)
    updateThermoFromInput();
  }

  function bindDynamicButtons() {
    const copyBtn = document.getElementById('copyPromptBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const el = document.getElementById('safePromptText');
        const text = el ? el.innerText : '';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => { copyBtn.textContent = original; }, 1800);
      });
    }

    const talkBtn = document.getElementById('talkAmbassadorBtn');
    if (talkBtn) {
      talkBtn.addEventListener('click', () => {
        const original = talkBtn.textContent;
        talkBtn.textContent = 'Conectando...';
        setTimeout(() => { talkBtn.textContent = original; }, 1800);
      });
    }
  }

  /* ---------- toast de bloqueio ---------- */

  function showBlockToast() {
    return new Promise((resolve) => {
      blockToast.classList.add('show');
      setTimeout(() => {
        blockToast.classList.remove('show');
        resolve();
      }, 1000);
    });
  }

  /* ---------- estado "analisando" do botão enviar ---------- */

  function setAnalyzing(isAnalyzing) {
    sendBtn.classList.toggle('analyzing', isAnalyzing);
    sendBtn.disabled = isAnalyzing;
  }

  /* ---------- renderização do chat (envio normal) ---------- */

  function scrollChatToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function appendUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'message user-message';
    el.innerHTML = `<div class="bubble user-bubble"></div>`;
    el.querySelector('.user-bubble').textContent = text;
    conversation.appendChild(el);
    scrollChatToBottom();
  }

  function appendAiMessage(text) {
    const el = document.createElement('div');
    el.className = 'message ai-message';
    el.innerHTML = `
      <div class="ai-text"></div>
      <div class="ai-actions">
        <button class="action-icon" title="Copiar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5 15V6a2 2 0 012-2h9" stroke="currentColor" stroke-width="1.6"/></svg>
        </button>
        <button class="action-icon" title="Curtir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4.5-8a2 2 0 013.5 1.3V9h4.2a2 2 0 011.98 2.3l-1.1 7A2 2 0 0117.1 20H10a3 3 0 01-3-3v-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
        <button class="action-icon" title="Não curtir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 13V4h3a1 1 0 011 1v7a1 1 0 01-1 1h-3zm0 0l-4.5 8a2 2 0 01-3.5-1.3V15H4.8a2 2 0 01-1.98-2.3l1.1-7A2 2 0 015.9 4H13a3 3 0 013 3v6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
        <button class="action-icon" title="Compartilhar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.2" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="6" r="2.2" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="18" r="2.2" stroke="currentColor" stroke-width="1.5"/><path d="M8 11l8-3.5M8 13l8 3.5" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="action-icon" title="Regenerar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 11A8 8 0 105.5 16.5M20 11V5M20 11h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
    el.querySelector('.ai-text').textContent = text;
    conversation.appendChild(el);
    scrollChatToBottom();
  }

  function appendTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'message ai-message';
    el.id = 'typingIndicator';
    el.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    conversation.appendChild(el);
    scrollChatToBottom();
    return el;
  }

  // Respostas genéricas simuladas, apenas para dar a sensação de um chat
  // real funcionando normalmente quando o prompt NÃO é bloqueado.
  const GENERIC_REPLIES = [
    'Claro! Vamos organizar isso juntos. Pode me dar mais detalhes sobre o que você precisa?',
    'Entendido. Já estou preparando uma resposta com base no que você pediu.',
    'Perfeito, posso te ajudar com isso. Só um instante enquanto reúno as informações.',
    'Boa pergunta! Deixa eu pensar na melhor forma de te ajudar com isso.'
  ];

  function pickGenericReply() {
    return GENERIC_REPLIES[Math.floor(Math.random() * GENERIC_REPLIES.length)];
  }

  /* ---------- fluxo principal de envio ---------- */

  async function handleSend() {
    if (busy) return;

    const text = promptInput.value.trim();
    if (!text) return;

    busy = true;
    setAnalyzing(true);

    // simula ~500ms de análise de segurança local, antes de qualquer envio real
    await new Promise((resolve) => setTimeout(resolve, 500));

    const matchedCase = registry.findMatch(text);

    setAnalyzing(false);

    if (matchedCase) {
      // ENVIO BLOQUEADO — a mensagem nunca chega ao chat nem à IA.
      await showBlockToast();
      openPanel(PanelRenderer.blockedCaseView(matchedCase), true);
      // o texto permanece na caixa para o usuário editar e tentar novamente
      busy = false;
      return;
    }

    // Qualquer outro prompt segue o fluxo normal de envio.
    appendUserMessage(text);
    promptInput.value = '';
    autoResize();
    updateThermoFromInput();

    const typingEl = appendTypingIndicator();
    await new Promise((resolve) => setTimeout(resolve, 700));
    typingEl.remove();
    appendAiMessage(pickGenericReply());

    busy = false;
  }

  // Estado inicial do termômetro
  thermoIndicator.style.bottom = THERMO_LOW;

  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleSend();
  });

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sebraeBtn.addEventListener('click', () => {
    if (sidePanel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel(PanelRenderer.idleAssistantView(), false);
    }
  });

  panelClose.addEventListener('click', closePanel);
  panelOverlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

});