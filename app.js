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
    chatId: "Bonkry", // Il tuo ID chat di Telegram
    // Servizio webhook alternativo che permette di aggirare limitazioni CORS
    webhookUrl: "https://ntfy.sh/miopartito-iscrizioni-xyz123" // Crea un topic unico su ntfy.sh
};

// Flag per abilitare i log di debug
const DEBUG = true;

// Funzione di debug
function logDebug(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
        // Opzionalmente, salva anche in localStorage per ispezionare dopo
        const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            message,
            data: data ? JSON.stringify(data) : null
        });
        localStorage.setItem('debug_logs', JSON.stringify(logs));
    }
}

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
    
    // Aggiungiamo un pulsante di test per le notifiche Telegram (solo in modalità debug)
    if (DEBUG) {
        const iscrizioneSection = document.getElementById('iscrizione');
        if (iscrizioneSection) {
            const testButton = document.createElement('button');
            testButton.textContent = 'Test Notifica Telegram';
            testButton.className = 'submit-button';
            testButton.style.marginTop = '10px';
            testButton.style.backgroundColor = '#ff9800';
            testButton.onclick = function() {
                const testIscrizione = {
                    id: Date.now(),
                    minecraft: 'TestUser123',
                    telegram: '@test_user',
                    eta: 18,
                    esperienze: 'Test notifica Telegram',
                    dataRichiesta: new Date().toLocaleString(),
                    stato: "test"
                };
                inviaNotificaTelegram(testIscrizione);
                alert('Test di notifica avviato. Controlla la console per i dettagli.');
            };
            iscrizioneSection.appendChild(testButton);
        }
    }
    
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
            
            logDebug('Nuova iscrizione creata', nuovaIscrizione);
            
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
            
            // Invia notifica a Telegram (prova tutti i metodi)
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
    logDebug('Invio notifica Telegram avviato', iscrizione);
    
    // Preparazione messaggio
    const messaggio = `🆕 NUOVA ISCRIZIONE PARTITO 🆕\n\n` +
        `👤 Minecraft: ${iscrizione.minecraft}\n` +
        `📱 Telegram: ${iscrizione.telegram}\n` +
        `🔢 Età: ${iscrizione.eta}\n` +
        `📝 Esperienze: ${iscrizione.esperienze || 'Nessuna'}\n` +
        `📅 Data richiesta: ${iscrizione.dataRichiesta}`;
    
    // Verifica se siamo in un contesto di Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        logDebug('Utilizzo Telegram WebApp');
        try {
            // Invio dei dati al bot tramite Telegram WebApp
            window.Telegram.WebApp.sendData(JSON.stringify({
                action: 'nuova_iscrizione',
                dati: iscrizione
            }));
            logDebug('Dati inviati tramite WebApp');
        } catch (error) {
            logDebug('Errore nell\'invio tramite WebApp', error);
            // Fallback agli altri metodi
            inviaViaAPITelegram(messaggio);
            inviaViaWebhook(messaggio);
        }
    } else {
        logDebug('Non siamo in WebApp Telegram, provo metodi alternativi');
        // Prova tutti i metodi disponibili
        inviaViaAPITelegram(messaggio);
        inviaViaWebhook(messaggio);
        inviaViaLocalStorage(iscrizione);
    }
}

// Metodo 1: Invio diretto tramite API Telegram
function inviaViaAPITelegram(messaggio) {
    if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
        logDebug('Configurazione Telegram API mancante o incompleta');
        return;
    }
    
    logDebug('Tentativo invio tramite API Telegram diretta');
    
    // Codifica il messaggio per l'URL
    const messaggioEncoded = encodeURIComponent(messaggio);
    
    // Crea un elemento immagine invisibile per aggirare le restrizioni CORS
    // Questa è una tecnica alternativa che a volte funziona quando fetch non è permesso
    const img = new Image();
    img.style.display = 'none';
    img.onload = () => {
        logDebug('Richiesta API Telegram caricata tramite Image');
        document.body.removeChild(img);
    };
    img.onerror = (e) => {
        logDebug('Errore Image API Telegram (potrebbe comunque funzionare)', e);
        document.body.removeChild(img);
    };
    img.src = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage?chat_id=${TELEGRAM_CONFIG.chatId}&text=${messaggioEncoded}`;
    document.body.appendChild(img);
    
    // Tentiamo anche con fetch come backup
    fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage?chat_id=${TELEGRAM_CONFIG.chatId}&text=${messaggioEncoded}`)
        .then(response => response.json())
        .then(data => {
            logDebug('Notifica Telegram inviata con successo tramite fetch:', data);
        })
        .catch(error => {
            logDebug('Errore nell\'invio della notifica Telegram tramite fetch:', error);
        });
}

// Metodo 2: Invio tramite servizio webhook (ntfy.sh è gratuito e non richiede registrazione)
function inviaViaWebhook(messaggio) {
    if (!TELEGRAM_CONFIG.webhookUrl) {
        logDebug('URL webhook non configurato');
        return;
    }
    
    logDebug('Tentativo invio tramite webhook');
    
    fetch(TELEGRAM_CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: messaggio
    })
    .then(response => {
        logDebug('Risposta webhook ricevuta', response.status);
        return response.text();
    })
    .then(data => {
        logDebug('Notifica inviata con successo tramite webhook', data);
    })
    .catch(error => {
        logDebug('Errore nell\'invio tramite webhook', error);
    });
}

// Metodo 3: Salvataggio in localStorage per recupero manuale
function inviaViaLocalStorage(iscrizione) {
    logDebug('Salvataggio notifica in localStorage');
    
    // Recupera le notifiche esistenti o inizializza un array vuoto
    const notifiche = JSON.parse(localStorage.getItem('notifiche_da_inviare') || '[]');
    
    // Aggiungi la nuova notifica
    notifiche.push({
        timestamp: Date.now(),
        iscrizione: iscrizione,
        inviato: false
    });
    
    // Salva l'array aggiornato
    localStorage.setItem('notifiche_da_inviare', JSON.stringify(notifiche));
    
    logDebug('Notifica salvata in localStorage. Notifiche in attesa:', notifiche.length);
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
        logDebug('Dati caricati da localStorage:', iscrizioni.length + ' iscrizioni');
    }
}

// Funzione per salvare i dati su GitHub
function salvaDatiSuGitHub() {
    if (!GITHUB_CONFIG.token) {
        logDebug('Token GitHub non configurato. I dati sono stati salvati solo localmente.');
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
        logDebug('Dati salvati su GitHub con successo:', data);
    })
    .catch(error => {
        logDebug('Errore nel salvataggio su GitHub:', error);
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
        
        logDebug('Dati caricati da GitHub:', iscrizioni.length + ' iscrizioni');
    })
    .catch(error => {
        logDebug('Non è stato possibile caricare i dati da GitHub:', error.message);
        logDebug('Utilizzando i dati locali come fallback.');
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
        
        logDebug('Telegram WebApp inizializzata');
    } else {
        logDebug('Non siamo in un contesto Telegram WebApp');
    }
});
