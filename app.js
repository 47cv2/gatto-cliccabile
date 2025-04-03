// Configurazione GitHub
const GITHUB_CONFIG = {
    username: "47cv2", // Inserisci il tuo username GitHub
    repo: "cr-webapp", // Nome del repository
    path: "iscrizioni.json", // Percorso del file nel repository
    branch: "main", // Nome del branch
    token: "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" // Imposta il token GitHub qui SOLO per uso privato o tramite variabile d'ambiente
};

// Configurazione Telegram
const TELEGRAM_CONFIG = {
    botToken: "7645980878:AAHgybK_gW-LcrnkAcfi4HotQhmspPJ9P5o", // Imposta il token del tuo bot qui o tramite variabile d'ambiente
    chatId: "bonkry" // Il tuo ID chat di Telegram
};

// Dati delle richieste di iscrizione
let iscrizioni = [];
let statistiche = {
    totaleIscrizioni: 0,
    inAttesa: 0,
    approvati: 0,
    rifiutati: 0,
    ultimoAggiornamento: new Date().toLocaleString()
};
let configurazione = {
    approvazioneAutomatica: false,
    etaMinima: 15,
    campiObbligatori: ["minecraft", "telegram", "eta"],
    campiOpzionali: ["esperienze"]
};

// Funzione per mostrare una specifica sezione
function showSection(sectionId) {
    // Nasconde tutte le sezioni
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione richiesta
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Salva la sezione corrente nel localStorage
    localStorage.setItem('currentSection', sectionId);
}

// Gestione del form di iscrizione
document.addEventListener('DOMContentLoaded', function() {
    // Recupera l'ultima sezione visitata o usa 'home' come default
    const lastSection = localStorage.getItem('currentSection') || 'home';
    showSection(lastSection);
    
    // Carica i dati da GitHub all'avvio
    caricaDatiDaGitHub();
    
    // Gestisce l'invio del form
    const form = document.getElementById('iscrizioneForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Raccoglie i dati dal form
            const nuovaIscrizione = {
                id: Date.now(), // Timestamp come ID univoco
                minecraft: document.getElementById('minecraft-nick').value,
                telegram: document.getElementById('telegram').value,
                eta: parseInt(document.getElementById('eta').value),
                esperienze: document.getElementById('esperienze').value,
                dataRichiesta: new Date().toLocaleString(),
                stato: "in_attesa"
            };
            
            // Verifica età minima
            if (nuovaIscrizione.eta < configurazione.etaMinima) {
                alert(`L'età minima per iscriversi è di ${configurazione.etaMinima} anni.`);
                return;
            }
            
            // Aggiunge la nuova iscrizione all'array
            iscrizioni.push(nuovaIscrizione);
            
            // Aggiorna le statistiche
            statistiche.totaleIscrizioni++;
            statistiche.inAttesa++;
            statistiche.ultimoAggiornamento = new Date().toLocaleString();
            
            // Invia notifica a Telegram
            inviaNotificaTelegram(nuovaIscrizione);
            
            // Salva le modifiche su GitHub e in localStorage
            salvaDatiSuGitHub();
            salvaInLocalStorage();
            
            // Mostra messaggio di conferma
            alert('Richiesta inviata con successo! Verrai contattato presto.');
            
            // Resetta il form
            form.reset();
            
            // Torna alla home
            showSection('home');
        });
    }
});

// Funzione per inviare notifica a Telegram
function inviaNotificaTelegram(iscrizione) {
    // Verifica se siamo in un contesto di Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        // Invio dei dati al bot tramite Telegram WebApp
        window.Telegram.WebApp.sendData(JSON.stringify({
            action: 'nuova_iscrizione',
            dati: iscrizione
        }));
    } else {
        // Invio diretto tramite API Telegram se non siamo in WebApp
        if (TELEGRAM_CONFIG.botToken && TELEGRAM_CONFIG.chatId) {
            // Preparazione messaggio
            const messaggio = `🆕 NUOVA ISCRIZIONE PARTITO 🆕\n\n` +
                `👤 Minecraft: ${iscrizione.minecraft}\n` +
                `📱 Telegram: ${iscrizione.telegram}\n` +
                `🔢 Età: ${iscrizione.eta}\n` +
                `📝 Esperienze: ${iscrizione.esperienze || 'Nessuna'}\n` +
                `📅 Data richiesta: ${iscrizione.dataRichiesta}`;
            
            // Codifica il messaggio per l'URL
            const messaggioEncoded = encodeURIComponent(messaggio);
            
            // Invio tramite fetch
            fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage?chat_id=${TELEGRAM_CONFIG.chatId}&text=${messaggioEncoded}&parse_mode=HTML`)
                .then(response => response.json())
                .then(data => {
                    console.log('Notifica Telegram inviata con successo:', data);
                })
                .catch(error => {
                    console.error('Errore nell\'invio della notifica Telegram:', error);
                });
        } else {
            console.warn('Configurazione Telegram mancante. La notifica non è stata inviata.');
        }
    }
}

// Funzione per salvare i dati nel localStorage
function salvaInLocalStorage() {
    const datiCompleti = {
        iscrizioni: iscrizioni,
        statistiche: statistiche,
        configurazione: configurazione
    };
    localStorage.setItem('partito_dati', JSON.stringify(datiCompleti));
}

// Funzione per caricare i dati dal localStorage
function caricaDaLocalStorage() {
    const datiSalvati = localStorage.getItem('partito_dati');
    if (datiSalvati) {
        const dati = JSON.parse(datiSalvati);
        iscrizioni = dati.iscrizioni || [];
        statistiche = dati.statistiche || {
            totaleIscrizioni: 0,
            inAttesa: 0,
            approvati: 0,
            rifiutati: 0,
            ultimoAggiornamento: new Date().toLocaleString()
        };
        configurazione = dati.configurazione || {
            approvazioneAutomatica: false,
            etaMinima: 15,
            campiObbligatori: ["minecraft", "telegram", "eta"],
            campiOpzionali: ["esperienze"]
        };
        console.log('Dati caricati da localStorage:', iscrizioni.length, 'iscrizioni');
    }
}

// Funzione per salvare i dati su GitHub
function salvaDatiSuGitHub() {
    if (!GITHUB_CONFIG.token) {
        console.warn('Token GitHub non configurato. I dati sono stati salvati solo localmente.');
        return;
    }
    
    const datiCompleti = {
        iscrizioni: iscrizioni,
        statistiche: statistiche,
        configurazione: configurazione
    };
    
    // Prima otteniamo il file esistente per avere lo SHA
    fetch(`https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`, {
        headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Prepara il contenuto aggiornato
        const content = btoa(JSON.stringify(datiCompleti, null, 2)); // Converte in base64
        
        // Aggiorna il file su GitHub
        return fetch(`https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Aggiornamento iscrizioni - ${new Date().toISOString()}`,
                content: content,
                sha: data.sha,
                branch: GITHUB_CONFIG.branch
            })
        });
    })
    .then(response => response.json())
    .then(data => {
        console.log('Dati salvati su GitHub con successo:', data);
    })
    .catch(error => {
        console.error('Errore nel salvataggio su GitHub:', error);
        // In caso di errore, salviamo solo localmente
        salvaInLocalStorage();
    });
}

// Funzione per caricare i dati da GitHub
function caricaDatiDaGitHub() {
    // Prima proviamo a caricare i dati dal localStorage come fallback
    caricaDaLocalStorage();
    
    // Poi tentiamo di ottenere i dati aggiornati da GitHub
    fetch(`https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('File non trovato su GitHub');
        }
        return response.json();
    })
    .then(data => {
        // Decodifica il contenuto base64
        const contenutoJson = atob(data.content);
        const dati = JSON.parse(contenutoJson);
        
        // Aggiorna i dati locali
        iscrizioni = dati.iscrizioni || [];
        statistiche = dati.statistiche || statistiche;
        configurazione = dati.configurazione || configurazione;
        
        // Salva in localStorage come cache
        salvaInLocalStorage();
        
        console.log('Dati caricati da GitHub:', iscrizioni.length, 'iscrizioni');
    })
    .catch(error => {
        console.warn('Non è stato possibile caricare i dati da GitHub:', error.message);
        console.log('Utilizzando i dati locali come fallback.');
    });
}

// Funzione per esportare i dati delle iscrizioni
function esportaDati() {
    if (iscrizioni.length === 0) {
        alert('Non ci sono dati da esportare.');
        return;
    }
    
    const datiCompleti = {
        iscrizioni: iscrizioni,
        statistiche: statistiche,
        configurazione: configurazione
    };
    
    // Crea un blob con i dati in formato JSON
    const dataStr = JSON.stringify(datiCompleti, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // Crea un link per il download e lo clicca automaticamente
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iscrizioni_partito.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Verifica se siamo in un contesto di Telegram WebApp
document.addEventListener('DOMContentLoaded', function() {
    if (window.Telegram && window.Telegram.WebApp) {
        // Inizializza la WebApp di Telegram
        window.Telegram.WebApp.ready();
        
        // Adatta lo stile per la WebApp di Telegram
        document.body.classList.add('telegram-webapp');
        
        // Ottiene il tema dell'app Telegram
        const colorScheme = window.Telegram.WebApp.colorScheme;
        document.body.classList.add(colorScheme);
    }
});
