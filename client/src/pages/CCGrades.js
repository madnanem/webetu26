import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './CCGrades.css';

function gradeClass(m) {
  if (m == null) return '';
  return m >= 10 ? 'grade-pass' : 'grade-fail';
}

export default function CCGrades() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [dias, setDias] = useState([]);
  const [selectedDia, setSelectedDia] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDias, setLoadingDias] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.uuid) return;
    axios.get(`/api/student/dias/${auth.uuid}`, { headers: apiHeaders })
      .then(r => {
        const sorted = [...(r.data || [])].sort((a, b) => b.anneeAcademiqueId - a.anneeAcademiqueId);
        setDias(sorted);
        if (sorted.length > 0) setSelectedDia(sorted[0].id);
      })
      .catch(() => setError(t.ccgrades.errorLoad))
      .finally(() => setLoadingDias(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  useEffect(() => {
    if (!selectedDia) return;
    setLoading(true);
    setError('');
    setGrades([]);
    axios.get(`/api/student/ccgrades/${selectedDia}`, { headers: apiHeaders })
      .then(r => setGrades(r.data || []))
      .catch(e => setError(e.response?.status === 404 ? t.ccgrades.noData : t.ccgrades.errorLoad))
      .finally(() => setLoading(false));
  }, [selectedDia, apiHeaders]); // eslint-disable-line

  // Group by period
  const byPeriod = grades.reduce((acc, g) => {
    const key = g.llPeriode || g.llPeriodeAr || 'other';
    if (!acc[key]) acc[key] = { label: ar ? (g.llPeriodeAr || g.llPeriode) : g.llPeriode, items: [] };
    acc[key].items.push(g);
    return acc;
  }, {});

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(ar ? 'ar-DZ' : 'en-GB') : '—';

  return (
    <div className="ccgrades-page">
      <div className="page-header">
        <div>
          <h1>{t.ccgrades.title}</h1>
          <p className="page-subtitle">{t.ccgrades.subtitle}</p>
        </div>
      </div>

      {!loadingDias && dias.length > 0 && (
        <div className="year-pills">
          {dias.map(d => (
            <button key={d.id} className={`year-pill ${selectedDia == d.id ? 'active' : ''}`}
              onClick={() => setSelectedDia(d.id)}>
              {d.anneeAcademiqueCode}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="page-loader"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && Object.entries(byPeriod).map(([key, period]) => (
        <div key={key} className="card cc-period-card">
          <div className="cc-period-header">{period.label || key}</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.ccgrades.matiere}</th>
                  <th>{t.ccgrades.type}</th>
                  <th style={{ textAlign: 'right' }}>{t.ccgrades.note}</th>
                  <th>{t.ccgrades.observation}</th>
                </tr>
              </thead>
              <tbody>
                {period.items.map((g, i) => (
                  <tr key={i} className={g.absent ? 'row-absent' : ''}>
                    <td>
                      <div>{ar ? g.rattachementMcMcLibelleAr : g.rattachementMcMcLibelleFr}</div>
                    </td>
                    <td>
                      {g.apCode && <span className="ap-chip">{g.apCode}</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {g.absent
                        ? <span className="absent-tag">{t.ccgrades.absent}</span>
                        : <span className={`grade-pill ${gradeClass(g.note)}`}>
                            {g.note != null ? Number(g.note).toFixed(2) : '—'}
                          </span>}
                    </td>
                    <td>
                      <div className="cc-obs">{g.observation || '—'}</div>
                      {g.autorisationDemandeRecours && (
                        <div className="appeal-info">
                          <span className="appeal-badge">⚠ Appeal</span>
                          <span className="appeal-dates">
                            {formatDate(g.dateDebutDepotRecours)} → {formatDate(g.dateLimiteDepotRecours)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!loading && !error && grades.length === 0 && selectedDia && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <p>{t.ccgrades.noData}</p>
        </div>
      )}
    </div>
  );
}
