const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = { alunos: [], questoes: [], respostas: [], editingAluno: null, editingQuestao: null };

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
    });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.erro || data?.error || data?.mensagem || 'Não foi possível concluir a operação.');
    return data;
}

function notify(text, type = 'success') {
    const message = $('#message');
    message.textContent = text;
    message.className = `message visible ${type}`;
    window.clearTimeout(notify.timeout);
    notify.timeout = window.setTimeout(() => message.classList.remove('visible'), 4500);
}

function navigate(screen) {
    $$('.screen').forEach((element) => element.classList.toggle('active', element.id === `screen-${screen}`));
    $$('.nav-item').forEach((element) => element.classList.toggle('active', element.dataset.screen === screen));
    const titles = { inicio: 'Visão geral', alunos: 'Gestão de alunos', questoes: 'Banco de questões', respostas: 'Registro de respostas', relatorios: 'Relatórios de erros' };
    $('#pageTitle').textContent = titles[screen] || titles.inicio;
    sessionStorage.setItem('activeScreen', screen);
    if (screen === 'inicio') carregarInicio();
    if (screen === 'alunos') carregarAlunos();
    if (screen === 'questoes') carregarQuestoes();
    if (screen === 'respostas') carregarRespostas();
    if (screen === 'relatorios') carregarRelatorio();
}

$$('[data-screen]').forEach((element) => element.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(element.dataset.screen);
}));

function emptyState(text) {
    return `<div class="empty-message"><span>○</span><p>${escapeHtml(text)}</p></div>`;
}

function alunoCard(aluno) {
    return `<article class="record-card"><div class="record-main"><span class="record-avatar">${escapeHtml((aluno.name || '?').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(aluno.name)}</strong><p>${escapeHtml(aluno.materia)}</p><small>ID #${aluno.id}</small></div></div><div class="record-actions"><button class="small-action" data-edit-aluno="${aluno.id}">Editar</button><button class="small-action danger" data-delete-aluno="${aluno.id}">Excluir</button></div></article>`;
}

async function carregarAlunos(termo = '') {
    try {
        state.alunos = await api(`/alunos${termo ? `?nome=${encodeURIComponent(termo)}` : ''}`);
        $('#alunoCount').textContent = `${state.alunos.length} registro${state.alunos.length === 1 ? '' : 's'}`;
        $('#alunoList').className = 'data-list';
        $('#alunoList').innerHTML = state.alunos.map(alunoCard).join('') || emptyState('Nenum aluno encontrado.');
        atualizarSeletoresAlunos();
        $('#totalAlunos').textContent = (await api('/alunos')).length;
    } catch (error) {
        notify(error.message, 'error');
        $('#alunoList').innerHTML = emptyState('Não foi possível carregar os alunos.');
    }
}

function atualizarSeletoresAlunos() {
    const selects = [$('#respostaAluno'), $('#historicoAluno'), $('#relatorioAluno')];
    selects.forEach((select) => {
        const current = select.value;
        const allOption = select.id === 'respostaAluno' ? '<option value="">Selecione um aluno</option>' : '<option value="">Todos os alunos</option>';
        select.innerHTML = allOption + state.alunos.map(aluno => `<option value="${aluno.id}">${escapeHtml(aluno.name)} (#${aluno.id})</option>`).join('');
        if ([...select.options].some(option => option.value === current)) select.value = current;
    });
}

$('#alunoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const dados = { name: $('#alunoNome').value.trim(), materia: $('#alunoMateria').value.trim() };
    try {
        if (state.editingAluno) {
            await api(`/alunos/${state.editingAluno}`, { method: 'PUT', body: JSON.stringify(dados) });
            notify('Aluno atualizado com sucesso.');
        } else {
            await api('/alunos', { method: 'POST', body: JSON.stringify(dados) });
            notify('Aluno cadastrado com sucesso.');
        }
        limparFormAluno();
        await carregarAlunos($('#alunoSearch').value.trim());
        await carregarInicio();
    } catch (error) {
        notify(error.message, 'error');
    }
});

function limparFormAluno() {
    state.editingAluno = null;
    $('#alunoForm').reset();
    $('#alunoId').value = '';
    $('#alunoFormTitle').textContent = 'Cadastrar aluno';
    $('#alunoSubmit').textContent = 'Cadastrar aluno';
    $('#cancelAluno').classList.add('hidden');
}

$('#cancelAluno').addEventListener('click', limparFormAluno);
$('#alunoSearchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = $('#alunoSearchId').value.trim();
    if (id) {
        try {
            const aluno = await api(`/alunos/${encodeURIComponent(id)}`);
            state.alunos = [aluno];
            $('#alunoCount').textContent = '1 registro';
            $('#alunoList').className = 'data-list';
            $('#alunoList').innerHTML = alunoCard(aluno);
        } catch (error) {
            state.alunos = [];
            $('#alunoCount').textContent = '0 registros';
            $('#alunoList').innerHTML = emptyState(error.message);
        }
        return;
    }
    carregarAlunos($('#alunoSearch').value.trim());
});
$('#clearAlunoSearch').addEventListener('click', () => {
    $('#alunoSearch').value = '';
    $('#alunoSearchId').value = '';
    carregarAlunos();
});

$('#alunoList').addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-aluno]');
    const deleteButton = event.target.closest('[data-delete-aluno]');
    if (editButton) {
        const aluno = state.alunos.find(item => item.id === Number(editButton.dataset.editAluno));
        if (!aluno) return;
        state.editingAluno = aluno.id;
        $('#alunoNome').value = aluno.name;
        $('#alunoMateria').value = aluno.materia;
        $('#alunoFormTitle').textContent = 'Editar aluno';
        $('#alunoSubmit').textContent = 'Salvar alterações';
        $('#cancelAluno').classList.add('hidden');
        $('#alunoNome').focus();
    }
    if (deleteButton) {
        if (!confirm('Deseja realmente excluir este aluno? O histórico de respostas dele também será removido.')) return;
        try {
            await api(`/alunos/${deleteButton.dataset.deleteAluno}`, { method: 'DELETE' });
            notify('Aluno excluído com sucesso.');
            await carregarAlunos($('#alunoSearch').value.trim());
            await carregarInicio();
        } catch (error) {
            notify(error.message, 'error');
        }
    }
});

function questaoCard(questao) {
    return `<article class="record-card question-card"><div class="question-badge">Q${questao.id}</div><div class="question-content"><div class="question-meta"><span class="subject-chip">${escapeHtml(questao.materia)}</span></div><strong>${escapeHtml(questao.enunciado)}</strong><p>Alternativa correta: <b>${escapeHtml(questao.alternativa_correta)}</b></p>${questao.resposta ? `<small>${escapeHtml(questao.resposta)}</small>` : ''}<div class="record-actions"><button class="small-action" data-edit-questao="${questao.id}">Editar</button><button class="small-action danger" data-delete-questao="${questao.id}">Excluir</button></div></div></article>`;
}

async function carregarQuestoes(termo = '', materia = '') {
    try {
        const params = new URLSearchParams();
        if (termo) params.set('busca', termo);
        if (materia) params.set('materia', materia);
        state.questoes = await api(`/questoes${params.size ? `?${params.toString()}` : ''}`);
        $('#questaoCount').textContent = `${state.questoes.length} questão${state.questoes.length === 1 ? '' : 'ões'}`;
        $('#questaoList').className = 'data-list';
        $('#questaoList').innerHTML = state.questoes.map(questaoCard).join('') || emptyState('Nenhuma questão encontrada.');
        atualizarSeletoresQuestoes();
        $('#totalQuestoes').textContent = (await api('/questoes')).length;
    } catch (error) {
        notify(error.message, 'error');
        $('#questaoList').innerHTML = emptyState('Não foi possível carregar as questões.');
    }
}

function atualizarSeletoresQuestoes() {
    const select = $('#respostaQuestao');
    const current = select.value;
    select.innerHTML = '<option value="">Selecione uma questão</option>' + state.questoes.map(questao => `<option value="${questao.id}">#${questao.id} · ${escapeHtml(questao.materia)} — ${escapeHtml(questao.enunciado.slice(0, 70))}</option>`).join('');
    if ([...select.options].some(option => option.value === current)) select.value = current;
}

$('#questaoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const dados = {
        enunciado: $('#questaoEnunciado').value.trim(),
        materia: $('#questaoMateria').value.trim(),
        alternativa_correta: $('#questaoAlternativa').value.trim(),
        resposta: $('#questaoExplicacao').value.trim()
    };
    try {
        if (state.editingQuestao) {
            await api(`/questoes/${state.editingQuestao}`, { method: 'PUT', body: JSON.stringify(dados) });
            notify('Questão atualizada com sucesso.');
        } else {
            await api('/questoes', { method: 'POST', body: JSON.stringify(dados) });
            notify('Questão cadastrada com sucesso.');
        }
        limparFormQuestao();
        await carregarQuestoes($('#questaoSearch').value.trim(), $('#materiaSearch').value.trim());
        await carregarInicio();
    } catch (error) {
        notify(error.message, 'error');
    }
});

function limparFormQuestao() {
    state.editingQuestao = null;
    $('#questaoForm').reset();
    $('#questaoFormTitle').textContent = 'Cadastrar questão';
    $('#questaoSubmit').textContent = 'Cadastrar questão';
    $('#cancelQuestao').classList.add('hidden');
}

$('#cancelQuestao').addEventListener('click', limparFormQuestao);
$('#questaoSearchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = $('#questaoSearchId').value.trim();
    if (id) {
        try {
            const questao = await api(`/questoes/${encodeURIComponent(id)}`);
            state.questoes = [questao];
            $('#questaoCount').textContent = '1 questão';
            $('#questaoList').className = 'data-list';
            $('#questaoList').innerHTML = questaoCard(questao);
            atualizarSeletoresQuestoes();
        } catch (error) {
            state.questoes = [];
            $('#questaoCount').textContent = '0 questões';
            $('#questaoList').innerHTML = emptyState(error.message);
        }
        return;
    }
    carregarQuestoes($('#questaoSearch').value.trim(), $('#materiaSearch').value.trim());
});
$('#clearQuestaoSearch').addEventListener('click', () => {
    $('#questaoSearch').value = '';
    $('#questaoSearchId').value = '';
    $('#materiaSearch').value = '';
    carregarQuestoes();
});

$('#questaoList').addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-questao]');
    const deleteButton = event.target.closest('[data-delete-questao]');
    if (editButton) {
        const questao = state.questoes.find(item => item.id === Number(editButton.dataset.editQuestao));
        if (!questao) return;
        state.editingQuestao = questao.id;
        $('#questaoEnunciado').value = questao.enunciado;
        $('#questaoMateria').value = questao.materia;
        $('#questaoAlternativa').value = questao.alternativa_correta;
        $('#questaoExplicacao').value = questao.resposta || '';
        $('#questaoFormTitle').textContent = 'Editar questão';
        $('#questaoSubmit').textContent = 'Salvar alterações';
        $('#cancelQuestao').classList.add('hidden');
        $('#questaoEnunciado').focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (deleteButton) {
        if (!confirm('Deseja realmente excluir esta questão? As respostas relacionadas também serão removidas.')) return;
        try {
            await api(`/questoes/${deleteButton.dataset.deleteQuestao}`, { method: 'DELETE' });
            notify('Questão excluída com sucesso.');
            await carregarQuestoes($('#questaoSearch').value.trim(), $('#materiaSearch').value.trim());
            await carregarRespostas();
            await carregarInicio();
        } catch (error) {
            notify(error.message, 'error');
        }
    }
});

$('#respostaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const dados = {
        aluno_id: $('#respostaAluno').value,
        questao_id: $('#respostaQuestao').value,
        resposta_marcada: $('#respostaMarcada').value.trim()
    };
    try {
        const resultado = await api('/respostas', { method: 'POST', body: JSON.stringify(dados) });
        const box = $('#resultadoResposta');
        box.className = `answer-result ${resultado.correta ? 'correct' : 'incorrect'}`;
        box.innerHTML = `<strong>${resultado.correta ? '✓ Resposta correta!' : '↻ Resposta incorreta'}</strong><p>Alternativa correta: <b>${escapeHtml(resultado.alternativa_correta)}</b></p>${resultado.questao ? `<p>${escapeHtml(resultado.questao)}</p>` : ''}`;
        box.classList.remove('hidden');
        $('#respostaMarcada').value = '';
        notify(resultado.correta ? 'Resposta correta registrada.' : 'Erro registrado para revisão.', resultado.correta ? 'success' : 'error');
        await carregarRespostas($('#historicoAluno').value);
        await carregarRelatorio();
        await carregarInicio();
    } catch (error) {
        notify(error.message, 'error');
    }
});

function respostaCard(resposta) {
    return `<article class="record-card response-card"><span class="result-icon ${resposta.correta ? 'is-correct' : 'is-wrong'}">${resposta.correta ? '✓' : '!'}</span><div class="response-content"><strong>${escapeHtml(resposta.aluno_nome || `Aluno #${resposta.aluno_id}`)}</strong><p>${escapeHtml(resposta.enunciado || `Questão #${resposta.questao_id}`)}</p><small>${escapeHtml(resposta.materia || 'Sem matéria')} · Marcou: ${escapeHtml(resposta.resposta_marcada)}</small></div><span class="result-label ${resposta.correta ? 'is-correct' : 'is-wrong'}">${resposta.correta ? 'Acerto' : 'Erro'}</span></article>`;
}

async function carregarRespostas(alunoId = '') {
    try {
        const url = alunoId ? `/respostas?aluno_id=${encodeURIComponent(alunoId)}` : '/respostas';
        state.respostas = await api(url);
        $('#respostaList').className = 'data-list';
        $('#respostaList').innerHTML = state.respostas.map(respostaCard).join('') || emptyState('Nenhuma resposta registrada.');
        $('#totalRespostas').textContent = (await api('/respostas')).length;
    } catch (error) {
        notify(error.message, 'error');
    }
}

$('#respostaFilterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    carregarRespostas($('#historicoAluno').value);
});

async function carregarRelatorio() {
    try {
        const alunoId = $('#relatorioAluno').value;
        const query = alunoId ? `?aluno_id=${encodeURIComponent(alunoId)}` : '';
        const [resumo, erros] = await Promise.all([api(`/relatorios/desempenho${query}`), api(`/relatorios/erros${query}`)]);
        $('#reportTotal').textContent = resumo.total_respostas;
        $('#reportCorrect').textContent = resumo.acertos;
        $('#reportErrors').textContent = resumo.erros;
        $('#reportAccuracy').textContent = `${resumo.percentual_acerto}%`;
        $('#totalErros').textContent = resumo.erros;
        $('#heroAccuracy').textContent = `${resumo.percentual_acerto}%`;
        $('#errorList').className = 'data-list';
        $('#errorList').innerHTML = erros.map(respostaCard).join('') || emptyState('Nenhum erro encontrado para este filtro.');
    } catch (error) {
        notify(error.message, 'error');
    }
}

$('#relatorioFilterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    carregarRelatorio();
});

async function carregarInicio() {
    try {
        const [alunos, questoes, respostas, resumo, erros] = await Promise.all([
            api('/alunos'), api('/questoes'), api('/respostas'), api('/relatorios/desempenho'), api('/relatorios/erros')
        ]);
        state.alunos = alunos;
        state.questoes = questoes;
        state.respostas = respostas;
        $('#totalAlunos').textContent = alunos.length;
        $('#totalQuestoes').textContent = questoes.length;
        $('#totalRespostas').textContent = respostas.length;
        $('#totalErros').textContent = resumo.erros;
        $('#heroAccuracy').textContent = `${resumo.percentual_acerto}%`;
        $('#recentErrors').className = 'data-list';
        $('#recentErrors').innerHTML = erros.slice(0, 4).map(respostaCard).join('') || emptyState('Nenhum erro registrado ainda.');
        atualizarSeletoresAlunos();
        atualizarSeletoresQuestoes();
    } catch (error) {
        notify(error.message, 'error');
    }
}

async function inicializar() {
    try {
        state.alunos = await api('/alunos');
        state.questoes = await api('/questoes');
        atualizarSeletoresAlunos();
        atualizarSeletoresQuestoes();
        await Promise.all([carregarInicio(), carregarAlunos(), carregarQuestoes(), carregarRespostas()]);
        
        const savedScreen = sessionStorage.getItem('activeScreen');
        if (savedScreen) {
            navigate(savedScreen);
        }
    } catch (error) {
        notify(`Falha ao conectar à API: ${error.message}`, 'error');
    }
}

inicializar();
