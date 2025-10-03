document.addEventListener('DOMContentLoaded', () => {
  const filtroMes = document.getElementById('filtroMes');
  const tabelaCorpo = document.getElementById('tabelaCorpo');
  const btnVoltarSimulador = document.getElementById('btnVoltarSimulador');
  const btnIrDashboard = document.getElementById('btnIrDashboard');
  const btnLimparFiltro = document.getElementById('btnLimparFiltro');

  function formatarData(iso) {
    const data = new Date(iso);
    return data.toLocaleDateString('pt-BR');
  }

  function carregarHistorico() {
    return JSON.parse(localStorage.getItem('historicoConsumo') || '[]');
  }

  function salvarHistorico(dados) {
    localStorage.setItem('historicoConsumo', JSON.stringify(dados));
  }

  function exibirHistorico(filtro = 'todos') {
    const historico = carregarHistorico();
    tabelaCorpo.innerHTML = '';

    let registrosFiltrados = historico;

    if (filtro !== 'todos') {
      registrosFiltrados = historico.filter(entry => {
        const data = new Date(entry.data);
        const anoMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        return anoMes === filtro;
      });
    }

    if (registrosFiltrados.length === 0) {
      tabelaCorpo.innerHTML = `
        <tr>
          <td colspan="5" class="sem-registros">Nenhum registro encontrado.</td>
        </tr>`;
      return;
    }

    registrosFiltrados.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatarData(item.data)}</td>
        <td>${item.leituraAtual}</td>
        <td>${item.consumo}</td>
        <td>R$ ${item.valor.toFixed(2)}</td>
        <td>
          <button class="btn-excluir" title="Excluir" data-index="${index}">🗑️</button>
        </td>
      `;
      tabelaCorpo.appendChild(row);
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (confirm('Deseja excluir este registro?')) {
          removerRegistro(index, filtro);
        }
      });
    });
  }

  function removerRegistro(index, filtroAtual) {
    let historico = carregarHistorico();

    const registrosFiltrados = filtroAtual === 'todos' ? historico : historico.filter(entry => {
      const data = new Date(entry.data);
      const anoMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      return anoMes === filtroAtual;
    });

    const itemRemovido = registrosFiltrados[index];

    historico = historico.filter(item => item !== itemRemovido);
    salvarHistorico(historico);

    exibirHistorico(filtroAtual);
  }

  filtroMes.addEventListener('change', () => {
    const filtro = filtroMes.value || 'todos';
    exibirHistorico(filtro);
  });

  btnLimparFiltro.addEventListener('click', () => {
    filtroMes.value = '';
    exibirHistorico('todos');
  });

  btnVoltarSimulador.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  btnIrDashboard.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  exibirHistorico('todos');
});
