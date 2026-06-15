import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './ExamGrades.css';

function gradeClass(m) {
  if (m == null) return '';
  return m >= 10 ? 'grade-pass' : 'grade-fail';
}

function isResitSession(sessionName) {
  return /rattrap|2[eè]me|2ième|session\s*2|seconde/i.test(sessionName || '');
}

function GradeTable({ items, ar, t, formatDate }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>{t.examgrades.matiere}</th>
            <th>{t.examgrades.ue}</th>
            <th style={{ textAlign: 'right' }}>{t.examgrades.note}</th>
            <th>{t.examgrades.appeal}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((g, i) => (
            <tr key={i}>
              <td>{ar ? (g.mcLibelleAr || g.mcLibelleFr) : g.mcLibelleFr}</td>
              <td>
                {g.ueCode
                  ? <span className="ue-chip">{g.ueCode}</span>
                  : <span className="text-muted">—</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className={`grade-pill ${gradeClass(g.noteExamen)}`}>
                  {g.noteExamen != null ? Number(g.noteExamen).toFixed(2) : '—'}
                </span>
              </td>
              <td>
                {g.autorisationDemandeRecours ? (
                  <div className="appeal-info">
                    <span className="appeal-badge">⚠</span>
                    <span className="appeal-dates">
                      {formatDate(g.dateDebutDepotRecours)} → {formatDate(g.dateLimiteDepotRecours)}
                    </span>
                  </div>
                ) : <span className="text-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SemesterCard({ period, semNumber, ar, t, formatDate }) {
  const hasRegular = period.regular.length > 0;
  const hasResit   = period.resit.length > 0;
  // Default to whichever session exists first
  const [active, setActive] = useState(hasRegular ? 'regular' : 'resit');

  const items = active === 'regular' ? period.regular : period.resit;
  const semLabel = ar ? `الفصل ${semNumber}` : `Semester ${semNumber}`;

  return (
    <div className="card eg-period-card">
      <div className="eg-period-header">{semLabel}</div>

      {/* Session tabs — only show if both sessions exist */}
      {hasRegular && hasResit && (
        <div className="eg-tabs">
          <button
            className={`eg-tab ${active === 'regular' ? 'eg-tab-active eg-tab-regular' : ''}`}
            onClick={() => setActive('regular')}
          >
            {ar ? 'الدورة العادية' : 'Regular Session'}
          </button>
          <button
            className={`eg-tab ${active === 'resit' ? 'eg-tab-active eg-tab-resit' : ''}`}
            onClick={() => setActive('resit')}
          >
            {ar ? 'دورة الاستدراك' : 'Resit Session'}
          </button>
        </div>
      )}

      {/* Single-session label when only one type exists */}
      {!(hasRegular && hasResit) && (
        <div className="eg-single-label">
          <span className={`eg-session-type-badge ${hasResit ? 'eg-badge-resit' : 'eg-badge-regular'}`}>
            {hasResit
              ? (ar ? 'دورة الاستدراك' : 'Resit Session')
              : (ar ? 'الدورة العادية' : 'Regular Session')}
          </span>
        </div>
      )}

      <GradeTable items={items} ar={ar} t={t} formatDate={formatDate} />
    </div>
  );
}

export default function ExamGrades() {
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
      .catch(() => setError(t.examgrades.errorLoad))
      .finally(() => setLoadingDias(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  useEffect(() => {
    if (!selectedDia) return;
    setLoading(true);
    setError('');
    setGrades([]);
    axios.get(`/api/student/examgrades/${selectedDia}`, { headers: apiHeaders })
      .then(r => setGrades(r.data || []))
      .catch(e => setError(e.response?.status === 404 ? t.examgrades.noData : t.examgrades.errorLoad))
      .finally(() => setLoading(false));
  }, [selectedDia, apiHeaders]); // eslint-disable-line

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(ar ? 'ar-DZ' : 'en-GB') : '—';

  // Group grades by period, split into regular / resit
  const periodMap = {};
  grades.forEach(g => {
    const periodId = g.idPeriode ?? g.planningSessionId ?? 'other';
    if (!periodMap[periodId]) {
      periodMap[periodId] = { id: periodId, regular: [], resit: [] };
    }
    const sessionName = g.planningSessionIntitule || g.psIntitule || '';
    if (isResitSession(sessionName)) {
      periodMap[periodId].resit.push(g);
    } else {
      periodMap[periodId].regular.push(g);
    }
  });

  // Ascending by period ID → index 0 = Semester 1, index 1 = Semester 2
  const periods = Object.values(periodMap).sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="examgrades-page">
      <div className="page-header">
        <div>
          <h1>{t.examgrades.title}</h1>
          <p className="page-subtitle">{t.examgrades.subtitle}</p>
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

      {!loading && periods.length > 0 && (
        <div className="eg-semesters-row">
          {periods.map((period, idx) => (
            <SemesterCard
              key={period.id}
              period={period}
              semNumber={idx + 1}
              ar={ar}
              t={t}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {!loading && !error && grades.length === 0 && selectedDia && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p>{t.examgrades.noData}</p>
        </div>
      )}
    </div>
  );
}
