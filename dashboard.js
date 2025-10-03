document.addEventListener('DOMContentLoaded', () => {
  const filtroAno = document.getElementById('filtroAno');
  const filtroMes = document.getElementById('filtroMes');
  const btnLimparFiltroDash = document.getElementById('btnLimparFiltroDash');
  const resumoTabela = document.getElementById('resumoTabela');
  const btnVoltarSimulador = document.getElementById('btnVoltarSimulador');
  const btnIrHistorico = document.getElementById('btnIrHistorico');

  const ctxConsumoMesAno = document.getElementById('graficoConsumoMesAno').getContext('2d');
  const ctxValorMesAno = document.getElementById('graficoValorMesAno').getContext('2d');
  const ctxConsumoMesesAnos = document.getElementById('graficoConsumoMesesAnos').getContext('2d');

  let graficoConsumoMesAno = null;
  let graficoValorMesAno = null;
  let graficoConsumoMesesAnos = null;

  function carregarHistorico() {
    const dados = localStorage.getItem('historicoConsumo');
    return dados ? JSON.parse(dados) : [];
  }

  function formatarDataISO(dataISO) {
    const d = new Date(dataISO);
    return d.toLocaleDateString('pt-BR');
  }

  function filtrarPorAno(historico, anoFiltro) {
    if (!anoFiltro || anoFiltro === 'todos') return historico;
    return historico.filter(item => {
      const d = new Date(item.data);
      return d.getFullYear().toString() === anoFiltro;
    });
  }

  function filtrarPorMes(historico, mesFiltro) {
    if (!mesFiltro || mesFiltro === 'todos') return historico;
    return historico.filter(item => {
      const d = new Date(item.data);
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      return mes === mesFiltro;
    });
  }

  // Agrupa dados por mês no ano para consumo ou valor
  // Retorna objeto { mes (01-12): { consumo: total, valor: total } }
  function agruparPorMes(historico) {
    const agrupado = {};
    historico.forEach(item => {
      const d = new Date(item.data);
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      if (!agrupado[mes]) agrupado[mes] = { consumo: 0, valor: 0 };
      agrupado[mes].consumo += item.consumo;
      agrupado[mes].valor += item.valor;
    });
    return agrupado;
  }

  // Agrupa dados por ano para o mesmo mês (ex: comparar consumo do mes 05 entre anos)
  // Retorna objeto { ano: { consumo, valor } }
  function agruparPorAnoMes(historico, mesFiltro) {
    const agrupado = {};
    historico.forEach(item => {
      const d = new Date(item.data);
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      if (mes !== mesFiltro) return;
      const ano = d.getFullYear();
      if (!agrupado[ano]) agrupado[ano] = { consumo: 0, valor: 0 };
      agrupado[ano].consumo += item.consumo;
      agrupado[ano].valor += item.valor;
    });
    return agrupado;
  }

  // Atualiza tabela resumo com dados filtrados
  function atualizarTabela(dados) {
    if (!resumoTabela) return;
    if (dados.length === 0) {
      resumoTabela.innerHTML = `
        <tr>
          <td colspan="3" class="sem-registros">Nenhum dado para mostrar.</td>
        </tr>
      `;
      return;
    }
    resumoTabela.innerHTML = dados.map(item => `
      <tr>
        <td>${formatarDataISO(item.data)}</td>
        <td>${item.consumo.toFixed(2)}</td>
        <td>R$ ${item.valor.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  // Atualiza gráfico consumo por mês no ano selecionado
  function atualizarGraficoConsumoMesAno(historico, ano) {
    const dadosFiltrados = filtrarPorAno(historico, ano);
    const agrupado = agruparPorMes(dadosFiltrados);

    const labels = [];
    const consumos = [];
    for (let m = 1; m <= 12; m++) {
      const mesStr = m.toString().padStart(2, '0');
      labels.push(mesStr + ' - ' + mesesNome[m - 1]);
      consumos.push(agrupado[mesStr]?.consumo || 0);
    }

    const cor = '#3a7ca5';
    const grad = ctxConsumoMesAno.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(58,124,165,0.9)');
    grad.addColorStop(1, 'rgba(58,124,165,0.3)');

    if (graficoConsumoMesAno) {
      graficoConsumoMesAno.data.labels = labels;
      graficoConsumoMesAno.data.datasets[0].data = consumos;
      graficoConsumoMesAno.update();
    } else {
      graficoConsumoMesAno = new Chart(ctxConsumoMesAno, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Consumo (kWh)',
            data: consumos,
            backgroundColor: grad,
            borderColor: cor,
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Consumo Mensal no Ano ${ano === 'todos' ? '' : ano}`,
              font: { size: 16, weight: '600' }
            },
            tooltip: {
              callbacks: {
                label: ctx => `Consumo: ${ctx.parsed.y.toFixed(2)} kWh`
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Mês' }, grid: { display: false } },
            y: { beginAtZero: true, title: { display: true, text: 'kWh' } }
          }
        }
      });
    }
  }

  // Atualiza gráfico valor gasto por mês no ano selecionado
  function atualizarGraficoValorMesAno(historico, ano) {
    const dadosFiltrados = filtrarPorAno(historico, ano);
    const agrupado = agruparPorMes(dadosFiltrados);

    const labels = [];
    const valores = [];
    for (let m = 1; m <= 12; m++) {
      const mesStr = m.toString().padStart(2, '0');
      labels.push(mesStr + ' - ' + mesesNome[m - 1]);
      valores.push(agrupado[mesStr]?.valor || 0);
    }

    const cor = '#e07b39';
    const grad = ctxValorMesAno.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(224,123,57,0.9)');
    grad.addColorStop(1, 'rgba(224,123,57,0.3)');

    if (graficoValorMesAno) {
      graficoValorMesAno.data.labels = labels;
      graficoValorMesAno.data.datasets[0].data = valores;
      graficoValorMesAno.update();
    } else {
      graficoValorMesAno = new Chart(ctxValorMesAno, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Valor (R$)',
            data: valores,
            backgroundColor: grad,
            borderColor: cor,
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Valor Gasto Mensal no Ano ${ano === 'todos' ? '' : ano}`,
              font: { size: 16, weight: '600' }
            },
            tooltip: {
              callbacks: {
                label: ctx => `R$ ${ctx.parsed.y.toFixed(2)}`
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Mês' }, grid: { display: false } },
            y: { beginAtZero: true, title: { display: true, text: 'R$' } }
          }
        }
      });
    }
  }

  // Atualiza gráfico consumo do mês selecionado comparado entre anos
  function atualizarGraficoConsumoMesesAnos(historico, mes) {
    const dadosFiltrados = filtrarPorMes(historico, mes);
    const agrupado = agruparPorAnoMes(dadosFiltrados, mes);

    const anos = Object.keys(agrupado).sort();
    const consumos = anos.map(ano => agrupado[ano].consumo);

    if (anos.length === 0) {
      // Sem dados, limpar gráfico se existir
      if (graficoConsumoMesesAnos) {
        graficoConsumoMesesAnos.data.labels = [];
        graficoConsumoMesesAnos.data.datasets[0].data = [];
        graficoConsumoMesesAnos.update();
      }
      return;
    }

    const cor = '#3a7ca5';
    const grad = ctxConsumoMesesAnos.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(58,124,165,0.9)');
    grad.addColorStop(1, 'rgba(58,124,165,0.3)');

    if (graficoConsumoMesesAnos) {
      graficoConsumoMesesAnos.data.labels = anos;
      graficoConsumoMesesAnos.data.datasets[0].data = consumos;
      graficoConsumoMesesAnos.update();
    } else {
      graficoConsumoMesesAnos = new Chart(ctxConsumoMesesAnos, {
        type: 'line',
        data: {
          labels: anos,
          datasets: [{
            label: `Consumo no Mês ${mes} por Ano`,
            data: consumos,
            backgroundColor: grad,
            borderColor: cor,
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: cor,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Consumo no Mês ${mesesNome[parseInt(mes) - 1]} Comparado Entre Anos`,
              font: { size: 16, weight: '600' }
            },
            tooltip: {
              callbacks: {
                label: ctx => `Consumo: ${ctx.parsed.y.toFixed(2)} kWh`
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Ano' }, grid: { display: false } },
            y: { beginAtZero: true, title: { display: true, text: 'kWh' } }
          }
        }
      });
    }
  }

  // Lista nomes dos meses
  const mesesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Inicializa filtro ano
  function inicializarFiltroAno() {
    const historico = carregarHistorico();
    const anosSet = new Set();
    historico.forEach(item => {
      anosSet.add(new Date(item.data).getFullYear());
    });

    filtroAno.innerHTML = '<option value="todos">Todos os anos</option>';
    Array.from(anosSet).sort().forEach(ano => {
      const opt = document.createElement('option');
      opt.value = ano;
      opt.textContent = ano;
      filtroAno.appendChild(opt);
    });
  }

  // Inicializa filtro mês
  function inicializarFiltroMes() {
    filtroMes.innerHTML = '<option value="todos">Todos os meses</option>';
    mesesNome.forEach((mes, i) => {
      const num = String(i + 1).padStart(2, '0');
      const opt = document.createElement('option');
      opt.value = num;
      opt.textContent = mes;
      filtroMes.appendChild(opt);
    });
  }

  // Atualiza todos os gráficos e tabela conforme filtros
  function atualizarDashboard() {
    const anoSelecionado = filtroAno.value;
    const mesSelecionado = filtroMes.value;
    const historico = carregarHistorico();

    // Para tabela: filtrar por ano e mes
    let dadosTabela = historico;
    if (anoSelecionado !== 'todos') {
      dadosTabela = filtrarPorAno(dadosTabela, anoSelecionado);
    }
    if (mesSelecionado !== 'todos') {
      dadosTabela = filtrarPorMes(dadosTabela, mesSelecionado);
    }
    atualizarTabela(dadosTabela);

    // Atualiza gráficos
    atualizarGraficoConsumoMesAno(historico, anoSelecionado);
    atualizarGraficoValorMesAno(historico, anoSelecionado);
    atualizarGraficoConsumoMesesAnos(historico, mesSelecionado === 'todos' ? '01' : mesSelecionado);
  }

  // Eventos
  filtroAno.addEventListener('change', atualizarDashboard);
  filtroMes.addEventListener('change', atualizarDashboard);
  btnLimparFiltroDash.addEventListener('click', () => {
    filtroAno.value = 'todos';
    filtroMes.value = 'todos';
    atualizarDashboard();
  });

  btnVoltarSimulador.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  btnIrHistorico.addEventListener('click', () => {
    window.location.href = 'historico.html';
  });

  // Inicializa filtros e dashboard
  inicializarFiltroAno();
  inicializarFiltroMes();
  atualizarDashboard();
});
