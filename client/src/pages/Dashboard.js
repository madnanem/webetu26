import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './Dashboard.css';

export default function Dashboard() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [individu, setIndividu] = useState(null);
  const [dias, setDias] = useState([]);
  const [latestBilan, setLatestBilan] = useState(null);
  const [universityLogo, setUniversityLogo] = useState(null); // { data, mime }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.uuid) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [indRes, diasRes] = await Promise.all([
          axios.get(`/api/student/individu/${auth.uuid}`, { headers: apiHeaders }),
          axios.get(`/api/student/dias/${auth.uuid}`, { headers: apiHeaders }),
        ]);
        setIndividu(indRes.data);
        const sortedDias = (diasRes.data || []).sort((a, b) => b.anneeAcademiqueId - a.anneeAcademiqueId);
        setDias(sortedDias);

        const logoId = auth?.etablissementId;
        if (logoId) {
          axios.get(`/api/student/logo/${logoId}`, { headers: apiHeaders })
            .then(r => {
              const d = r.data;
              const img = d?.logo || d?.image || d?.photo;
              if (img) setUniversityLogo({ data: img, mime: d?.mime || 'image/jpeg' });
            })
            .catch(() => {});
        }

        if (sortedDias.length > 0) {
          try {
            const bRes = await axios.get(
              `/api/student/bilans/${auth.uuid}/${sortedDias[0].id}`,
              { headers: apiHeaders }
            );
            if (bRes.data?.length > 0) {
              const sorted = [...bRes.data].sort((a, b) => b.id - a.id);
              setLatestBilan(sorted[0]);
            }
          } catch { /* bilans may not exist yet */ }
        }
      } catch {
        setError(t.dashboard?.errorLoad || 'Erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [auth, apiHeaders]); // eslint-disable-line

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const latest = dias[0];
  const gradeColor = (m) => m >= 10 ? 'grade-pass' : m >= 8 ? 'grade-mid' : 'grade-fail';

  const quickItems = [
    { to: '/profile',      label: t.nav.profile,      desc: t.dashboard.profileDesc,      icon: <UserIcon /> },
    { to: '/inscriptions', label: t.nav.inscriptions,  desc: t.dashboard.inscriptionsDesc, icon: <DocIcon /> },
    { to: '/bilans',       label: t.nav.bilans,        desc: t.dashboard.bilansDesc,       icon: <ChartIcon /> },
    { to: '/groups',       label: t.nav.groups,        desc: t.dashboard.groupsDesc,       icon: <GroupIcon /> },
    { to: '/timetable',    label: t.nav.timetable,     desc: t.nav.timetableDesc,          icon: <TimetableIconD /> },
    { to: '/examgrades',   label: t.nav.examgrades,    desc: t.nav.examgradesDesc,         icon: <ExamIconD /> },
    { to: '/ccgrades',     label: t.nav.ccgrades,      desc: t.nav.ccgradesDesc,           icon: <CCIconD /> },
    { to: '/conge',        label: t.nav.conge,         desc: t.nav.congeDesc,              icon: <CongeIconD /> },
    { to: '/bacnotes',     label: t.nav.bacnotes,      desc: t.nav.bacnotesDesc,           icon: <BacIconD /> },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>{t.dashboard.greeting}, {individu?.prenomLatin || auth?.username}</h1>
          <p className="page-subtitle">{t.dashboard.subtitle}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {individu && (
        <div className="info-banner">
          <div className="info-banner-avatar">
            {(individu.prenomLatin?.[0] || 'E').toUpperCase()}
          </div>
          <div className="info-banner-body">
            <h2>{ar ? `${individu.prenomArabe} ${individu.nomArabe}` : `${individu.prenomLatin} ${individu.nomLatin}`}</h2>
            <div className="info-chips">
              {latest && <>
                <span className="chip chip-blue">{ar ? latest.niveauLibelleLongAr : latest.niveauLibelleLongLt}</span>
                <span className="chip chip-green">{ar ? latest.ofLlFiliereArabe : latest.ofLlFiliere}</span>
                <span className="chip chip-gray">{latest.anneeAcademiqueCode}</span>
              </>}
            </div>
          </div>
          {universityLogo && (
            <div className="info-banner-logo">
              <img
                src={
                  universityLogo.data.startsWith('http') || universityLogo.data.startsWith('/')
                    ? universityLogo.data
                    : `data:${universityLogo.mime};base64,${universityLogo.data}`
                }
                alt="University logo"
                className="university-logo"
                onError={e => { e.target.parentNode.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><BookIcon /></div>
          <div className="stat-body">
            <p className="stat-label">{t.dashboard.inscriptions}</p>
            <p className="stat-value">{dias.length}</p>
            <p className="stat-sub">{t.dashboard.academicYears}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><StarIcon /></div>
          <div className="stat-body">
            <p className="stat-label">{t.dashboard.lastAverage}</p>
            <p className={`stat-value ${latestBilan ? gradeColor(latestBilan.moyenne) : ''}`}>
              {latestBilan ? latestBilan.moyenne?.toFixed(2) : '—'}
            </p>
            <p className="stat-sub">{latestBilan?.periodeLibelleFr || t.dashboard.notAvailable}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><TargetIcon /></div>
          <div className="stat-body">
            <p className="stat-label">{t.dashboard.creditsAcquired}</p>
            <p className="stat-value">{latestBilan?.creditAcquis ?? '—'}</p>
            <p className="stat-sub">
              {latestBilan
                ? `${t.dashboard.on} ${latestBilan.bilanUes?.reduce((s, u) => s + u.credit, 0) || '?'}`
                : t.dashboard.notAvailable}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><GradCapIcon /></div>
          <div className="stat-body">
            <p className="stat-label">{t.dashboard.cycle}</p>
            <p className="stat-value" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
              {ar
                ? (latest?.refLibelleCycleAr || '—')
                : (latest?.refLibelleCycle
                    ? latest.refLibelleCycle.charAt(0).toUpperCase() + latest.refLibelleCycle.slice(1)
                    : '—')}
            </p>
            <p className="stat-sub">{ar ? (latest?.ofLlSpecialiteArabe || latest?.ofLlFiliereArabe) : (latest?.ofLlSpecialite || latest?.ofLlFiliere) || ''}</p>
          </div>
        </div>
      </div>
{/*
      <h2 className="section-title">{t.dashboard.quickAccess}</h2>
      <div className="quick-grid">
        {quickItems.map(item => (
          <Link key={item.to} to={item.to} className="quick-card">
            <div className="quick-icon-wrap">{item.icon}</div>
            <div>
              <p className="quick-title">{item.label}</p>
              <p className="quick-desc">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
*/}
      {latest && (
        <>
          <h2 className="section-title">{t.dashboard.currentYear}</h2>
          <div className="card inscription-card">
            <div className="ins-row">
              <span className="ins-label">{t.dashboard.academicYear}</span>
              <span className="ins-value">{latest.anneeAcademiqueCode}</span>
            </div>
            <div className="ins-row">
              <span className="ins-label">{t.dashboard.etablissement}</span>
              <span className="ins-value">{ar ? latest.llEtablissementArabe : latest.llEtablissementLatin}</span>
            </div>
            <div className="ins-row">
              <span className="ins-label">{t.dashboard.domaine}</span>
              <span className="ins-value">{ar ? latest.ofLlDomaineArabe : latest.ofLlDomaine}</span>
            </div>
            <div className="ins-row">
              <span className="ins-label">{t.dashboard.filiere}</span>
              <span className="ins-value">{ar ? latest.ofLlFiliereArabe : latest.ofLlFiliere}</span>
            </div>
            {(ar ? latest.ofLlSpecialiteArabe : latest.ofLlSpecialite) && (
              <div className="ins-row">
                <span className="ins-label">{t.dashboard.specialite}</span>
                <span className="ins-value">{ar ? latest.ofLlSpecialiteArabe : latest.ofLlSpecialite}</span>
              </div>
            )}
            <div className="ins-row">
              <span className="ins-label">{t.dashboard.numInscription}</span>
              <span className="ins-value mono">{latest.numeroInscription}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CongeIconD() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function BacIconD() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>; }
function TimetableIconD() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="16" y1="14" x2="16" y2="18"/></svg>; }
function ExamIconD() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function CCIconD() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>; }
function BookIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function StarIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function TargetIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function GradCapIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>; }
function UserIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function DocIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function ChartIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function GroupIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
