import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './BacNotes.css';

export default function BacNotes() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [notes, setNotes] = useState([]);
  const [bacInfo, setBacInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.uuid) return;
    Promise.all([
      axios.get(`/api/student/notes/${auth.uuid}`, { headers: apiHeaders }).catch(() => null),
      axios.get(`/api/student/bac/${auth.uuid}`, { headers: apiHeaders }).catch(() => null),
    ]).then(([notesRes, bacRes]) => {
      if (notesRes?.data) setNotes(Array.isArray(notesRes.data) ? notesRes.data : [notesRes.data]);
      if (bacRes?.data && typeof bacRes.data === 'object' && !bacRes.data.error) setBacInfo(bacRes.data);
    })
    .catch(() => setError(t.bacnotes.errorLoad))
    .finally(() => setLoading(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="bacnotes-page">
      <div className="page-header">
        <div>
          <h1>{t.bacnotes.title}</h1>
          <p className="page-subtitle">{t.bacnotes.subtitle}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* BAC Dossier Info */}
      {bacInfo && (
        <div className="bac-info-card card">
          <h3 className="section-heading">{ar ? 'معلومات البكالوريا' : 'Informations BAC'}</h3>
          <div className="bac-info-body">
            {bacInfo.moyenneBac && (
              <div className="bac-stat">
                <span className="bac-stat-label">{ar ? 'معدل البكالوريا' : 'Moyenne BAC'}</span>
                <span className={`bac-stat-value ${Number(bacInfo.moyenneBac) >= 10 ? 'grade-pass' : 'grade-fail'}`}>{Number(bacInfo.moyenneBac).toFixed(2)}</span>
              </div>
            )}
            {bacInfo.anneeBac && (
              <div className="bac-stat">
                <span className="bac-stat-label">{ar ? 'سنة البكالوريا' : 'Année BAC'}</span>
                <span className="bac-stat-value">{bacInfo.anneeBac}</span>
              </div>
            )}
            {(bacInfo.libelleSerieBac || bacInfo.Matricule) && (
              <div className="bac-stat">
                <span className="bac-stat-label">{ar ? 'السلسلة' : 'Série'}</span>
                <span className="bac-stat-value">{bacInfo.libelleSerieBac || bacInfo.refCodeSerieBac}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes table */}
      {notes.length > 0 ? (
        <div className="card">
          <h3 className="section-heading">{ar ? 'نقاط المواد' : 'Notes par matière'}</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.bacnotes.matiere}</th>
                  <th style={{ textAlign: 'right' }}>{t.bacnotes.note}</th>
                  {notes[0]?.AnneeBac && <th style={{ textAlign: 'right' }}>{t.bacnotes.annee}</th>}
                </tr>
              </thead>
              <tbody>
                {notes.map((n, i) => (
                  <tr key={i}>
                    <td>{n.refCodeMatiereLibelleFr || n.refCodeMatiere}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`grade-pill ${Number(n.Note) >= 10 ? 'grade-pass' : 'grade-fail'}`}>
                        {Number(n.Note).toFixed(2)}
                      </span>
                    </td>
                    {n.AnneeBac && <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{n.AnneeBac}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <GradCapIcon />
            <p>{t.bacnotes.noData}</p>
          </div>
        )
      )}
    </div>
  );
}

function GradCapIcon() {
  return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
}
