// Dati delle richieste di iscrizione
let iscrizioni = [];

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
                eta: document.getElementById('eta').value,
                esperienze: document.getElementById('esperienze').value,
                dataRichiesta: new Date().toLocaleString()
            };
            
            // Aggiunge la nuova iscrizione all'array
            iscrizioni.push(nuovaIscrizione);
            
            // Salva nel localStorage
            salvaIscrizioni();
            
            // Mostra messaggio di conferma
            alert('Richiesta inviata con successo! Verrai contattato presto.');
            
            // Resetta il form
            form.reset();
            
            // Torna alla home
            showSection('home');
        });
    }
    
    // Carica le iscrizioni salvate
    caricaIscrizioni();
});

// Funzione per salvare le iscrizioni nel localStorage
function salvaIscrizioni() {
    localStorage.setItem('partito_iscrizioni', JSON.stringify(iscrizioni));
    
    // Se siamo in un contesto Telegram, possiamo utilizzare il Telegram WebApp API
    if (window.Telegram && window.Telegram.WebApp) {
        // Invio dei dati al bot tramite Telegram WebApp
        window.Telegram.WebApp.sendData(JSON.stringify({
            action: 'nuova_iscrizione',
            dati: iscrizioni[iscrizioni.length - 1]
        }));
    }
}

// Funzione per caricare le iscrizioni dal localStorage
function caricaIscrizioni() {
    const datiSalvati = localStorage.getItem('partito_iscrizioni');
    if (datiSalvati) {
        iscrizioni = JSON.parse(datiSalvati);
        console.log('Iscrizioni caricate:', iscrizioni.length);
    }
}

// Funzione per esportare i dati delle iscrizioni
function esportaDati() {
    // Questa funzione può essere chiamata da una sezione admin
    if (iscrizioni.length === 0) {
        alert('Non ci sono dati da esportare.');
        return;
    }
    
    // Crea un blob con i dati in formato JSON
    const dataStr = JSON.stringify(iscrizioni, null, 2);
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
