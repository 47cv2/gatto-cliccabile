// Dati delle richieste di iscrizione
let iscrizioni = [];

// Dati per la classifica (esempio)
const classificaData = [
    { id: 1, nome: "_iTzLook_", punteggio: 960 },
    { id: 2, nome: "itzluciferr", punteggio: 785 },
    { id: 3, nome: "CurranXMatte", punteggio: 720 },
    { id: 4, nome: "luigiluix", punteggio: 650 },
    { id: 5, nome: "_Lucifer66", punteggio: 610 },
    { id: 6, nome: "Revlis1", punteggio: 580 },
    { id: 7, nome: "GioelePro", punteggio: 520 },
    { id: 8, nome: "Vespasianum", punteggio: 490 },
    { id: 9, nome: "PlayerSample", punteggio: 450 },
    { id: 10, nome: "NewMember", punteggio: 420 }
];

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
            alert('Grazie! Verrai contattato presto.');
            
            // Resetta il form
            form.reset();
            
            // Torna alla home
            showSection('home');
        });
    }
    
    // Carica le iscrizioni salvate
    caricaIscrizioni();
    
    // Ottieni il nome dell'utente da Telegram se disponibile
    getMostraNomeTelegram();
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
    // Questa funzione può essere chiamata da una sezione
