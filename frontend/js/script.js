// Dados de alimentação
// Remove acentos para chave consistente (Marte, Venus)
function normalizeNome(nome) {
    return nome.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

let dadosAlimentacao = {
    Marte: [],
    Venus: []
};

// Configuração do gráfico combinado (gramas + calorias)
const ctxCombinado = document.getElementById('graficoCombinado').getContext('2d');
const graficoCombinado = new Chart(ctxCombinado, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            // Marte - gramas (eixo yGramas)
            {
                label: 'Marte (g)',
                data: [],
                borderColor: '#8f6cbb',
                backgroundColor: 'rgba(143, 108, 187, 0.12)',
                tension: 0.1,
                borderWidth: 2.8,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: 'yGramas'
            },
            // Marte - kcal (eixo yCalorias)
            {
                label: 'Marte (kcal)',
                data: [],
                borderColor: '#8f6cbb',
                backgroundColor: 'rgba(143, 108, 187, 0.06)',
                tension: 0.1,
                borderWidth: 1.8,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderDash: [6, 4],
                yAxisID: 'yCalorias'
            },
            // Vênus - gramas
            {
                label: 'Vênus (g)',
                data: [],
                borderColor: '#FF9FB2',
                backgroundColor: 'rgba(255, 159, 178, 0.12)',
                tension: 0.1,
                borderWidth: 2.8,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: 'yGramas'
            },
            // Vênus - kcal
            {
                label: 'Vênus (kcal)',
                data: [],
                borderColor: '#FF9FB2',
                backgroundColor: 'rgba(255, 159, 178, 0.06)',
                tension: 0.1,
                borderWidth: 1.8,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderDash: [6, 4],
                yAxisID: 'yCalorias'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            title: {
                display: true,
                text: 'Histórico de Alimentação — Gramas e Calorias'
            },
            tooltip: {
                // mostramos apenas uma linha por gata, juntando g + kcal
                filter: function(tooltipItem) {
                    // só considerar os datasets de gramas no tooltip (os de kcal serão combinados)
                    return tooltipItem.dataset.label && tooltipItem.dataset.label.includes('(g)');
                },
                callbacks: {
                    label: function(context) {
                        const datasetLabel = context.dataset.label || '';
                        // datasetLabel ex: 'Marte (g)'
                        const gato = datasetLabel.split(' ')[0];
                        const gValor = context.parsed.y;
                        // procura o dataset de kcal correspondente
                        const datasets = context.chart.data.datasets;
                        const kcalDataset = datasets.find(d => d.label === `${gato} (kcal)`);
                        const kcalValor = kcalDataset ? kcalDataset.data[context.dataIndex] : null;
                        const gText = (gValor === null || gValor === undefined) ? '-' : `${gValor} g`;
                        const kcalText = (kcalValor === null || kcalValor === undefined) ? '-' : `${kcalValor} kcal`;
                        return `${gato}: ${gText} / ${kcalText}`;
                    }
                }
            }
        },
        scales: {
            yGramas: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Gramas' }
            },
            yCalorias: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                title: { display: true, text: 'Calorias (kcal)' },
                grid: { drawOnChartArea: false }
            },
            x: {
                title: { display: true, text: 'Data' }
            }
        }
    }
});

// Carrega dados do servidor
async function carregarDados() {
    try {
        const response = await fetch('/api/alimentacao');
        const dados = await response.json();
        
        // Reinicializa os dados
        dadosAlimentacao = {
            Marte: [],
            Venus: []
        };

        // Organiza os dados por gata (normalizando nomes)
        dados.forEach(registro => {
            const chave = normalizeNome(registro.gata);
            if (!dadosAlimentacao[chave]) dadosAlimentacao[chave] = [];
            dadosAlimentacao[chave].push({
                data: new Date(registro.data).toLocaleDateString('pt-BR'),
                racao: registro.racao,
                quantidade: registro.quantidade,
                kcalTotal: registro.kcalTotal,
                tipo: registro.tipo || 'seca',
                molhadaTipo: registro.molhadaTipo || null
            });
        });

        atualizarGrafico();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para mostrar mensagem
function mostrarMensagem(texto, tipo) {
    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = texto;
    mensagemDiv.className = `mensagem ${tipo}`;
    
    // Remove a mensagem após 3 segundos
    setTimeout(() => {
        mensagemDiv.className = 'mensagem';
        mensagemDiv.textContent = '';
    }, 3000);
}

// Salva dados no servidor
async function salvarDados(novoRegistro) {
    try {
        const response = await fetch('/api/alimentacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(novoRegistro)
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar dados');
        }

        // Mostra mensagem de sucesso
        mostrarMensagem('Registro salvo com sucesso!', 'sucesso');

        // Recarrega os dados após salvar
        await carregarDados();
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        mostrarMensagem('Erro ao salvar o registro. Tente novamente.', 'erro');
    }
}

// Função para calcular médias da última semana
function calcularMediasUltimaSemana() {
    const hoje = new Date();
    const umaSemanaAtras = new Date(hoje);
    umaSemanaAtras.setDate(hoje.getDate() - 7);

    for (const gata of ['Marte', 'Venus']) {
        const registrosUltimaSemana = dadosAlimentacao[gata].filter(registro => {
            const dataRegistro = new Date(registro.data.split('/').reverse().join('-'));
            // considerar apenas ração seca nas médias exibidas (molhada é separada)
            return dataRegistro >= umaSemanaAtras && dataRegistro <= hoje && (registro.tipo || 'seca') !== 'molhada';
        });

        const mediaGramas = registrosUltimaSemana.length > 0
            ? registrosUltimaSemana.reduce((sum, registro) => sum + registro.quantidade, 0) / registrosUltimaSemana.length
            : 0;

        const mediaCalorias = registrosUltimaSemana.length > 0
            ? registrosUltimaSemana.reduce((sum, registro) => sum + registro.kcalTotal, 0) / registrosUltimaSemana.length
            : 0;

        document.getElementById(`mediaGramas${gata}`).textContent = mediaGramas.toFixed(1);
        document.getElementById(`mediaCalorias${gata}`).textContent = mediaCalorias.toFixed(1);
    }
}

// Calcula médias para 30 dias (mensal) e 90 dias (últimos 3 meses)
function calcularMediasPeriodos() {
    const hoje = new Date();
    const dias30 = new Date(hoje);
    dias30.setDate(hoje.getDate() - 30);
    const dias90 = new Date(hoje);
    dias90.setDate(hoje.getDate() - 90);

    for (const gata of ['Marte', 'Venus']) {
        const registros = dadosAlimentacao[gata] || [];

        const registros30 = registros.filter(registro => {
            const dataRegistro = new Date(registro.data.split('/').reverse().join('-'));
            return dataRegistro >= dias30 && dataRegistro <= hoje && (registro.tipo || 'seca') !== 'molhada';
        });

        const registros90 = registros.filter(registro => {
            const dataRegistro = new Date(registro.data.split('/').reverse().join('-'));
            return dataRegistro >= dias90 && dataRegistro <= hoje && (registro.tipo || 'seca') !== 'molhada';
        });

        const mediaMensalGramas = registros30.length > 0 ? registros30.reduce((s, r) => s + r.quantidade, 0) / registros30.length : 0;
        const mediaMensalCal = registros30.length > 0 ? registros30.reduce((s, r) => s + r.kcalTotal, 0) / registros30.length : 0;

        const media3mesesGramas = registros90.length > 0 ? registros90.reduce((s, r) => s + r.quantidade, 0) / registros90.length : 0;
        const media3mesesCal = registros90.length > 0 ? registros90.reduce((s, r) => s + r.kcalTotal, 0) / registros90.length : 0;

        // Atualiza DOM (IDs seguem o padrão criado no HTML)
        const key = gata; // 'Marte' ou 'Venus'
        document.getElementById(`mediaMensalGramas${key}`).textContent = mediaMensalGramas.toFixed(1);
        document.getElementById(`mediaMensalCalorias${key}`).textContent = mediaMensalCal.toFixed(1);
        document.getElementById(`media3mesesGramas${key}`).textContent = media3mesesGramas.toFixed(1);
        document.getElementById(`media3mesesCalorias${key}`).textContent = media3mesesCal.toFixed(1);
    }
}

// Atualiza os gráficos com os dados mais recentes
function atualizarGrafico() {
    const todasDatas = new Set();
    
    // Coleta todas as datas únicas
    for (const gata in dadosAlimentacao) {
        dadosAlimentacao[gata].forEach(registro => {
            todasDatas.add(registro.data);
        });
    }

    // Converte para array e ordena cronologicamente (do mais antigo para o mais recente)
    const datasArray = Array.from(todasDatas);
    // cada data está no formato 'DD/MM/YYYY' (como definido ao popular os dados)
    const datasOrdenadas = datasArray
        .map(label => {
            const [dia, mes, ano] = label.split('/');
            const dateObj = new Date(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
            return { label, dateObj };
        })
        .sort((a, b) => a.dateObj - b.dateObj)
        .map(x => x.label);

    // Atualiza os dados do gráfico combinado
    graficoCombinado.data.labels = datasOrdenadas;

    // Função auxiliar: soma registros por data (retorna null se não houver registros)
    const sumarizePorData = (registros, data) => {
        // Somente considerar registros de ração seca para o gráfico combinado (molhada é separada)
        const itens = (registros || []).filter(r => r.data === data && (r.tipo || 'seca') !== 'molhada');
        if (itens.length === 0) return null;
        return {
            gramas: itens.reduce((s, i) => s + (Number(i.quantidade) || 0), 0),
            kcal: itens.reduce((s, i) => s + (Number(i.kcalTotal) || 0), 0)
        };
    };

    // Soma de kcal incluindo registros molhados e secos (para impactar o eixo de calorias)
    const sumarizeKcalAllPorData = (registros, data) => {
        const itens = (registros || []).filter(r => r.data === data);
        if (itens.length === 0) return null;
        return itens.reduce((s, i) => s + (Number(i.kcalTotal) || 0), 0);
    };

    const marteGramas = datasOrdenadas.map(data => {
        const s = sumarizePorData(dadosAlimentacao['Marte'], data);
        return s ? s.gramas : null;
    });
    // Calorias: incluir tanto seca quanto molhada
    const marteKcal = datasOrdenadas.map(data => {
        const s = sumarizeKcalAllPorData(dadosAlimentacao['Marte'], data);
        return s !== null ? s : null;
    });
    const venusGramas = datasOrdenadas.map(data => {
        const s = sumarizePorData(dadosAlimentacao['Venus'], data);
        return s ? s.gramas : null;
    });
    const venusKcal = datasOrdenadas.map(data => {
        const s = sumarizeKcalAllPorData(dadosAlimentacao['Venus'], data);
        return s !== null ? s : null;
    });

    graficoCombinado.data.datasets[0].data = marteGramas;
    graficoCombinado.data.datasets[1].data = marteKcal;
    graficoCombinado.data.datasets[2].data = venusGramas;
    graficoCombinado.data.datasets[3].data = venusKcal;

    // DEBUG: mostrar arrays usadas no gráfico para inspeção no console do navegador
    try {
        console.log('DEBUG grafico - labels:', datasOrdenadas);
        console.log('DEBUG grafico - marteGramas:', marteGramas);
        console.log('DEBUG grafico - marteKcal:', marteKcal);
        console.log('DEBUG grafico - venusGramas:', venusGramas);
        console.log('DEBUG grafico - venusKcal:', venusKcal);
    } catch (e) {
        // noop
    }

    graficoCombinado.update();

    // Atualiza as médias da última semana e dos períodos
    calcularMediasUltimaSemana();
    calcularMediasPeriodos();
}

// Manipula o envio do formulário
document.getElementById('alimentacaoForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const gata = document.getElementById('gata').value;
    const tipoAlimento = document.getElementById('tipoAlimento').value; // 'seca' or 'molhada'
    const racaoSelect = document.getElementById('racao');
    let racao = racaoSelect.value;
    const kcalPorKg = parseFloat(racaoSelect.options[racaoSelect.selectedIndex].dataset.kcal);
    const quantidade = parseFloat(document.getElementById('quantidade').value);
    const dataInput = document.getElementById('data').value;

    let kcalTotal = 0;
    let molhadaTipo = null;
    if (tipoAlimento === 'molhada') {
        // usar kcal por 100g do select molhada
        const molhadaSelect = document.getElementById('racaoMolhada');
        molhadaTipo = molhadaSelect.value;
        // quando for molhada, use o nome do sachê como 'racao' também
        racao = molhadaTipo;
        const kcalPer100 = parseFloat(molhadaSelect.options[molhadaSelect.selectedIndex].dataset.kcalPer100 || molhadaSelect.options[molhadaSelect.selectedIndex].dataset.kcalPer100 || molhadaSelect.options[molhadaSelect.selectedIndex].dataset.kcalPer100);
        // fallback: se não tiver dataset, assume 0
        const kcal100 = isNaN(kcalPer100) ? 0 : kcalPer100;
        kcalTotal = (quantidade / 100) * kcal100;
    } else {
        // seca: kcal por kg
        kcalTotal = (quantidade / 1000) * kcalPorKg;
    }

    // Cria o novo registro
    const novoRegistro = {
        gata,
        data: dataInput,
        racao,
        quantidade,
        kcalTotal,
        tipo: tipoAlimento,
        molhadaTipo
    };

    // Salva no servidor
    await salvarDados(novoRegistro);

    // Limpa o formulário
    this.reset();
});

// Mostrar/ocultar select de ração molhada conforme tipo escolhido
const tipoSelect = document.getElementById('tipoAlimento');
if (tipoSelect) {
    tipoSelect.addEventListener('change', (e) => {
        const group = document.getElementById('molhadaGroup');
        const secaGroup = document.getElementById('secaGroup');
        if (!group) return;
        if (e.target.value === 'molhada') {
            group.style.display = '';
            if (secaGroup) secaGroup.style.display = 'none';
            // ajustar required
            const molhadaSelect = document.getElementById('racaoMolhada');
            const secaSelect = document.getElementById('racao');
            if (molhadaSelect) molhadaSelect.required = true;
            if (secaSelect) secaSelect.required = false;
        } else {
            group.style.display = 'none';
            if (secaGroup) secaGroup.style.display = '';
            // ajustar required
            const molhadaSelect = document.getElementById('racaoMolhada');
            const secaSelect = document.getElementById('racao');
            if (molhadaSelect) molhadaSelect.required = false;
            if (secaSelect) secaSelect.required = true;
        }
    });
}

// Carrega dados ao iniciar a página
carregarDados();