export const metadata = {
  title: "Privacy Policy — Fortitudo Busnago Tennistavolo",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 prose prose-slate">
      <h1 className="text-3xl font-bold text-navy-800">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Ultimo aggiornamento: 30 settembre 2026</p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il presente sito (l&apos;&quot;App&quot;) è gestito da{" "}
        <strong>Polisportiva Fortitudo</strong> (sezione Tennistavolo —
        Fortitudo Busnago), per finalità di gestione delle prenotazioni degli
        allenamenti e delle attività sportive del club.
      </p>
      <p>
        Per qualsiasi richiesta relativa al trattamento dei dati personali, è
        possibile contattare il Titolare all&apos;indirizzo email:{" "}
        <a href="mailto:infotennistavolo@gmail.com">
          infotennistavolo@gmail.com
        </a>
      </p>

      <h2>2. Dati raccolti</h2>
      <p>Nell&apos;utilizzo dell&apos;App raccogliamo:</p>
      <ul>
        <li>Nome, cognome ed email dell&apos;utente (registrazione account)</li>
        <li>Dati di prenotazione degli allenamenti (data, orario, slot)</li>
        <li>Dati relativi a campionati, squadre e partite (se applicabile)</li>
      </ul>

      <h2>3. Integrazione con Google Drive (solo amministratori)</h2>
      <p>
        Gli utenti con ruolo di amministratore possono collegare il proprio
        account Google per gestire documenti del club (es. moduli, certificati,
        regolamenti) archiviati in una cartella dedicata di Google Drive.
        L&apos;App richiede i seguenti permessi Google (scope OAuth):
      </p>
      <ul>
        <li>
          <code>drive.file</code> — consente all&apos;App di creare e gestire
          esclusivamente i file caricati tramite l&apos;App stessa.
        </li>
        <li>
          <code>drive.readonly</code> — consente all&apos;App di leggere
          l&apos;elenco dei file presenti nella specifica cartella Google Drive
          dedicata al club, per permettere all&apos;amministratore di
          selezionarli senza doverli ricaricare manualmente.
        </li>
      </ul>
      <p>
        L&apos;App non accede, legge né condivide alcun file al di fuori della
        cartella dedicata al club. Nessun dato di Google Drive viene condiviso
        con terze parti. L&apos;accesso a queste funzionalità è riservato ai
        soli amministratori autorizzati del club.
      </p>

      <h2>4. Finalità del trattamento</h2>
      <p>
        I dati raccolti sono utilizzati esclusivamente per la gestione delle
        prenotazioni, la comunicazione relativa alle attività del club e,
        per gli amministratori, la gestione documentale interna.
      </p>

      <h2>5. Conservazione dei dati</h2>
      <p>
        I dati sono conservati per il tempo necessario alle finalità sopra
        indicate e comunque non oltre la cessazione del rapporto associativo
        con il club, salvo obblighi di legge.
      </p>

      <h2>6. Diritti dell&apos;utente</h2>
      <p>
        L&apos;utente può richiedere in qualsiasi momento l&apos;accesso,
        la rettifica o la cancellazione dei propri dati scrivendo a{" "}
        <a href="mailto:infotennistavolo@gmail.com">
          infotennistavolo@gmail.com
        </a>
        .
      </p>

      <h2>7. Contatti</h2>
      <p>
        Per qualsiasi domanda relativa alla presente informativa, è possibile
        contattare Polisportiva Fortitudo all&apos;indirizzo{" "}
        <a href="mailto:infotennistavolo@gmail.com">
          infotennistavolo@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
