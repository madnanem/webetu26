import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import './Groups.css';

export default function Groups() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const [dias, setDias] = useState([]);
  const [selectedDia, setSelectedDia] = useState('');
  const [groups, setGroups] = useState([]);
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
      .catch(() => setError(t.groups.errorLoad))
      .finally(() => setLoadingDias(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  useEffect(() => {
    if (!selectedDia) return;
    setLoading(true);
    setError('');
    setGroups([]);
    axios.get(`/api/student/groups/${selectedDia}`, { headers: apiHeaders })
      .then(r => setGroups([...(r.data || [])].sort((a, b) => a.periodeId - b.periodeId)))
      .catch(e => {
        setError(e.response?.status === 404 ? t.groups.errorYear : t.groups.errorLoad);
      })
      .finally(() => setLoading(false));
  }, [selectedDia, apiHeaders]); // eslint-disable-line

  const selectedDiaObj = dias.find(d => d.id === Number(selectedDia));

  return (
    <div className="groups-page">
      <div className="page-header">
        <div>
          <h1>{t.groups.title}</h1>
          <p className="page-subtitle">{t.groups.subtitle}</p>
        </div>
      </div>

      {!loadingDias && dias.length > 0 && (
        <div className="year-pills">
          {dias.map(d => (
            <button
              key={d.id}
              className={`year-pill ${selectedDia == d.id ? 'active' : ''}`}
              onClick={() => setSelectedDia(d.id)}
            >
              {d.anneeAcademiqueCode}
            </button>
          ))}
        </div>
      )}

      {selectedDiaObj && (
        <div className="context-chips">
          <span className="chip chip-blue">{selectedDiaObj.ofLlFiliere}</span>
          {selectedDiaObj.ofLlSpecialite && <span className="chip chip-green">{selectedDiaObj.ofLlSpecialite}</span>}
        </div>
      )}

      {loading && <div className="page-loader"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && groups.length > 0 && (
        <div className="groups-list">
          {groups.map(g => (
            <div key={g.id} className="group-card">
              <div className="group-card-header">
                <div className="group-icon-wrap"><GroupsIcon /></div>
                <span className="group-sem">{g.periodeLibelleLongLt}</span>
              </div>
              <div className="group-detail-row">
                <span className="gd-label">{t.groups.section}</span>
                <span className="gd-value">{g.nomSection}</span>
              </div>
              <div className="group-detail-row">
                <span className="gd-label">{t.groups.groupeTD}</span>
                <span className="gd-value">G{g.nomGroupePedagogique}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && groups.length === 0 && selectedDia && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>{t.groups.noData}</p>
        </div>
      )}
    </div>
  );
}

function GroupsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
