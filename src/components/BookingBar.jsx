import { useState } from "react";
import { bookResalys } from "../lib/bookResalys";

export default function BookingBar() {
  const today = new Date().toISOString().split("T")[0];
  const [dateIn, setIn] = useState("");
  const [dateOut, setOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [error, setError] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (!dateIn || !dateOut) { setError("Merci d'indiquer vos dates d'arrivée et de départ."); return; }
    if (dateOut <= dateIn) { setError("La date de départ doit être postérieure à la date d'arrivée."); return; }
    setError("");
    bookResalys({ dateIn, dateOut, adults });
  }

  return (
    <div className="booking-wrap"><div className="wrap">
      <form className="booking" onSubmit={onSubmit} noValidate aria-label="Rechercher un séjour" aria-invalid={error ? "true" : undefined} aria-describedby={error ? "bk-error" : undefined}>
        <div className="bk-field">
          <label htmlFor="bk-in">Arrivée</label>
          <input id="bk-in" name="arrivee" type="date" min={today} required value={dateIn} onChange={(e) => setIn(e.target.value)} />
        </div>
        <div className="bk-field">
          <label htmlFor="bk-out">Départ</label>
          <input id="bk-out" name="depart" type="date" min={dateIn || today} required value={dateOut} onChange={(e) => setOut(e.target.value)} />
        </div>
        <div className="bk-field">
          <label htmlFor="bk-adults">Adultes</label>
          <select id="bk-adults" name="adultes" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
            {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} {n>1?"personnes":"personne"}</option>)}
          </select>
        </div>
        <button className="bk-btn" type="submit">Voir les disponibilités</button>
      </form>
      {error && <p id="bk-error" className="bk-error" role="alert">{error}</p>}
    </div></div>
  );
}
