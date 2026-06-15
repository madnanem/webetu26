import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './Profile.css';

function InfoRow({ label, value, arabic }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${arabic ? 'arabic' : ''}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="profile-section card">
      <h3 className="section-heading">{title}</h3>
      <div className="section-body">{children}</div>
    </div>
  );
}

function toImgSrc(p) {
  if (!p) return null;
  if (p.startsWith('data:')) return p;
  if (p.startsWith('http') || p.startsWith('/')) return p;
  return `data:image/jpeg;base64,${p}`;
}

function PhotoAvatar({ photo, fallback }) {
  const [failed, setFailed] = React.useState(false);
  if (!photo || failed) return fallback;
  return <img src={toImgSrc(photo)} alt="photo" className="profile-photo" onError={() => setFailed(true)} />;
}

export default function Profile() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [individu, setIndividu] = useState(null);
  const [university, setUniversity] = useState({ latin: '', arabic: '' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.uuid) return;
    Promise.all([
      axios.get(`/api/student/individu/${auth.uuid}`, { headers: apiHeaders }),
      axios.get(`/api/student/dias/${auth.uuid}`, { headers: apiHeaders }),
      axios.get(`/api/student/photo/${auth.uuid}`, { headers: apiHeaders }).catch(() => null),
      axios.get(`/api/student/bac/${auth.uuid}`, { headers: apiHeaders }).catch(() => null),
    ])
      .then(([indRes, diasRes, photoRes, bacRes]) => {
        setIndividu(indRes.data);
        const dias = (diasRes.data || []).sort((a, b) => b.anneeAcademiqueId - a.anneeAcademiqueId);
        if (dias[0]) setUniversity({ latin: dias[0].llEtablissementLatin, arabic: dias[0].llEtablissementArabe });
        // Priority: dedicated image endpoint > individu photo > bac photo
        const photoFromApi = photoRes?.data?.photo;
        const photoMime = photoRes?.data?.mime || 'image/jpeg';
        const p = (photoFromApi ? `data:${photoMime};base64,${photoFromApi}` : null)
          || indRes.data?.photo
          || bacRes?.data?.photoEtudiant
          || bacRes?.data?.photo;
        if (p) setPhoto(p);
      })
      .catch(() => setError(t.profile.errorLoad))
      .finally(() => setLoading(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>{t.profile.title}</h1>
          <p className="page-subtitle">{t.profile.subtitle}</p>
        </div>
      </div>

      {individu && (
        <>
          <div className="profile-hero card">
            <div className="profile-avatar-lg">
              <PhotoAvatar photo={photo} fallback={(individu.prenomLatin?.[0] || 'E').toUpperCase()} />
            </div>
            <div className="profile-hero-info">
              <h2>{ar ? `${individu.prenomArabe} ${individu.nomArabe}` : `${individu.prenomLatin} ${individu.nomLatin}`}</h2>
              {(university.latin || university.arabic) && (
                <p className="profile-id">{ar ? university.arabic : university.latin}</p>
              )}
            </div>
          </div>

          <Section title={t.profile.subtitle}>
            <InfoRow label={t.profile.nom}           value={ar ? individu.nomArabe           : individu.nomLatin}          arabic={ar} />
            <InfoRow label={t.profile.prenom}        value={ar ? individu.prenomArabe        : individu.prenomLatin}       arabic={ar} />
            <InfoRow label={t.profile.dateNaissance} value={individu.dateNaissance} />
            <InfoRow label={t.profile.lieuNaissance} value={ar ? individu.lieuNaissanceArabe : individu.lieuNaissance}     arabic={ar} />
            <InfoRow label={t.profile.email}         value={individu.email} />
          </Section>
        </>
      )}
    </div>
  );
}
