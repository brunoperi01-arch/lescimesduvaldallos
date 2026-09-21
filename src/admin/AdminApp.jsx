import { useEffect, useReducer, useRef, useState } from "react";
import { getSession, login as apiLogin, logout as apiLogout, getState, saveDraft, publish, listVersions, restore } from "../lib/cms";
import { ApiError } from "../lib/apiClient";
import { Helmet } from "react-helmet-async";
import { useFocusTrap } from "../lib/focusTrap";
import { Link } from "react-router-dom";
import { validateContent, checkPublishable } from "../lib/contentSchema";
import { Field, ColorField, SelectField, ImageField, ListEditor } from "./fields";
import "./admin.css";

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession().then((s) => setSession(s)).catch(() => setSession(null)).finally(() => setReady(true));
  }, []);

  if (!ready) return <Centered>Chargement…</Centered>;
  if (!session) return <Login onLoggedIn={setSession} />;
  return <Editor onSessionLost={() => setSession(null)} />;
}

function Centered({ children }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>{children}</div>;
}

function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await apiLogin(email, pwd); const s = await getSession(); onLoggedIn(s); }
    catch (e) {
      if (e && e.status === 429) setErr("Trop de tentatives, réessayez plus tard.");
      else if (e && e.status === 401) setErr("Identifiants invalides.");
      else if (e && e.status === 0) setErr("Réseau indisponible.");
      else setErr("Erreur serveur, réessayez.");
    } finally { setBusy(false); }
  }
  return (
    <div className="adm-login">
      <form onSubmit={submit}>
        <h1>Administration — Les Cimes</h1>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required /></label>
        {err && <p className="adm-err">{err}</p>}
        <button type="submit" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
        <p className="adm-hint">Aucune inscription publique. Comptes administrateurs créés côté serveur et enregistrés dans <code>cimes_admins</code>.</p>
      </form>
    </div>
  );
}

function Editor({ onSessionLost }) {
  const draftRef = useRef(null);
  const [publishedVersion, setPublishedVersion] = useState(0);
  const [draftRevision, setDraftRevision] = useState(0);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const conflictRef = useRef(null);
  useFocusTrap(conflict, conflictRef, () => setConflict(false));
  const [screen, setScreen] = useState("residence");
  const [editingPage, setEditingPage] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Chargement…");
  const [loaded, setLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [, force] = useReducer((x) => x + 1, 0);

  const onDirty = () => setDirty(true);

  useEffect(() => {
    (async () => {
      try {
        const st = await getState();
        setPublishedVersion(st.publishedVersion);
        setDraftRevision(st.draftRevision);
        draftRef.current = st.draftContent;
        if (!draftRef.current) { setStatus("Aucun contenu. Lancez le seed (voir README-ADMIN)."); return; }
        setLoaded(true);
        setStatus(`Publié v${st.publishedVersion} · brouillon r${st.draftRevision}`);
      } catch (e) { setStatus("Erreur : " + e.message); }
    })();
  }, []);

  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function doSave() {
    const check = validateContent(draftRef.current);
    if (!check.success) { alert("Contenu invalide : " + check.error.issues[0]?.message); return; }
    if (busy) return; setBusy(true);
    try {
      const rev = await saveDraft(draftRef.current, draftRevision, publishedVersion);
      setDraftRevision(rev); setDirty(false); setStatus(`Brouillon enregistré \u2713 (r${rev})`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true);
      else if (e instanceof ApiError && e.status === 401) onSessionLost();
      else alert(e instanceof ApiError ? e.message : "Erreur réseau : réessayez.");
    } finally { setBusy(false); }
  }

  async function doPublish() {
    const check = validateContent(draftRef.current);
    if (!check.success) { alert("Contenu invalide : " + check.error.issues[0]?.message); return; }
    if (busy) return;
    if (dirty) { alert("Enregistrez d'abord le brouillon avant de publier."); return; }
    const local = checkPublishable(draftRef.current);
    if (local.length) { alert("Publication bloquée :\n\n- " + local.join("\n- ")); return; }
    if (!confirm("Publier le brouillon enregistré ? Il deviendra visible par le public.")) return;
    setBusy(true);
    try {
      const newV = await publish(publishedVersion, draftRevision);
      const st = await getState();
      setPublishedVersion(st.publishedVersion); setDraftRevision(st.draftRevision);
      setStatus(`Publié \u2713 (version ${newV})`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true);
      else if (e instanceof ApiError && e.status === 422 && Array.isArray(e.blockers)) alert("Publication bloquée :\n\n- " + e.blockers.join("\n- "));
      else if (e instanceof ApiError && e.status === 401) onSessionLost();
      else alert(e instanceof ApiError ? e.message : "Erreur réseau : réessayez.");
    } finally { setBusy(false); }
  }

  if (!loaded) return <Centered>{status}</Centered>;
  const d = draftRef.current;

  return (
    <div className="adm">
      <Helmet><meta name="robots" content="noindex, nofollow" /><title>Administration — Les Cimes</title></Helmet>
      <header className="adm-top">
        <div><strong>Contenu du site</strong><span className="adm-status">{dirty ? "● modifications non enregistrées" : status}</span></div>
        <div className="adm-tools">
          <Link className="adm-link" to="/admin/preview" target="_blank" rel="noopener">Aperçu privé</Link>
          <button type="button" onClick={() => setShowHistory(true)}>Historique</button>
          <button type="button" onClick={doSave} className="save" disabled={busy}>Enregistrer le brouillon</button>
          <button type="button" onClick={doPublish} className="pub" disabled={dirty || busy} title={dirty ? "Enregistrez d\u2019abord le brouillon" : ""}>{busy ? "\u2026" : "Publier"}</button>
          <button type="button" onClick={async () => { await apiLogout(); onSessionLost(); }} className="ghost">Déconnexion</button>
        </div>
      </header>

      <div className="adm-body">
        <aside>
          {[["residence","Résidence"],["reglages","Réglages saison"],["hiver","Saison hiver"],["ete","Saison été"],
            ["hebergements","Hébergements"],["services","Services"],["pages","Pages"],["legal","Mentions légales"]]
            .map(([id, lab]) => (
              <button type="button" key={id} className={screen === id ? "on" : ""} onClick={() => { setScreen(id); setEditingPage(null); }}>{lab}</button>
            ))}
        </aside>
        <main>
          {screen === "residence" && <Residence d={d} onDirty={onDirty} />}
          {screen === "reglages" && <Reglages d={d} onDirty={onDirty} />}
          {screen === "hiver" && <Saison s={d.seasons.hiver} onDirty={onDirty} rerender={force} />}
          {screen === "ete" && <Saison s={d.seasons.ete} onDirty={onDirty} rerender={force} />}
          {screen === "hebergements" && <Hebergements d={d} onDirty={onDirty} rerender={force} />}
          {screen === "services" && <Services d={d} onDirty={onDirty} rerender={force} />}
          {screen === "pages" && <Pages d={d} onDirty={onDirty} rerender={force} editingPage={editingPage} setEditingPage={setEditingPage} />}
          {screen === "legal" && <Legal d={d} onDirty={onDirty} />}
        </main>
      </div>

      {conflict && (
        <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Conflit de version"><div className="adm-modal-in" role="document" ref={conflictRef}>
          <h3>Conflit détecté</h3>
          <p>Le contenu a été modifié par une autre session (ou une autre publication a eu lieu). Pour éviter d'écraser ce travail, rechargez la dernière version.</p>
          <button type="button" className="af-mini add" onClick={() => window.location.reload()}>Recharger la dernière version</button>
        </div></div>
      )}
      {showHistory && <History publishedVersion={publishedVersion} draftRevision={draftRevision} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

/* ---------- Écrans ---------- */
function H({ t, s }) { return <><h2>{t}</h2><p className="adm-sub">{s}</p></>; }

function Residence({ d, onDirty }) {
  const r = d.residence;
  return <>
    <H t="Résidence" s="Coordonnées et liens, utilisés partout sur le site." />
    <Field label="Nom commercial" obj={r} k="nom" onDirty={onDirty} />
    <Field label="Raison sociale" obj={r} k="raisonSociale" onDirty={onDirty} />
    <Field label="Adresse" obj={r} k="adresse" onDirty={onDirty} />
    <Field label="Téléphone" obj={r} k="telephone" onDirty={onDirty} />
    <Field label="E-mail" obj={r} k="email" onDirty={onDirty} />
    <Field label="Lien réservation (Resalys)" obj={r} k="resalys" onDirty={onDirty} />
    <Field label="Lien espace client" obj={r} k="resalysClient" onDirty={onDirty} />
    <Field label="Lien état des lieux" obj={r} k="etatDesLieux" onDirty={onDirty} />
    <Field label="Lien coffrets cadeaux" obj={r} k="coffrets" onDirty={onDirty} />
  </>;
}

function Reglages({ d, onDirty }) {
  return <>
    <H t="Réglages saison" s="Saison affichée par défaut." />
    <SelectField label="Saison affichée" obj={d} k="seasonOverride" onDirty={onDirty}
      options={[["auto","Automatique (selon la date)"],["hiver","Forcer l'hiver"],["ete","Forcer l'été"]]} />
  </>;
}

function Saison({ s, onDirty, rerender }) {
  return <>
    <H t="Saison" s="Contenu affiché quand cette saison est active." />
    <div className="af-row2"><ColorField label="Couleur d'accent" obj={s} k="accent" onDirty={onDirty} /><ColorField label="Accent foncé" obj={s} k="accentDeep" onDirty={onDirty} /></div>
    <h3 className="adm-sub2">Bandeau d'accueil</h3>
    <ImageField label="Photo du hero" obj={s.hero} k="image" onDirty={onDirty} />
    <Field label="Sur-titre" obj={s.hero} k="eyebrow" onDirty={onDirty} />
    <Field label="Titre" obj={s.hero} k="titre" onDirty={onDirty} />
    <Field label="Sous-titre" obj={s.hero} k="sousTitre" multiline onDirty={onDirty} />
    <h3 className="adm-sub2">Piliers</h3>
    <ListEditor arr={s.pillars || (s.pillars = [])} onDirty={onDirty} rerender={rerender}
      newItem={() => ({ k: "", h: "", p: "" })} addLabel="Ajouter un pilier"
      render={(p) => <><Field label="Étiquette" obj={p} k="k" onDirty={onDirty} /><Field label="Titre" obj={p} k="h" onDirty={onDirty} /><Field label="Texte" obj={p} k="p" multiline onDirty={onDirty} /></>} />
  </>;
}

function Hebergements({ d, onDirty, rerender }) {
  return <>
    <H t="Hébergements" s="Les types d'appartements présentés." />
    <ListEditor arr={d.hebergements} onDirty={onDirty} rerender={rerender}
      newItem={() => ({ tag: "", meta: "", h: "", p: "", img: "", alt: "" })} addLabel="Ajouter un hébergement"
      render={(c) => <><div className="af-row2"><Field label="Badge" obj={c} k="tag" onDirty={onDirty} /><Field label="Détail" obj={c} k="meta" onDirty={onDirty} /></div><Field label="Titre" obj={c} k="h" onDirty={onDirty} /><Field label="Description" obj={c} k="p" multiline onDirty={onDirty} /><ImageField label="Photo" obj={c} k="img" onDirty={onDirty} /></>} />
  </>;
}

function Services({ d, onDirty, rerender }) {
  return <>
    <H t="Services et équipements" s="La grille de services." />
    <ListEditor arr={d.services} onDirty={onDirty} rerender={rerender}
      newItem={() => ({ i: "", h: "", p: "" })} addLabel="Ajouter un service"
      render={(s) => <><div className="af-row2"><Field label="Icône" obj={s} k="i" onDirty={onDirty} /><Field label="Titre" obj={s} k="h" onDirty={onDirty} /></div><Field label="Texte" obj={s} k="p" onDirty={onDirty} /></>} />
  </>;
}

function Pages({ d, onDirty, rerender, editingPage, setEditingPage }) {
  if (!d.pages) d.pages = [];
  if (editingPage !== null && d.pages[editingPage]) {
    const p = d.pages[editingPage];
    if (!p.sections) p.sections = [];
    return <>
      <button type="button" className="af-mini" onClick={() => setEditingPage(null)}>← Retour</button>
      <H t="Éditer la page" s={"Visible sur /" + (p.slug || "")} />
      <Field label="Titre" obj={p} k="title" onDirty={onDirty} />
      <Field label="Adresse (slug)" obj={p} k="slug" onDirty={onDirty} />
      <Field label="Description SEO" obj={p} k="metaDescription" multiline onDirty={onDirty} />
      <h3 className="adm-sub2">Sections</h3>
      <ListEditor arr={p.sections} onDirty={onDirty} rerender={rerender}
        newItem={() => ({ type: "text", titre: "", contenu: "" })} addLabel="Ajouter une section"
        render={(sec) => <>
          <SelectField label="Type" obj={sec} k="type" onDirty={() => { onDirty(); rerender(); }}
            options={[["hero","Bandeau"],["text","Texte"],["image","Image"],["cta","Bouton"]]} />
          {sec.type === "hero" && <><Field label="Titre" obj={sec} k="titre" onDirty={onDirty} /><Field label="Sous-titre" obj={sec} k="sousTitre" multiline onDirty={onDirty} /><ImageField label="Image" obj={sec} k="image" onDirty={onDirty} /></>}
          {sec.type === "image" && <><ImageField label="Image" obj={sec} k="image" onDirty={onDirty} /><Field label="Légende" obj={sec} k="legende" onDirty={onDirty} /></>}
          {sec.type === "cta" && <><Field label="Titre" obj={sec} k="titre" onDirty={onDirty} /><Field label="Texte du bouton" obj={sec} k="texte" onDirty={onDirty} /><Field label="Lien" obj={sec} k="lien" onDirty={onDirty} /></>}
          {(!sec.type || sec.type === "text") && <><Field label="Titre" obj={sec} k="titre" onDirty={onDirty} /><Field label="Contenu" obj={sec} k="contenu" multiline onDirty={onDirty} /></>}
        </>} />
    </>;
  }
  return <>
    <H t="Pages" s="Crée et édite des pages du site." />
    {d.pages.map((p, i) => (
      <div className="adm-page-row" key={i}>
        <div><strong>{p.title || "(sans titre)"}</strong><div className="adm-sub">/{p.slug}</div></div>
        <div className="af-actions">
          <button type="button" className="af-mini add" onClick={() => setEditingPage(i)}>Éditer</button>
          <button type="button" className="af-mini del" onClick={() => { if (confirm("Supprimer ?")) { d.pages.splice(i, 1); onDirty(); rerender(); } }}>Supprimer</button>
        </div>
      </div>
    ))}
    <button type="button" className="af-mini add" onClick={() => { d.pages.push({ slug: "nouvelle-page", title: "Nouvelle page", metaDescription: "", sections: [] }); onDirty(); rerender(); }}>+ Ajouter une page</button>
  </>;
}

function Legal({ d, onDirty }) {
  if (!d.legal) d.legal = {};
  const L = d.legal;
  return <>
    <H t="Mentions légales (champs structurés)" s="Les corps juridiques restent révisés dans le dépôt. Ici, seuls les champs sûrs." />
    <Field label="Raison sociale" obj={L} k="raisonSociale" onDirty={onDirty} />
    <Field label="Capital" obj={L} k="capital" onDirty={onDirty} />
    <Field label="RCS" obj={L} k="rcs" onDirty={onDirty} />
    <Field label="SIRET" obj={L} k="siret" onDirty={onDirty} />
    <Field label="TVA" obj={L} k="tva" onDirty={onDirty} />
    <Field label="Atout France" obj={L} k="atoutFrance" onDirty={onDirty} />
    <Field label="Garant financier" obj={L} k="garantFinancier" onDirty={onDirty} />
    <Field label="RCP" obj={L} k="rcp" onDirty={onDirty} />
    <Field label="Médiateur (laisser vide si non confirmé)" obj={L} k="mediateur" onDirty={onDirty} />
  </>;
}

function History({ onClose, publishedVersion, draftRevision }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [restoring, setRestoring] = useState(false);
  const modalRef = useRef(null);
  useFocusTrap(true, modalRef, onClose);
  useEffect(() => { listVersions().then(setRows).catch((e) => setErr(e.message)); }, []);
  async function doRestore(id) {
    if (restoring) return;   // anti double-clic
    if (!confirm("Restaurer cette version ? Elle sera publiée comme nouvelle version.")) return;
    setRestoring(true);
    try {
      await restore(publishedVersion, draftRevision, id);
      window.location.reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setErr("Conflit : une autre modification a eu lieu, fermez et rechargez.");
      else if (e instanceof ApiError && e.status === 422 && Array.isArray(e.blockers)) setErr("Restauration bloquée : " + e.blockers.join(" · "));
      else if (e instanceof ApiError && e.status === 401) onClose();
      else setErr(e instanceof ApiError ? e.message : "Erreur réseau : réessayez.");
      setRestoring(false);
    }
  }
  return (
    <div className="adm-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="adm-modal-in" role="document" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <h3>Historique des versions</h3>
        {err && <p className="adm-err">{err}</p>}
        {!rows ? <p>Chargement…</p> : rows.length === 0 ? <p>Aucune version.</p> : (
          <table><thead><tr><th>Version</th><th>Action</th><th>Date</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}><td>{r.version}</td><td>{r.action}</td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleString("fr-FR") : ""}</td>
                <td><button type="button" className="af-mini" disabled={restoring} onClick={() => doRestore(r.id)}>{restoring ? "\u2026" : "Restaurer"}</button></td></tr>
            ))}</tbody></table>
        )}
        <button type="button" className="af-mini" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
