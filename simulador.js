// simulador.js

const bandeirasTaxa = {
  verde: 0,
  amarela: 0.015,
  vermelha1: 0.045,
  vermelha2: 0.09,
};

let distribuidorasData = {};
let precoKwh = 0;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const regiaoSelect = document.getElementById('regiao');
  const distribuidoraSelect = document.getElementById('distribuidora');
  const bandeiraSelect = document.getElementById('bandeira');
  const anteriorInput = document.getElementById('anterior');
  const atualInput = document.getElementById('atual');
  const btnCalcular = document.getElementById('btnCalcular');
  const resultadoDiv = document.getElementById('resultado');

  const btnHistorico = document.getElementById('btnHistorico');
  const btnDashboard = document.getElementById('btnDashboard');

  const errorMap = {
    regiao: document.getElementById('regiao-error'),
    distribuidora: document.getElementById('distribuidora-error'),
    bandeira: document.getElementById('bandeira-error'),
    anterior: document.getElementById('anterior-error'),
    atual: document.getElementById('atual-error'),
  };

  const touched = {
    regiao: false,
    distribuidora: false,
    bandeira: false,
    anterior: false,
    atual: false
  };

  async function carregarDistribuidoras() {
    try {
      const response = await fetch('distribuidoras.json');
      if (!response.ok) throw new Error('Falha ao carregar distribuidoras');
      distribuidorasData = await response.json();
    } catch (error) {
      alert('Erro ao carregar dados das distribuidoras.');
      distribuidorasData = {};
    }
  }

  function preencherDistribuidoras(regiao) {
    distribuidoraSelect.innerHTML = '<option value="" disabled selected>-- Escolha a distribuidora --</option>';

    if (!regiao || !distribuidorasData[regiao]) {
      distribuidoraSelect.disabled = true;
      precoKwh = 0;
      atualizarBotao();
      return;
    }

    distribuidorasData[regiao].forEach(({ nome }) => {
      const option = document.createElement('option');
      option.value = nome;
      option.textContent = nome;
      distribuidoraSelect.appendChild(option);
    });

    distribuidoraSelect.disabled = false;
    precoKwh = 0;
    atualizarBotao();
  }

  function validarCampo() {
    let valid = true;

    if (touched.regiao) {
      if (!regiaoSelect.value) {
        errorMap.regiao.textContent = 'Por favor, selecione a região.';
        valid = false;
      } else {
        errorMap.regiao.textContent = '';
      }
    }

    if (touched.distribuidora) {
      if (!distribuidoraSelect.value) {
        errorMap.distribuidora.textContent = 'Por favor, selecione a distribuidora.';
        valid = false;
      } else {
        errorMap.distribuidora.textContent = '';
      }
    }

    if (touched.bandeira) {
      if (!bandeiraSelect.value) {
        errorMap.bandeira.textContent = 'Selecione uma bandeira.';
        valid = false;
      } else {
        errorMap.bandeira.textContent = '';
      }
    }

    const anteriorVal = parseFloat(anteriorInput.value);
    if (touched.anterior) {
      if (isNaN(anteriorVal) || anteriorVal < 0) {
        errorMap.anterior.textContent = 'Informe uma leitura anterior válida (≥ 0).';
        valid = false;
      } else {
        errorMap.anterior.textContent = '';
      }
    }

    const atualVal = parseFloat(atualInput.value);
    if (touched.atual) {
      if (isNaN(atualVal) || atualVal < 0) {
        errorMap.atual.textContent = 'Informe uma leitura atual válida (≥ 0).';
        valid = false;
      } else if (touched.anterior && atualVal < anteriorVal) {
        errorMap.atual.textContent = 'Leitura atual deve ser maior ou igual à anterior.';
        valid = false;
      } else {
        errorMap.atual.textContent = '';
      }
    }

    return valid;
  }

  function atualizarBotao() {
    const camposPreenchidos = regiaoSelect.value && distribuidoraSelect.value &&
      bandeiraSelect.value && anteriorInput.value && atualInput.value;

    btnCalcular.disabled = !(camposPreenchidos && precoKwh > 0 && validarCampo());
  }

  regiaoSelect.addEventListener('change', e => {
    touched.regiao = true;
    preencherDistribuidoras(e.target.value);
    atualizarBotao();
  });

  distribuidoraSelect.addEventListener('change', e => {
    touched.distribuidora = true;
    const regiao = regiaoSelect.value;
    const nomeDistribuidora = e.target.value;

    if (!regiao || !nomeDistribuidora) {
      precoKwh = 0;
      atualizarBotao();
      return;
    }

    const dist = distribuidorasData[regiao].find(d => d.nome === nomeDistribuidora);
    precoKwh = dist ? dist.tarifa : 0;

    atualizarBotao();
  });

  [regiaoSelect, distribuidoraSelect, bandeiraSelect, anteriorInput, atualInput].forEach(el => {
    el.addEventListener('input', e => {
      touched[e.target.id] = true;
      atualizarBotao();
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!validarCampo() || precoKwh === 0) return;

    const leituraAnterior = parseFloat(anteriorInput.value);
    const leituraAtual = parseFloat(atualInput.value);
    const consumo = leituraAtual - leituraAnterior;

    const bandeira = bandeiraSelect.value;
    const taxaBandeira = bandeirasTaxa[bandeira] || 0;

    const custoEnergia = consumo * precoKwh;
    const custoBandeira = consumo * taxaBandeira;
    const total = custoEnergia + custoBandeira;

    if (confirm(`Valor estimado da conta: R$ ${total.toFixed(2)}\n\nDeseja armazenar este resultado no histórico?`)) {
      const historico = carregarHistorico();

      historico.push({
        data: new Date().toISOString(),
        leituraAtual,
        consumo,
        valor: total,
      });

      salvarHistorico(historico);
    }

    resultadoDiv.classList.add('show');
    resultadoDiv.innerHTML = `
      <p>Distribuidora: <strong>${distribuidoraSelect.value}</strong> - ${regiaoSelect.options[regiaoSelect.selectedIndex].text}</p>
      <p>Consumo: <strong>${consumo.toFixed(2)} kWh</strong></p>
      <p>Custo energia: <strong>R$ ${custoEnergia.toFixed(2)}</strong></p>
      <p>Custo bandeira (<strong>${bandeira.charAt(0).toUpperCase() + bandeira.slice(1)}</strong>): <strong>R$ ${custoBandeira.toFixed(2)}</strong></p>
      <hr>
      <p><strong>Valor estimado da conta: R$ ${total.toFixed(2)}</strong></p>
      <div class="alerta-resultado" role="alert" aria-live="assertive">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#b22222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="1"/>
          </svg>
          <span>Atenção: Este valor considera apenas o consumo de energia e a tarifa da bandeira, sem incluir outras taxas ou impostos.</span>
      </div>
    `;
  });

  // Botões de navegação
  btnHistorico.addEventListener('click', () => {
    window.location.href = 'historico.html';
  });

  btnDashboard.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  // Inicializa
  (async function init() {
    await carregarDistribuidoras();
    preencherDistribuidoras('');
    atualizarBotao();
  })();

});

// Funções para histórico localStorage
function carregarHistorico() {
  const dados = localStorage.getItem('historicoConsumo');
  return dados ? JSON.parse(dados) : [];
}

function salvarHistorico(historico) {
  localStorage.setItem('historicoConsumo', JSON.stringify(historico));
}
