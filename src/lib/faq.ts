import type { UserRole } from "@/lib/utils/roles";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  roles: UserRole[];
}

const EVERYONE: UserRole[] = ["superadmin", "admin", "agonista", "amatore"];
const ADMINS: UserRole[] = ["superadmin", "admin"];
const AGONISTI: UserRole[] = ["agonista"];
const AMATORI: UserRole[] = ["amatore"];
const SUPERADMIN: UserRole[] = ["superadmin"];

export const FAQ_ITEMS: FaqItem[] = [
  // ===== Tutti =====
  {
    id: "prenota-slot",
    category: "Prenotazioni",
    question: "Come prenoto un allenamento?",
    answer: "Vai su Calendario, scegli il giorno e tocca lo slot desiderato. La prenotazione è confermata subito, se c'è posto e non hai raggiunto il limite settimanale del tuo profilo.",
    roles: EVERYONE,
  },
  {
    id: "annulla-prenotazione",
    category: "Prenotazioni",
    question: "Come annullo una prenotazione?",
    answer: "Vai su Le mie prenotazioni e usa il pulsante di annullamento sulla prenotazione attiva. Le prenotazioni annullate restano nello storico.",
    roles: EVERYONE,
  },
  {
    id: "slot-non-visibili",
    category: "Prenotazioni",
    question: "Perché non vedo alcuni slot?",
    answer: "Gli slot sono visibili solo entro la finestra di visibilità impostata dalla società (in giorni di anticipo oppure per settimana). Alcuni slot sono riservati a una categoria (agonisti o amatori) e compaiono solo a chi vi appartiene.",
    roles: EVERYONE,
  },
  {
    id: "eventi-pizza",
    category: "Prenotazioni",
    question: "Cosa sono gli eventi e le serate pizza?",
    answer: "Sono appuntamenti extra non ricorrenti. Restano sempre visibili finché sono in programma, indipendentemente dalla finestra di visibilità degli allenamenti.",
    roles: EVERYONE,
  },
  {
    id: "auto-booking",
    category: "Prenotazioni",
    question: "Cos'è l'auto-booking?",
    answer: "È una prenotazione automatica dei tuoi slot abituali, attivata dalla società per il tuo profilo. Se è attiva, nel tuo profilo compare il pulsante Auto-Booking, dove puoi controllarne le impostazioni.",
    roles: EVERYONE,
  },
  {
    id: "profilo",
    category: "Profilo e statistiche",
    question: "Dove modifico i miei dati?",
    answer: "Nella pagina Il mio profilo (menu in alto a destra con il tuo nome). Puoi aggiornare i tuoi dati personali; per il ruolo e il limite settimanale ci pensa la società.",
    roles: EVERYONE,
  },
  {
    id: "statistiche-personali",
    category: "Profilo e statistiche",
    question: "Dove vedo le mie statistiche?",
    answer: "Nella pagina Statistiche trovi le tue prenotazioni per settimana, mese e anno, con il conteggio delle annullate. Puoi filtrare per stagione.",
    roles: EVERYONE,
  },
  {
    id: "campionato-dove",
    category: "Campionato",
    question: "Dove trovo classifica, risultati e calendario del campionato?",
    answer: "Vai su Campionato. Dalla pagina del campionato puoi aprire Classifica e Risultati, il Calendario partite e l'elenco delle squadre.",
    roles: EVERYONE,
  },
  {
    id: "convocazioni-formazioni",
    category: "Campionato",
    question: "Dove vedo convocazioni e formazioni?",
    answer: "Nella pagina Campionato trovi il link Visualizza Convocazioni (Convocazioni e Formazioni). Qui sono mostrati i convocati e la formazione (a, b, c e doppio) della prossima partita di ogni squadra, con lo storico ricercabile per campionato, squadra e periodo.",
    roles: EVERYONE,
  },

  // ===== Agonisti =====
  {
    id: "agonista-presenza",
    category: "Campionato",
    question: "Come confermo o annullo la mia presenza a una partita?",
    answer: "Vai su Campionato, apri la tua squadra e la partita, quindi scegli Presente o Assente. Puoi modificare la presenza fino all'inizio della partita; dopo non è più possibile.",
    roles: AGONISTI,
  },
  {
    id: "agonista-mie-partite",
    category: "Campionato",
    question: "Dove vedo le mie partite?",
    answer: "Nella pagina Campionato, con la voce Le mie partite, trovi l'elenco degli incontri della tua squadra. Dalla pagina della tua squadra puoi vedere anche i compagni e il calendario.",
    roles: AGONISTI,
  },
  {
    id: "agonista-rimozione",
    category: "Campionato",
    question: "Cosa succede se tolgo la mia presenza?",
    answer: "La società riceve una notifica (email e Telegram) che ti segnala la rimozione della presenza. Se hai un imprevisto, avvisa comunque il tuo referente.",
    roles: AGONISTI,
  },
  {
    id: "agonista-dati",
    category: "Profilo e statistiche",
    question: "Dove trovo i miei dati di tesserato?",
    answer: "Nella pagina Il mio profilo trovi la sezione Dati agonista con il numero di tessera FITET e le informazioni sulla tua squadra.",
    roles: AGONISTI,
  },

  // ===== Amatori =====
  {
    id: "amatore-slot",
    category: "Prenotazioni",
    question: "Quali allenamenti posso prenotare come amatore?",
    answer: "Nel calendario vedi gli slot dedicati agli amatori e quelli aperti a tutti. Gli slot riservati agli agonisti non sono prenotabili dal tuo profilo.",
    roles: AMATORI,
  },
  {
    id: "amatore-campionato",
    category: "Campionato",
    question: "Posso partecipare alle partite di campionato?",
    answer: "La presenza alle partite e la convocazione riguardano gli agonisti. Come amatore puoi consultare la pagina Campionato, la classifica, il calendario e le convocazioni pubbliche.",
    roles: AMATORI,
  },

  // ===== Admin e superadmin =====
  {
    id: "admin-slot",
    category: "Amministrazione",
    question: "Come creo allenamenti, eventi o serate pizza?",
    answer: "Vai su Admin → Slot → Nuovo slot. Scegli il tipo (ricorrente, evento o pizza), la data o il giorno della settimana, la categoria (misto, agonisti, amatori) e la capienza.",
    roles: ADMINS,
  },
  {
    id: "admin-visibilita",
    category: "Amministrazione",
    question: "Come imposto la visibilità del calendario?",
    answer: "Vai su Admin → Slot → Visibilità. Scegli una sola modalità: Giorni di anticipo (finestra fissa da oggi) oppure Settimana successiva dal sabato (la settimana successiva si apre il sabato precedente). La modalità attiva si vede nel box Informazioni.",
    roles: ADMINS,
  },
  {
    id: "admin-stagioni",
    category: "Amministrazione",
    question: "Come gestisco stagioni e chiusure?",
    answer: "Vai su Admin → Stagioni per creare la stagione corrente. Le chiusure del centro si gestiscono dalla pagina Slot, così il calendario non propone allenamenti nei giorni di chiusura.",
    roles: ADMINS,
  },
  {
    id: "admin-prenotazioni-utenti",
    category: "Amministrazione",
    question: "Come gestisco le prenotazioni e gli utenti?",
    answer: "Da Admin → Prenotazioni puoi annullare la prenotazione di qualsiasi utente. Da Admin → Utenti gestisci profili, ruoli e limite settimanale. Dalla gestione utenti puoi anche visualizzare il sito come un altro utente: in alto compare il banner per tornare ad admin.",
    roles: ADMINS,
  },
  {
    id: "admin-campionato-setup",
    category: "Amministrazione",
    question: "Come configuro un campionato?",
    answer: "Vai su Admin → Campionato: crea il campionato, aggiungi le squadre con serie e girone, assegna gli agonisti alle squadre e crea le partite (anche da file CSV). Con Imposta in corso scegli il campionato mostrato in dashboard.",
    roles: ADMINS,
  },
  {
    id: "admin-risultati",
    category: "Amministrazione",
    question: "Come registro il risultato di una partita?",
    answer: "Apri la partita dalla gestione campionato e inserisci i punteggi. La somma dei due punteggi deve essere 7, altrimenti il risultato non viene salvato.",
    roles: ADMINS,
  },
  {
    id: "admin-convocazioni-formazioni",
    category: "Amministrazione",
    question: "Come convoco i giocatori e definisco la formazione?",
    answer: "Nella partita usa il pulsante Convoca per ogni giocatore, poi assegna la lettera (a, b, c) e il doppio nella sezione Formazioni. Con Copia da partita precedente puoi riusare convocati e formazione di un altro incontro della stessa squadra e modificarli.",
    roles: ADMINS,
  },
  {
    id: "admin-convocazioni-telegram",
    category: "Amministrazione",
    question: "Come invio il riepilogo convocazioni su Telegram?",
    answer: "Vai su Statistiche → Riepilogo Convocazioni, esegui la ricerca per campionato, squadra o periodo e premi Invia su Telegram. Il messaggio contiene squadra, serie, girone e convocati della ricerca.",
    roles: ADMINS,
  },
  {
    id: "admin-notifiche",
    category: "Amministrazione",
    question: "Come configuro le notifiche?",
    answer: "Vai su Admin → Notifiche per scegliere quali eventi inviare, a quali destinatari e su quali canali (email e Telegram).",
    roles: ADMINS,
  },

  // ===== Solo superadmin =====
  {
    id: "superadmin-fitet",
    category: "Sistema",
    question: "Dove trovo i dati FITET in tempo reale?",
    answer: "Nella pagina Classifica FITET e nelle pagine campionato del club, i dati vengono letti in tempo reale dal portale risultati FITET: classifica, calendario e atleti.",
    roles: SUPERADMIN,
  },
  {
    id: "superadmin-sys",
    category: "Sistema",
    question: "Cosa trovo nell'area SYS?",
    answer: "Nell'area SYS trovi le impostazioni di sistema: l'accesso con Google OAuth (attivabile o disattivabile) e la gestione dell'auto-booking per utente.",
    roles: SUPERADMIN,
  },
  {
    id: "superadmin-calendario",
    category: "Sistema",
    question: "A cosa serve il Calendario Avanzato?",
    answer: "È la vista completa del calendario, riservata al superadmin, per controllare slot e prenotazioni senza i filtri della vista utente.",
    roles: SUPERADMIN,
  },
];

export function getFaqForRole(role: UserRole | string | undefined): FaqItem[] {
  if (role === "superadmin") return FAQ_ITEMS;
  return FAQ_ITEMS.filter((item) => item.roles.includes(role as UserRole));
}
