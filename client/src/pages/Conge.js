import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './Conge.css';

export default function Conge() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [conges, setConges] = useState([]); // array of { anneeCode, anneeId, data }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.uuid) return;
    axios.get(`/api/student/dias/${auth.uuid}`, { headers: apiHeaders })
      .then(async r => {
        const dias = (r.data || []);
        const results = await Promise.all(
          dias.map(d =>
            axios.get(`/api/student/conge/${auth.uuid}/${d.anneeAcademiqueId}`, { headers: apiHeaders })
              .then(cr => ({ anneeCode: d.anneeAcademiqueCode, anneeId: d.anneeAcademiqueId, data: cr.data }))
              .catch(() => ({ anneeCode: d.anneeAcademiqueCode, anneeId: d.anneeAcademiqueId, data: null }))
          )
        );
        // Keep only years that have data (non-null, non-empty)
        const withData = results.filter(r => r.data && (Array.isArray(r.data) ? r.data.length > 0 : Object.keys(r.data).length > 0));
        setConges(withData);
      })
      .catch(() => setError(t.conge.errorLoad))
      .finally(() => setLoading(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (error) return <div className="error-banner">{error}</div>;

  // Normalize: item can be object or array element
  function renderCongeItem(item, idx) {
    if (!item || typeof item !== 'object') return null;
    // Support single object or array items
    const obj = Array.isArray(item) ? item : [item];
    return obj.map((c, i) => (
      <div key={i} className="conge-card card">
        <div className="conge-card-header">
          <CongeIcon />
          <span>{ar ? (c.ncTypeCongeLibelleLongAr || c.ncTypeCongeLibelleLongFr || t.conge.title) : (c.ncTypeCongeLibelleLongFr || t.conge.title)}</span>
        </div>
        <div className="conge-body">
          {c.niveauLibelleLongLt && (
            <div className="conge-row">
              <span className="cl">{ar ? 'المستوى' : 'Niveau'}</span>
              <span className="cv">{ar ? c.niveauLibelleLongAr : c.niveauLibelleLongLt}</span>
            </div>
          )}
          {(c.dateDebutDemande || c.dateDemande) && (
            <div className="conge-row">
              <span className="cl">{t.conge.dateDebut}</span>
              <span className="cv">{c.dateDebutDemande || c.dateDemande}</span>
            </div>
          )}
          {c.dateFinDemande && (
            <div className="conge-row">
              <span className="cl">{t.conge.dateFin}</span>
              <span className="cv">{c.dateFinDemande}</span>
            </div>
          )}
          {c.libelleSituation && (
            <div className="conge-row">
              <span className="cl">{t.conge.situation}</span>
              <span className="cv status-badge">{c.libelleSituation}</span>
            </div>
          )}
          {(c.demandeValidee !== undefined) && (
            <div className="conge-row">
              <span className="cl">{t.conge.resultat}</span>
              <span className={`cv status-badge ${c.demandeValidee ? 'badge-pass' : 'badge-pending'}`}>
                {c.demandeValidee ? (ar ? 'مُعتمد' : 'Validée') : (ar ? 'في الانتظار' : 'En attente')}
              </span>
            </div>
          )}
        </div>
      </div>
    ));
  }

  return (
    <div className="conge-page">
      <div className="page-header">
        <div>
          <h1>{t.conge.title}</h1>
          <p className="page-subtitle">{t.conge.subtitle}</p>
        </div>
      </div>

      {conges.length === 0 ? (
        <div className="empty-state">
          <CongeIcon size={48} />
          <p>{t.conge.noData}</p>
        </div>
      ) : (
        conges.map(c => (
          <div key={c.anneeId} className="conge-year-group">
            <h2 className="conge-year-title">{c.anneeCode}</h2>
            {Array.isArray(c.data)
              ? c.data.map((item, i) => renderCongeItem(item, i))
              : renderCongeItem(c.data, 0)
            }
          </div>
        ))
      )}
    </div>
  );
}

function CongeIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>;
}
