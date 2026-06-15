import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './Inscriptions.css';

export default function Inscriptions() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [dias, setDias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.uuid) return;
    axios.get(`/api/student/dias/${auth.uuid}`, { headers: apiHeaders })
      .then(r => {
        const sorted = [...(r.data || [])].sort((a, b) => b.anneeAcademiqueId - a.anneeAcademiqueId);
        setDias(sorted);
      })
      .catch(() => setError(t.inscriptions.errorLoad))
      .finally(() => setLoading(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="inscriptions-page">
      <div className="page-header">
        <div>
          <h1>{t.inscriptions.title}</h1>
          <p className="page-subtitle">{dias.length} {t.inscriptions.subtitle}</p>
        </div>
      </div>

      {dias.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>{t.inscriptions.none}</p>
        </div>
      ) : (
        <div className="ins-cards">
          {dias.map(dia => (
            <div key={dia.id} className="ins-card">
              <div className="ins-card-header">
                <div className="ins-card-icon"><GradIcon /></div>
                <div>
                  <div className="ins-card-year">{dia.anneeAcademiqueCode}</div>
                  <div className="ins-card-level">{ar ? dia.niveauLibelleLongAr : dia.niveauLibelleLongLt}</div>
                </div>
              </div>
              <div className="ins-card-body">
                <InsRow label={t.inscriptions.numInscription} value={dia.numeroInscription} mono />
                <InsRow label={t.inscriptions.etablissement}  value={ar ? dia.llEtablissementArabe  : dia.llEtablissementLatin} arabic={ar} />
                <InsRow label={t.inscriptions.niveau}         value={ar ? dia.niveauLibelleLongAr   : dia.niveauLibelleLongLt} arabic={ar} />
                <InsRow label={t.inscriptions.cycle}          value={ar ? dia.refLibelleCycleAr     : dia.refLibelleCycle} arabic={ar} />
                <InsRow label={t.inscriptions.domaine}        value={ar ? dia.ofLlDomaineArabe      : dia.ofLlDomaine} arabic={ar} />
                <InsRow label={t.inscriptions.filiere}        value={ar ? dia.ofLlFiliereArabe      : dia.ofLlFiliere} arabic={ar} />
                {(ar ? dia.ofLlSpecialiteArabe : dia.ofLlSpecialite) && (
                  <InsRow label={t.inscriptions.specialite} value={ar ? dia.ofLlSpecialiteArabe : dia.ofLlSpecialite} arabic={ar} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsRow({ label, value, mono, arabic }) {
  if (!value) return null;
  return (
    <div className="ins-row">
      <span className="ins-label">{label}</span>
      <span className={`ins-value${mono ? ' mono' : ''}${arabic ? ' arabic' : ''}`}>{value}</span>
    </div>
  );
}

function GradIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
}
