// script.js

// Dados globais e funções utilitárias comuns
const bandeirasTaxa = {
  verde: 0.000,
  amarela: 0.019,
  vermelha1: 0.045,
  vermelha2: 0.079,
};

// ----- Funções para Histórico -----

function carregarHistorico() {
  return JSON.parse(localStorage.getItem('historicoConsumo')) || [];
}

function salvarHistorico(historico) {
  localStorage.setItem('historicoConsumo', JSON.stringify(historico));
}

// Filtrar histórico por mês e ano
function filtrarPorMesAno(historico, mesAno) {
  if (!mesAno) return historico;

  const [ano, mes] = mesAno.split('-').map(Number);
  return historico.filter(item => {
    const data = new Date(item.data);
    return data.getFullYear() === ano && (data.getMonth() + 1) === mes;
  });
}

// ----- Código para index.html -----

function rodarIndex() {
  const form = document.getElementById('form');
  const regiaoSelect = document.getElementById('regiao');
  const distribuidoraSelect = document.getElementById('distribuidora');
  const bandeiraSelect = document.getElementById('bandeira');
  const anteriorInput = document.getElementById('anterior');
  const atualInput = document.getElementById('atual');
  const btnCalcular = document.getElementById('btnCalcular');
  const resultadoDiv = document.getElementById('resultado');

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

  let distribuidorasData = {};
  let precoKwh = 0;

  // Carregar JSON com distribuidoras
  async function carregarDistribuidoras() {
    try {
      const res = await fetch('distribuidoras.json');
      distribuidorasData = await res.json();
    } catch (e) {
      alert('Erro ao carregar dados das distribuidoras.');
    }
  }

  // Preencher distribuidoras com base na região
  function preencherDistribuidoras(regiao) {
    distribuidoraSelect.innerHTML =
      `<option value="" disabled selected>-- Escolha a distribuidora --</option>`;

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

  // Validar campos com base na interação
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

  // Atualizar botão calcular
  function atualizarBotao() {
    const camposPreenchidos = regiaoSelect.value && distribuidoraSelect.value &&
      bandeiraSelect.value && anteriorInput.value && atualInput.value;

    btnCalcular.disabled = !(camposPreenchidos && precoKwh > 0 && validarCampo());
  }

  // Eventos
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

  // Botões adicionais para navegação
  const navContainer = document.createElement('div');
  navContainer.style.margin = '1em 0';
  navContainer.innerHTML = `
    <button id="btnHistorico" type="button">Histórico de Consumo</button>
    <button id="btnDashboard" type="button" style="margin-left:1em;">Dashboard</button>
  `;
  form.parentNode.insertBefore(navContainer, form);

  document.getElementById('btnHistorico').addEventListener('click', () => {
    window.location.href = 'historico.html';
  });
  document.getElementById('btnDashboard').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  // Submissão do formulário
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

    // Confirmar se quer salvar no histórico
    if (confirm(`Valor estimado da conta: R$ ${total.toFixed(2)}\n\nDeseja armazenar este resultado no histórico?`)) {
      // Salvar
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

  (async function init() {
    await carregarDistribuidoras();
    preencherDistribuidoras('');
    atualizarBotao();
  })();
}

// ----- Código para historico.html -----

function rodarHistorico() {
  const historicoList = document.getElementById('historicoList');
  if (!historicoList) return;

  // Criar filtro por mês
  const filtroContainer = document.createElement('div');
  filtroContainer.style.margin = '1em 0';
  filtroContainer.innerHTML = `
    <label for="filtroMes">Filtrar por mês: </label>
    <input type="month" id="filtroMes" aria-label="Filtro por mês" />
    <button id="btnLimparFiltro">Limpar filtro</button>
    <button id="btnLimparHistorico" style="margin-left: 2em; color: red;">Limpar histórico</button>
    <button id="btnVoltar" style="margin-left: 2em;">Voltar</button>
  `;

  historicoList.parentNode.insertBefore(filtroContainer, historicoList);

  const filtroMesInput = document.getElementById('filtroMes');
  const btnLimparFiltro = document.getElementById('btnLimparFiltro');
  const btnLimparHistorico = document.getElementById('btnLimparHistorico');
  const btnVoltar = document.getElementById('btnVoltar');

  btnVoltar.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  function exibirHistorico(filtrado) {
    historicoList.innerHTML = '';

    if (filtrado.length === 0) {
      historicoList.innerHTML = '<li>Nenhum registro encontrado.</li>';
      return;
    }

    filtrado.forEach(item => {
      const li = document.createElement('li');
      const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      li.innerHTML = `
        <strong>Data:</strong> ${dataFormatada}<br>
        <strong>Leitura Atual:</strong> ${item.leituraAtual.toFixed(2)} kWh<br>
        <strong>Consumo:</strong> ${item.consumo.toFixed(2)} kWh<br>
        <strong>Valor:</strong> R$ ${item.valor.toFixed(2)}
      `;

      historicoList.appendChild(li);
    });
  }

  filtroMesInput.addEventListener('change', () => {
    const historico = carregarHistorico();
    const filtrado = filtrarPorMesAno(historico, filtroMesInput.value);
    exibirHistorico(filtrado);
  });

  btnLimparFiltro.addEventListener('click', () => {
    filtroMesInput.value = '';
    exibirHistorico(carregarHistorico());
  });

  btnLimparHistorico.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar todo o histórico? Essa ação não pode ser desfeita.')) {
      localStorage.removeItem('historicoConsumo');
      exibirHistorico([]);
    }
  });

  // Mostrar histórico inicial
  exibirHistorico(carregarHistorico());
}

// ----- Código para dashboard.html (Chart.js) -----

function rodarDashboard() {
  const ctx = document.getElementById('myChart');
  if (!ctx) return;

  // Pega dados do localStorage
  const historico = carregarHistorico();

  // Agrupa consumo por mês/ano
  const consumoPorMes = {};

  historico.forEach(item => {
    const data = new Date(item.data);
    const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;

    if (!consumoPorMes[mesAno]) {
      consumoPorMes[mesAno] = 0;
    }
    consumoPorMes[mesAno] += item.consumo;
  });

  // Ordena os meses
  const meses = Object.keys(consumoPorMes).sort();

  // Dados para gráfico
  const dados = meses.map(mes => consumoPorMes[mes]);

  // Configuração do Chart.js
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [{
        label: 'Consumo (kWh)',
        data: dados,
        backgroundColor: 'rgba(30, 144, 255, 0.7)',
        borderColor: 'rgba(30, 144, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Consumo (kWh)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Mês/Ano'
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });

  // Botão para voltar
  const btnVoltar = document.getElementById('btnVoltarDashboard');
  if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
}

// ----- Detectar página e rodar o código específico -----

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('form')) {
    rodarIndex();
  } else if (document.getElementById('historicoList')) {
    rodarHistorico();
  } else if (document.getElementById('myChart')) {
    rodarDashboard();
  }
});

