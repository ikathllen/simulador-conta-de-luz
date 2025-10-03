// utils.js

// Funções utilitárias

// Carrega histórico do localStorage
function carregarHistorico() {
  return JSON.parse(localStorage.getItem('historicoConsumo')) || [];
}

// Salva histórico no localStorage
function salvarHistorico(historico) {
  localStorage.setItem('historicoConsumo', JSON.stringify(historico));
}

// Filtra histórico por mês e ano (formato 'YYYY-MM')
function filtrarPorMesAno(historico, mesAno) {
  if (!mesAno) return historico;

  const [ano, mes] = mesAno.split('-').map(Number);
  return historico.filter(item => {
    const data = new Date(item.data);
    return data.getFullYear() === ano && (data.getMonth() + 1) === mes;
  });
}

// Exporta funções para serem usadas externamente (se estiver usando modules, se não pode remover)
