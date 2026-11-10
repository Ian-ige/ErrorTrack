const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = { alunos: [], questoes: [], respostas: [], editingAluno: null, editingQuestao: null };

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

// Configuração da API e Modo Demonstração (GitHub Pages / Armazenamento Local)
const STORAGE_KEY_API = 'errortrack_api_url';
const STORAGE_KEY_DATA = 'errortrack_mock_data';

const SEED_DATA = {
    alunos: [
        { id: 1, name: 'Ana Silva', materia: 'Matemática', created_at: '2026-11-10T09:00:00Z' },
        { id: 2, name: 'Carlos Souza', materia: 'Física', created_at: '2026-11-10T09:10:00Z' },
        { id: 3, name: 'Beatriz Lima', materia: 'Biologia', created_at: '2026-11-10T09:20:00Z' }
    ],
    questoes: [
        { id: 1, enunciado: 'Quanto é 2 + 2?', materia: 'Matemática', alternativa_correta: '4', resposta: 'Soma básica de números inteiros.', created_at: '2026-11-10T09:00:00Z' },
        { id: 2, enunciado: 'Qual é a unidade de força no Sistema Internacional (SI)?', materia: 'Física', alternativa_correta: 'Newton', resposta: 'Definida em homenagem a Isaac Newton (N = kg·m/s²).', created_at: '2026-11-10T09:05:00Z' },
        { id: 3, enunciado: 'Qual organela celular é responsável pela respiração celular?', materia: 'Biologia', alternativa_correta: 'Mitocôndria', resposta: 'Responsável pela síntese da maior parte do ATP celular.', created_at: '2026-11-10T09:10:00Z' }
    ],
    respostas: [
        { id: 1, aluno_id: 1, aluno_nome: 'Ana Silva', questao_id: 1, enunciado: 'Quanto é 2 + 2?', materia: 'Matemática', alternativa_correta: '4', resposta_marcada: '4', correta: true, respondida_em: '2026-11-10 09:30:00' },
        { id: 2, aluno_id: 2, aluno_nome: 'Carlos Souza', questao_id: 2, enunciado: 'Qual é a unidade de força no Sistema Internacional (SI)?', materia: 'Física', alternativa_correta: 'Newton', resposta_marcada: 'Joule', correta: false, respondida_em: '2026-11-10 09:45:00' }
    ]
};

function getMockStore() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_DATA);
        if (stored) return JSON.parse(stored);
    } catch (_) {}
    const initial = JSON.parse(JSON.stringify(SEED_DATA));
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(initial));
    return initial;
}

function saveMockStore(store) {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(store));
}

let apiBaseUrl = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
let useMock = false;

function isLocalEnv() {
    return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function updateApiStatus(type, label) {
    const dot = $('#apiStatusDot');
    const text = $('#apiStatusText');
    const mDot = $('#modalStatusDot');
    const mLabel = $('#modalStatusLabel');
    const dotClass = `status-dot ${type === 'demo' ? 'demo' : (type === 'offline' ? 'offline' : '')}`;
    if (dot) dot.className = dotClass;
    if (text) text.textContent = label;
    if (mDot) mDot.className = dotClass;
    if (mLabel) mLabel.textContent = label;
}

async function mockApi(url, options = {}) {
    await new Promise(r => setTimeout(r, 50));
    const store = getMockStore();
    const [pathPart, queryPart] = url.split('?');
    const params = new URLSearchParams(queryPart || '');
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const segments = pathPart.replace(/^\/+|\/+$/g, '').split('/');
    const root = segments[0] || '';
    const id = segments[1] ? Number(segments[1]) : null;

    if (root === 'alunos') {
        if (!id) {
            if (method === 'GET') {
                const nome = (params.get('nome') || '').trim().toLowerCase();
                const list = [...store.alunos];
                return (nome ? list.filter(a => a.name.toLowerCase().includes(nome)) : list).sort((a,b) => b.id - a.id);
            }
            if (method === 'POST') {
                const name = (body.name || '').trim();
                const materia = (body.materia || '').trim();
                if (!name || !materia) throw new Error('Nome e matéria são obrigatórios.');
                const newId = store.alunos.length ? Math.max(...store.alunos.map(a => a.id)) + 1 : 1;
                const novo = { id: newId, name, materia, created_at: new Date().toISOString() };
                store.alunos.unshift(novo);
                saveMockStore(store);
                return novo;
            }
        } else {
            const aluno = store.alunos.find(a => a.id === id);
            if (!aluno) throw new Error('Aluno não encontrado.');
            if (method === 'GET') return aluno;
            if (method === 'PUT') {
                if (body.name) aluno.name = body.name.trim();
                if (body.materia) aluno.materia = body.materia.trim();
                store.respostas.forEach(r => { if (r.aluno_id === id) r.aluno_nome = aluno.name; });
                saveMockStore(store);
                return aluno;
            }
            if (method === 'DELETE') {
                store.alunos = store.alunos.filter(a => a.id !== id);
                store.respostas = store.respostas.filter(r => r.aluno_id !== id);
                saveMockStore(store);
                return { mensagem: 'Aluno excluído com sucesso.' };
            }
        }
    }

    if (root === 'questoes') {
        if (!id) {
            if (method === 'GET') {
                const busca = (params.get('busca') || '').trim().toLowerCase();
                const materia = (params.get('materia') || '').trim().toLowerCase();
                let list = [...store.questoes];
                if (busca) list = list.filter(q => q.enunciado.toLowerCase().includes(busca));
                if (materia) list = list.filter(q => q.materia.toLowerCase().includes(materia));
                return list.sort((a,b) => b.id - a.id);
            }
            if (method === 'POST') {
                const enunciado = (body.enunciado || '').trim();
                const materia = (body.materia || '').trim();
                const alternativa = (body.alternativa_correta || '').trim();
                const resposta = (body.resposta || '').trim();
                if (!enunciado || !materia || !alternativa) throw new Error('Enunciado, matéria e alternativa correta são obrigatórios.');
                const newId = store.questoes.length ? Math.max(...store.questoes.map(q => q.id)) + 1 : 1;
                const nova = { id: newId, enunciado, materia, alternativa_correta: alternativa, resposta, created_at: new Date().toISOString() };
                store.questoes.unshift(nova);
                saveMockStore(store);
                return nova;
            }
        } else {
            const questao = store.questoes.find(q => q.id === id);
            if (!questao) throw new Error('Questão não encontrada.');
            if (method === 'GET') return questao;
            if (method === 'PUT') {
                if (body.enunciado) questao.enunciado = body.enunciado.trim();
                if (body.materia) questao.materia = body.materia.trim();
                if (body.alternativa_correta) questao.alternativa_correta = body.alternativa_correta.trim();
                if (body.resposta !== undefined) questao.resposta = body.resposta.trim();
                store.respostas.forEach(r => {
                    if (r.questao_id === id) {
                        r.enunciado = questao.enunciado;
                        r.materia = questao.materia;
                        r.alternativa_correta = questao.alternativa_correta;
                    }
                });
                saveMockStore(store);
                return questao;
            }
            if (method === 'DELETE') {
                store.questoes = store.questoes.filter(q => q.id !== id);
                store.respostas = store.respostas.filter(r => r.questao_id !== id);
                saveMockStore(store);
                return { mensagem: 'Questão excluída com sucesso.' };
            }
        }
    }

    if (root === 'respostas') {
        if (method === 'GET') {
            const alunoId = params.get('aluno_id');
            let list = [...store.respostas];
            if (alunoId) list = list.filter(r => r.aluno_id === Number(alunoId));
            return list.sort((a,b) => b.id - a.id);
        }
        if (method === 'POST') {
            const aluno = store.alunos.find(a => a.id === Number(body.aluno_id));
            const questao = store.questoes.find(q => q.id === Number(body.questao_id));
            if (!aluno || !questao) throw new Error('Selecione um aluno e uma questão válidos.');
            const marcada = (body.resposta_marcada || '').trim();
            if (!marcada) throw new Error('A resposta marcada é obrigatória.');
            const correta = marcada.toLowerCase() === questao.alternativa_correta.trim().toLowerCase();
            const newId = store.respostas.length ? Math.max(...store.respostas.map(r => r.id)) + 1 : 1;
            const nova = {
                id: newId,
                aluno_id: aluno.id,
                aluno_nome: aluno.name,
                questao_id: questao.id,
                questao: questao.enunciado,
                enunciado: questao.enunciado,
                materia: questao.materia,
                resposta_marcada: marcada,
                alternativa_correta: questao.alternativa_correta,
                correta,
                respondida_em: new Date().toISOString().replace('T', ' ').slice(0, 19)
            };
            store.respostas.unshift(nova);
            saveMockStore(store);
            return nova;
        }
    }

    if (root === 'relatorios') {
        const sub = segments[1];
        const alunoId = params.get('aluno_id');
        let list = [...store.respostas];
        if (alunoId) list = list.filter(r => r.aluno_id === Number(alunoId));

        if (sub === 'desempenho') {
            const total = list.length;
            const acertos = list.filter(r => r.correta).length;
            const erros = total - acertos;
            return {
                total_respostas: total,
                acertos,
                erros,
                percentual_acerto: total ? Math.round((acertos * 100 / total) * 10) / 10 : 0
            };
        }
        if (sub === 'erros') {
            return list.filter(r => !r.correta).sort((a,b) => b.id - a.id);
        }
    }

    throw new Error('Rota não encontrada.');
}

async function api(url, options = {}) {
    if (useMock) {
        return mockApi(url, options);
    }
    const fullUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/+$/, '')}${url}` : url;
    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
        });
        const data = response.status === 204 ? null : await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.erro || data?.error || data?.mensagem || 'Não foi possível concluir a operação.');
        return data;
    } catch (err) {
        // Se a chamada de rede falhar e não estivermos com API customizada salva, cai para mock
        if (!apiBaseUrl && (!isLocalEnv() || err.name === 'TypeError')) {
            useMock = true;
            updateApiStatus('demo', 'Modo Demonstração (Navegador)');
            return mockApi(url, options);
        }
        throw err;
    }
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

async function inicializarApp() {
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

async function detectarConexao() {
    if (apiBaseUrl) {
        try {
            await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/alunos`, { method: 'GET' });
            useMock = false;
            updateApiStatus('live', 'API Conectada');
            return;
        } catch (_) {
            notify('Não foi possível conectar à API informada. Usando modo demonstração.', 'error');
            useMock = true;
            updateApiStatus('offline', 'API Offline (Modo Demo)');
            return;
        }
    }

    if (isLocalEnv()) {
        try {
            const res = await fetch('/alunos');
            if (res.ok) {
                useMock = false;
                updateApiStatus('live', 'Flask Backend (Local)');
                return;
            }
        } catch (_) {}
    }

    useMock = true;
    updateApiStatus('demo', 'Modo Demonstração (Navegador)');
}

function configurarModalSettings() {
    const modal = $('#settingsModal');
    const openBtn = $('#openSettingsBtn');
    const closeBtn = $('#closeSettingsModal');
    const form = $('#settingsForm');
    const input = $('#apiUrlInput');
    const resetBtn = $('#resetMockDataBtn');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            if (input) input.value = apiBaseUrl;
            if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            if (modal.close) modal.close(); else modal.removeAttribute('open');
        });
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (modal.close) modal.close(); else modal.removeAttribute('open');
            }
        });
    }
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novaUrl = (input.value || '').trim();
            if (novaUrl) {
                try {
                    const testUrl = `${novaUrl.replace(/\/+$/, '')}/alunos`;
                    const res = await fetch(testUrl);
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    apiBaseUrl = novaUrl;
                    localStorage.setItem(STORAGE_KEY_API, apiBaseUrl);
                    useMock = false;
                    updateApiStatus('live', 'API Conectada');
                    notify('Conectado à API com sucesso!');
                    if (modal.close) modal.close(); else modal.removeAttribute('open');
                    await inicializarApp();
                } catch (err) {
                    notify(`Falha ao conectar à URL: ${err.message}`, 'error');
                }
            } else {
                localStorage.removeItem(STORAGE_KEY_API);
                apiBaseUrl = '';
                if (isLocalEnv()) {
                    useMock = false;
                    updateApiStatus('live', 'Flask Backend (Local)');
                } else {
                    useMock = true;
                    updateApiStatus('demo', 'Modo Demonstração (Navegador)');
                }
                notify('Configuração atualizada.');
                if (modal.close) modal.close(); else modal.removeAttribute('open');
                await inicializarApp();
            }
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('Deseja restaurar os dados de demonstração originais?')) {
                localStorage.removeItem(STORAGE_KEY_DATA);
                notify('Dados de demonstração restaurados.');
                if (modal.close) modal.close(); else modal.removeAttribute('open');
                await inicializarApp();
            }
        });
    }
}

async function inicializar() {
    configurarModalSettings();
    await detectarConexao();
    await inicializarApp();
}

inicializar();
