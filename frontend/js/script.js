// Dados de alimentação
// Remove acentos para chave consistente (Marte, Venus)
function normalizeNome(nome) {
    return nome.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

let dadosAlimentacao = {
    Marte: [],
    Venus: []
};

// Configuração do gráfico de gramas
const ctxGramas = document.getElementById('graficoAlimentacao').getContext('2d');
const graficoGramas = new Chart(ctxGramas, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Marte',
                data: [],
                borderColor: '#8f6cbb',
                backgroundColor: 'rgba(143, 108, 187, 0.1)',
                tension: 0.1
            },
            {
                label: 'Vênus',
                data: [],
                borderColor: '#FF9FB2',
                backgroundColor: 'rgba(255, 159, 178, 0.1)',
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Histórico de Alimentação (g/dia)'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Gramas'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Data'
                }
            }
        }
    }
});

// Configuração do gráfico de calorias
const ctxCalorias = document.getElementById('graficoCalorias').getContext('2d');
const graficoCalorias = new Chart(ctxCalorias, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Marte',
                data: [],
                borderColor: '#8f6cbb',
                backgroundColor: 'rgba(143, 108, 187, 0.1)',
                tension: 0.1
            },
            {
                label: 'Vênus',
                data: [],
                borderColor: '#FF9FB2',
                backgroundColor: 'rgba(255, 159, 178, 0.1)',
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Histórico de Calorias (kcal/dia)'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Calorias (kcal)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Data'
                }
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
            Vênus: []
        };

        // Organiza os dados por gata (normalizando nomes)
        dados.forEach(registro => {
            const chave = normalizeNome(registro.gata);
            if (!dadosAlimentacao[chave]) dadosAlimentacao[chave] = [];
            dadosAlimentacao[chave].push({
                data: new Date(registro.data).toLocaleDateString('pt-BR'),
                racao: registro.racao,
                quantidade: registro.quantidade,
                kcalTotal: registro.kcalTotal
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

    for (const gata of ['Marte', 'Vênus']) {
        const registrosUltimaSemana = dadosAlimentacao[gata].filter(registro => {
            const dataRegistro = new Date(registro.data.split('/').reverse().join('-'));
            return dataRegistro >= umaSemanaAtras && dataRegistro <= hoje;
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

// Atualiza os gráficos com os dados mais recentes
function atualizarGrafico() {
    const todasDatas = new Set();
    
    // Coleta todas as datas únicas
    for (const gata in dadosAlimentacao) {
        dadosAlimentacao[gata].forEach(registro => {
            todasDatas.add(registro.data);
        });
    }

    // Converte para array e ordena
    const datasOrdenadas = Array.from(todasDatas).sort();

    // Atualiza os dados dos gráficos
    graficoGramas.data.labels = datasOrdenadas;
    graficoCalorias.data.labels = datasOrdenadas;
    
    // Atualiza os dados para cada gata
    ['Marte', 'Vênus'].forEach((gata, index) => {
        const dadosGramas = datasOrdenadas.map(data => {
            const registro = dadosAlimentacao[gata].find(r => r.data === data);
            return registro ? registro.quantidade : null;
        });

        const dadosCalorias = datasOrdenadas.map(data => {
            const registro = dadosAlimentacao[gata].find(r => r.data === data);
            return registro ? registro.kcalTotal : null;
        });

        graficoGramas.data.datasets[index].data = dadosGramas;
        graficoCalorias.data.datasets[index].data = dadosCalorias;
    });

    graficoGramas.update();
    graficoCalorias.update();
    
    // Atualiza as médias da última semana
    calcularMediasUltimaSemana();
}

// Manipula o envio do formulário
document.getElementById('alimentacaoForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const gata = document.getElementById('gata').value;
    const racaoSelect = document.getElementById('racao');
    const racao = racaoSelect.value;
    const kcalPorKg = parseFloat(racaoSelect.options[racaoSelect.selectedIndex].dataset.kcal);
    const quantidade = parseFloat(document.getElementById('quantidade').value);
    const dataInput = document.getElementById('data').value;
    const kcalTotal = (quantidade / 1000) * kcalPorKg;

    // Cria o novo registro
    const novoRegistro = {
        gata,
        data: dataInput,
        racao,
        quantidade,
        kcalTotal
    };

    // Salva no servidor
    await salvarDados(novoRegistro);

    // Limpa o formulário
    this.reset();
});

// Carrega dados ao iniciar a página
carregarDados();