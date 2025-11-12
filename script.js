let isAdmin = false;
const STORAGE_KEY = 'ibe-eventos';

// Eventos iniciais padrão
const eventosIniciais = [
    {
        id: 1,
        data: "13/11/2025",
        hora: "17:00",
        evento: "Culto de Gratidão",
        descricao: "Um momento de agradecimento a Deus.",
        local: "Igreja Batista Emanuel"
    },
    {
        id: 2,
        data: "22/11/2025",
        hora: "20:00",
        evento: "Vigília Jovem",
        descricao: "Noite de oração e louvor com a juventude.",
        local: "Igreja Batista Emanuel"
    },
    {
        id: 3,
        data: "25/12/2025",
        hora: "19:00",
        evento: "Culto de Natal",
        descricao: "Celebração do nascimento de Jesus.",
        local: "Igreja Batista Emanuel"
    }
];

/* --- Funções de Admin --- */

function checkPassword() {
    document.getElementById('passwordModal').style.display = 'block';
}

function validatePassword() {
    // A senha 'IBEMG2002' está mantida
    const password = document.getElementById('passwordInput').value;
    if (password === 'IBEMG2002') {
        isAdmin = true;
        closePasswordModal();
        openAdmin();
    } else {
        alert('Senha incorreta!');
    }
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('passwordInput').value = '';
}

function openAdmin() {
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminEvents();
}

function closeAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
    isAdmin = false;
}

/* --- Funções de Persistência e Atualização --- */

// Buscar eventos (com fallback para eventos iniciais)
async function getEvents() {
      // Simulação de acesso a "storage".
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // Se não houver nada no storage, salva os eventos iniciais e retorna eles
    await saveEvents([...eventosIniciais]);
    return [...eventosIniciais];
}

// Salvar eventos
async function saveEvents(eventos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos));
        return true;
    } catch (error) {
        console.error('Erro ao salvar no storage:', error);
        return false;
    }
}

// Adicionar evento 
async function addEvent() {
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    const nameInput = document.getElementById('eventName');
    const descInput = document.getElementById('eventDesc');
    const localInput = document.getElementById('eventLocal');
    
    const date = dateInput.value;
    const time = timeInput.value;
    const name = nameInput.value;
    const desc = descInput.value;
    const local = localInput.value;

    if (!date || !time || !name) {
        alert('Preencha data, hora e nome do evento!');
        return;
    }

    const evento = {
        id: Date.now(), // ID único
        data: date.split('-').reverse().join('/'), // Converte AAAA-MM-DD para DD/MM/AAAA
        hora: time,
        evento: name,
        descricao: desc || 'Sem descrição',
        local: local || 'Igreja Batista Emanuel'
    };

    const eventos = await getEvents();
    eventos.push(evento);
    
    const salvou = await saveEvents(eventos);
    
    if (salvou) {
        // Limpar campos
        dateInput.value = '';
        timeInput.value = '';
        nameInput.value = '';
        descInput.value = '';
        localInput.value = '';
        
        // Recarrega as listas após a modificação
        await loadAdminEvents();
        await loadPublicEvents();
        
        alert('✅ Evento adicionado com sucesso!');
    } else {
        alert('❌ Erro ao adicionar evento. Tente novamente.');
    }
}

// Deletar evento 
async function deleteEvent(id) {
    if (!confirm('❓ Deseja realmente excluir este evento?')) return;

    const eventos = await getEvents();
    // Garante que o ID é tratado como número para a comparação
    const novosEventos = eventos.filter(e => e.id !== Number(id)); 
    
    const salvou = await saveEvents(novosEventos);
    
    if (salvou) {
        // Recarrega as listas após a modificação
        await loadAdminEvents();
        await loadPublicEvents();
        alert('✅ Evento excluído com sucesso!');
    } else {
        alert('❌ Erro ao excluir evento. Tente novamente.');
    }
}

/* --- Funções de Visualização --- */

// Formatar data
function formatarData(dataStr) {
    // Espera dataStr no formato DD/MM/AAAA
    const partes = dataStr.split('/');
    // Cria um objeto Date: new Date(ano, mes-1, dia)
    const data = new Date(partes[2], partes[1] - 1, partes[0]); 
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Adiciona a primeira letra maiúscula ao dia da semana
    const dataFormatada = data.toLocaleDateString('pt-BR', opcoes);
    return dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}

// Carregar eventos públicos (próximos 6)
async function loadPublicEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = '<p style="text-align: center;">Carregando eventos...</p>';
    
    const eventos = await getEvents();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const eventosFuturos = eventos
        .filter(e => {
            // Converte DD/MM/AAAA para um objeto Date comparável
            const partes = e.data.split('/');
            const dataEvento = new Date(partes[2], partes[1] - 1, partes[0]);
            dataEvento.setHours(0, 0, 0, 0);
            return dataEvento >= hoje;
        })
        .sort((a, b) => {
            // Cria uma string comparável AAAA/MM/DDHHMM para ordenar
            const dataHoraA = a.data.split('/').reverse().join('') + a.hora.replace(':', '');
            const dataHoraB = b.data.split('/').reverse().join('') + b.hora.replace(':', '');
            if (dataHoraA < dataHoraB) return -1;
            if (dataHoraA > dataHoraB) return 1;
            return 0;
        })
        .slice(0, 6);

    if (eventosFuturos.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhum evento especial programado no momento.</p>';
        return;
    }

    container.innerHTML = eventosFuturos.map(evento => `
        <div class="event-card">
            <div class="event-content">
                <h3>${evento.evento}</h3>
                <p class="event-date">📅 ${formatarData(evento.data)}</p>
                <p class="event-date">🕐 ${evento.hora}</p>
                <p class="event-date">📍 ${evento.local}</p>
                <p>${evento.descricao}</p>
            </div>
        </div>
    `).join('');
}

// Carregar eventos no admin (Todos os eventos, ordenados por data/hora)
async function loadAdminEvents() {
    const container = document.getElementById('adminEventsList');
    container.innerHTML = '<p>Carregando...</p>';
    
    const eventos = await getEvents();
    
    const eventosOrdenados = eventos.sort((a, b) => {
        // Cria uma string comparável AAAA/MM/DDHHMM
        const dataHoraA = a.data.split('/').reverse().join('') + a.hora.replace(':', '');
        const dataHoraB = b.data.split('/').reverse().join('') + b.hora.replace(':', '');
        if (dataHoraA < dataHoraB) return -1;
        if (dataHoraA > dataHoraB) return 1;
        return 0;
    });

    if (eventosOrdenados.length === 0) {
        container.innerHTML = '<p style="padding: 1rem;">Nenhum evento cadastrado.</p>';
        return;
    }

    container.innerHTML = eventosOrdenados.map(evento => `
        <div class="event-item">
            <div>
                <strong>${evento.evento}</strong><br>
                📅 ${evento.data} às ${evento.hora} | 📍 ${evento.local}<br>
                📝 ${evento.descricao}
            </div>
            <button class="btn-delete" onclick="deleteEvent(${evento.id})">🗑️ Excluir</button>
        </div>
    `).join('');
}

// Toggle do Menu Mobile
function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('open');
}


// Inicializar quando a página carregar
window.addEventListener('load', async () => {
    await loadPublicEvents();
    
    // Adiciona evento para fechar o menu ao clicar em um link (mobile)
    document.querySelectorAll('#nav-menu a').forEach(item => {
        item.addEventListener('click', () => {
            const menu = document.getElementById('nav-menu');
            if (menu.classList.contains('open')) {
                menu.classList.remove('open');
            }
        });
    });
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('passwordModal');
    const admin = document.getElementById('adminPanel');
    if (event.target == modal) {
        closePasswordModal();
    }
    // O painel admin é fechado somente pelo botão "Fechar" para evitar perda de dados.
}