document.addEventListener('DOMContentLoaded', () => {

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
  promptInput.addEventListener('input', autoResize);

  /* ---------- o ÚNICO prompt que deve ser bloqueado ---------- */
  const BLOCKED_PROMPT = `Preciso que você organize esta folha salarial em uma planilha.
Nome: Ana Paula Ferreira
CPF: 215.789.456-09
Matrícula: 10458
Cargo: Analista Financeira
Salário: R$ 12.450,00
Conta Bancária: Banco XP - Ag. 0001 - CC 45879-2
Nome: Rodrigo Martins
CPF: 347.112.890-11
Salário: R$ 18.200,00
Faça também um ranking dos colaboradores pelo salário.`;

  // Normaliza quebras de linha / espaços extras para tolerar pequenas
  // variações de formatação (ex: linhas em branco a mais, espaços no
  // fim da linha), mas ainda exige que o CONTEÚDO seja este prompt
  // específico — qualquer outro texto segue o fluxo normal de envio.
  function normalize(text) {
    return text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .toLowerCase();
  }

  const BLOCKED_PROMPT_NORMALIZED = normalize(BLOCKED_PROMPT);

  function isBlockedPrompt(rawText) {
    return normalize(rawText) === BLOCKED_PROMPT_NORMALIZED;
  }

  /* ---------- views do painel (bloqueio) ---------- */

  function payrollBlockedView() {
    return `
      <div class="panel-title">Análise do Prompt</div>
      <div class="panel-text">Foram detectados dados pessoais identificáveis (PII) e informações financeiras sensíveis.</div>

      <div class="panel-subtitle">Dados sensíveis encontrados</div>
      <ul class="sensitive-list">
        <li><span class="dot"></span><span><span class="field-label">Nome completo:</span>Ana Paula Ferreira</span></li>
        <li><span class="dot"></span><span><span class="field-label">CPF:</span>215.789.456-09</span></li>
        <li><span class="dot"></span><span><span class="field-label">Matrícula funcional:</span>10458</span></li>
        <li><span class="dot"></span><span><span class="field-label">Cargo:</span>Analista Financeira</span></li>
        <li><span class="dot"></span><span><span class="field-label">Salário individual:</span>R$ 12.450,00</span></li>
        <li><span class="dot"></span><span><span class="field-label">Conta bancária:</span>Banco XP · Ag. 0001 · CC 45879-2</span></li>
        <li><span class="dot"></span><span><span class="field-label">Nome completo:</span>Rodrigo Martins</span></li>
        <li><span class="dot"></span><span><span class="field-label">CPF:</span>347.112.890-11</span></li>
        <li><span class="dot"></span><span><span class="field-label">Salário individual:</span>R$ 18.200,00</span></li>
      </ul>

      <div class="panel-subtitle">Nível de risco</div>
      <div class="risk-badge-row">
        <span class="risk-badge"><span class="risk-badge-dot"></span>Alto</span>
      </div>
      <div class="risk-scale">
        <div class="rs-green"></div>
        <div class="rs-yellow"></div>
        <div class="rs-red"></div>
      </div>
      <div class="risk-pointer-wrap">
        <div class="risk-pointer">▲</div>
      </div>
      <div class="panel-text">Este prompt contém dados pessoais identificáveis, informações financeiras e dados bancários. Seu envio pode representar riscos à privacidade e à segurança das informações.</div>

      <div class="panel-subtitle">Sugestão de prompt seguro</div>
      <div class="safe-prompt-box" id="safePromptText">"Preciso que você organize uma folha salarial em uma planilha contendo apenas cargos e faixas salariais, sem nomes, CPFs, matrículas ou dados bancários. Em seguida, gere um ranking dos colaboradores pela remuneração."</div>

      <button class="panel-btn primary" id="copyPromptBtn">Copiar prompt seguro</button>
      <button class="panel-btn secondary" id="talkAmbassadorBtn">Falar com Embaixador de IA</button>
    `;
  }

  // Conteúdo exibido quando o usuário abre o Assistente SEBRAE manualmente
  // (clicando no botão flutuante), sem ter tentado enviar nada bloqueado.
  function idleAssistantView() {
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
    thermoIndicator.style.bottom = THERMO_LOW;
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

    const blocked = isBlockedPrompt(text);

    setAnalyzing(false);

    if (blocked) {
      // ENVIO BLOQUEADO — a mensagem nunca chega ao chat nem à IA.
      await showBlockToast();
      openPanel(payrollBlockedView(), true);
      // o texto permanece na caixa para o usuário editar e tentar novamente
      busy = false;
      return;
    }

    // Qualquer outro prompt segue o fluxo normal de envio.
    appendUserMessage(text);
    promptInput.value = '';
    autoResize();

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
      openPanel(idleAssistantView(), false);
    }
  });

  panelClose.addEventListener('click', closePanel);
  panelOverlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

});