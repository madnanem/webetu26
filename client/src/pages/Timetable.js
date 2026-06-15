import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './Timetable.css';

const AP_CLASS = { CM: 'ap-cm', TD: 'ap-td', TP: 'ap-tp' };

function SlotCell({ slot, ar }) {
  const subject = ar ? (slot.matiereAr || slot.matiere) : slot.matiere;
  const teacher = ar
    ? `${slot.prenomEnseignantArabe || ''} ${slot.nomEnseignantArabe || ''}`.trim()
    : `${slot.prenomEnseignantLatin || ''} ${slot.nomEnseignantLatin || ''}`.trim();
  const ap = slot.ap?.toUpperCase();

  return (
    <div className={`tt-cell ${AP_CLASS[ap] || 'ap-default'}`}>
      {ap && <span className={`tt-ap-badge ${AP_CLASS[ap] || 'ap-default'}`}>{ap}</span>}
      <div className="tt-cell-subject">{subject || '—'}</div>
      {slot.refLieuDesignation && <div className="tt-cell-room">{slot.refLieuDesignation}</div>}
      {teacher && <div className="tt-cell-teacher">{teacher}</div>}
    </div>
  );
}

export default function Timetable() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [dias, setDias] = useState([]);
  const [selectedDia, setSelectedDia] = useState('');
  const [slots, setSlots] = useState([]);
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
      .catch(() => setError(t.timetable.errorLoad))
      .finally(() => setLoadingDias(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  useEffect(() => {
    if (!selectedDia) return;
    setLoading(true);
    setError('');
    setSlots([]);
    axios.get(`/api/student/timetable/${selectedDia}`, { headers: apiHeaders })
      .then(r => setSlots(r.data || []))
      .catch(e => setError(e.response?.status === 404 ? t.timetable.noData : t.timetable.errorLoad))
      .finally(() => setLoading(false));
  }, [selectedDia, apiHeaders]); // eslint-disable-line

  // Build unique time columns sorted by start time
  const timeSlotMap = {};
  slots.forEach(s => {
    const key = s.plageHoraireHeureDebut || s.plageHoraireLibelleFr || 'other';
    if (!timeSlotMap[key]) {
      timeSlotMap[key] = {
        key,
        label: s.plageHoraireLibelleFr || `${s.plageHoraireHeureDebut || ''}–${s.plageHoraireFin || ''}`,
        start: s.plageHoraireHeureDebut || key,
      };
    }
  });
  const timeSlots = Object.values(timeSlotMap).sort((a, b) => a.start.localeCompare(b.start));

  // Build day rows
  const dayMap = {};
  slots.forEach(s => {
    const dayId = s.jourId ?? 0;
    if (!dayMap[dayId]) {
      dayMap[dayId] = {
        id: dayId,
        label: ar ? s.jourLibelleAr : s.jourLibelleFr,
        byTime: {},
      };
    }
    const key = s.plageHoraireHeureDebut || s.plageHoraireLibelleFr || 'other';
    dayMap[dayId].byTime[key] = s;
  });
  const days = Object.values(dayMap).sort((a, b) => a.id - b.id);

  return (
    <div className="timetable-page">
      <div className="page-header">
        <div>
          <h1>{t.timetable.title}</h1>
          <p className="page-subtitle">{t.timetable.subtitle}</p>
        </div>
      </div>

      {!loadingDias && dias.length > 0 && (
        <div className="year-pills">
          {dias.map(d => (
            <button key={d.id}
              className={`year-pill ${selectedDia == d.id ? 'active' : ''}`}
              onClick={() => setSelectedDia(d.id)}>
              {d.anneeAcademiqueCode}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="page-loader"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && days.length > 0 && (
        <div className="tt-scroll-wrap">
          <table className="tt-table">
            <thead>
              <tr>
                <th className="tt-th-day">{ar ? 'اليوم' : 'Day'}</th>
                {timeSlots.map(ts => (
                  <th key={ts.key} className="tt-th-time">{ts.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day.id}>
                  <td className="tt-td-day">{day.label || day.id}</td>
                  {timeSlots.map(ts => (
                    <td key={ts.key} className="tt-td">
                      {day.byTime[ts.key]
                        ? <SlotCell slot={day.byTime[ts.key]} ar={ar} />
                        : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && days.length === 0 && selectedDia && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>{t.timetable.noData}</p>
        </div>
      )}
    </div>
  );
}
