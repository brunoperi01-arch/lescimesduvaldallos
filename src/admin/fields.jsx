import { useRef, useState } from "react";
import { uploadMedia } from "../lib/cms";

// Clé stable par RÉFÉRENCE d'objet (WeakMap) : suit l'élément lors des
// déplacements sans écrire d'identifiant dans le contenu publié.
const _idMap = new WeakMap();
let _seq = 0;
export function keyFor(obj) {
  if (obj === null || typeof obj !== "object") return String(obj);
  if (!_idMap.has(obj)) _idMap.set(obj, "k" + ++_seq);
  return _idMap.get(obj);
}

// Champs CONTRÔLÉS : la valeur affichée reste liée au bon objet.
export function Field({ label, obj, k, multiline, onDirty }) {
  const [v, setV] = useState(obj[k] ?? "");
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className="af">
      <label>{label}</label>
      <Tag value={v} onChange={(e) => { setV(e.target.value); obj[k] = e.target.value; onDirty(); }} />
    </div>
  );
}

export function ColorField({ label, obj, k, onDirty }) {
  const [v, setV] = useState(obj[k] || "#004068");
  const set = (val) => { setV(val); obj[k] = val; onDirty(); };
  return (
    <div className="af">
      <label>{label}</label>
      <div className="af-row">
        <input type="color" value={v} onChange={(e) => set(e.target.value)} />
        <input type="text" value={v} onChange={(e) => set(e.target.value || "#004068")} />
      </div>
    </div>
  );
}

export function SelectField({ label, obj, k, options, onDirty }) {
  const [v, setV] = useState(obj[k] ?? "");
  return (
    <div className="af">
      <label>{label}</label>
      <select value={v} onChange={(e) => { setV(e.target.value); obj[k] = e.target.value; onDirty(); }}>
        {options.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
      </select>
    </div>
  );
}

// Champ image : URL contrôlée + import + aperçu + alt contrôlé (obligatoire).
export function ImageField({ label, obj, k, altKey = "alt", onDirty }) {
  const [url, setUrl] = useState(obj[k] || "");
  const [alt, setAlt] = useState(obj[altKey] || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef();

  async function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setErr("");
    try {
      const publicUrl = await uploadMedia(f);
      obj[k] = publicUrl; setUrl(publicUrl); onDirty();
    } catch (ex) { setErr(ex.message || "Échec de l'envoi."); }
    finally { setBusy(false); }
  }

  return (
    <div className="af">
      <label>{label}</label>
      <div className="af-row">
        {url ? <img className="af-thumb" src={url} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : <div className="af-thumb ph" />}
        <div style={{ flex: 1 }}>
          <input type="text" value={url} placeholder="/images/… ou URL"
                 onChange={(e) => { setUrl(e.target.value); obj[k] = e.target.value; onDirty(); }} />
          <div className="af-imgbtns">
            <button type="button" className="af-btn" disabled={busy} onClick={() => fileRef.current.click()}>
              {busy ? "Envoi…" : "Importer une photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} />
          </div>
          {err && <div className="af-err">{err}</div>}
        </div>
      </div>
      <input className="af-alt" type="text" placeholder="Texte alternatif (obligatoire)"
             value={alt} onChange={(e) => { setAlt(e.target.value); obj[altKey] = e.target.value; onDirty(); }} />
    </div>
  );
}

// Listes : clés STABLES (keyFor) — le déplacement ne permute plus les valeurs.
export function ListEditor({ arr, render, newItem, addLabel, onDirty, rerender }) {
  return (
    <div>
      {arr.map((item, i) => (
        <div className="af-card" key={keyFor(item)}>
          <div className="af-card-h">
            <strong>#{i + 1}</strong>
            <div className="af-actions">
              <button type="button" className="af-mini" aria-label="Monter" onClick={() => { if (i > 0) { const t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; onDirty(); rerender(); } }}>↑</button>
              <button type="button" className="af-mini" aria-label="Descendre" onClick={() => { if (i < arr.length - 1) { const t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; onDirty(); rerender(); } }}>↓</button>
              <button type="button" className="af-mini del" onClick={() => { arr.splice(i, 1); onDirty(); rerender(); }}>Supprimer</button>
            </div>
          </div>
          {render(item)}
        </div>
      ))}
      <button type="button" className="af-mini add" onClick={() => { arr.push(newItem()); onDirty(); rerender(); }}>+ {addLabel}</button>
    </div>
  );
}
