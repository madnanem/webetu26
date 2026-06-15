import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT, useLanguage } from '../context/LanguageContext';
import './Bilans.css';

function gradeClass(m) {
  if (m === null || m === undefined) return '';
  return m >= 10 ? 'grade-pass' : 'grade-fail';
}

function GradePill({ value }) {
  if (value === null || value === undefined) return <span className="grade-na">—</span>;
  return <span className={`grade-pill ${gradeClass(value)}`}>{Number(value).toFixed(2)}</span>;
}

export default function Bilans() {
  const { auth, apiHeaders } = useAuth();
  const t = useT();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [dias, setDias] = useState([]);
  const [selectedDia, setSelectedDia] = useState('');
  const [bilans, setBilans] = useState([]);
  const [annuelBilan, setAnnuelBilan] = useState(null);
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
      .catch(() => setError(t.bilans.errorLoad))
      .finally(() => setLoadingDias(false));
  }, [auth, apiHeaders]); // eslint-disable-line

  useEffect(() => {
    if (!selectedDia || !auth?.uuid) return;
    setLoading(true);
    setError('');
    setBilans([]);
    setAnnuelBilan(null);
    Promise.all([
      axios.get(`/api/student/bilans/${auth.uuid}/${selectedDia}`, { headers: apiHeaders }),
      axios.get(`/api/student/annuelbilan/${auth.uuid}/${selectedDia}`, { headers: apiHeaders }).catch(() => null),
    ])
      .then(([bilansRes, annuelRes]) => {
        setBilans(bilansRes.data || []);
        if (annuelRes?.data) {
          const d = Array.isArray(annuelRes.data) ? annuelRes.data[0] : annuelRes.data;
          if (d && typeof d === 'object') setAnnuelBilan(d);
        }
      })
      .catch(e => {
        setError(e.response?.status === 404 ? t.bilans.errorYear : t.bilans.errorLoad);
      })
      .finally(() => setLoading(false));
  }, [selectedDia, auth, apiHeaders]); // eslint-disable-line

  return (
    <div className="bilans-page">
      <div className="page-header">
        <div>
          <h1>{t.bilans.title}</h1>
          <p className="page-subtitle">{t.bilans.subtitle}</p>
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

      {loading && <div className="page-loader"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && bilans.length > 0 && (() => {
        // Source 1: dedicated /annuel/bilan endpoint (AcademicDecisionDto: moyenne, creditAcquis, typeDecision*)
        // Source 2: fallback — bilan in the list with annuel===true (has moyenneGenerale, typeDecision*, creditAcquis per PDF p.24)
        const annuelFromList = bilans.find(b => b.annuel === true)
          ?? bilans.find(b => b.bilanFinal === true);

        const annualAvg =
          annuelBilan?.moyenne           // AcademicDecisionDto.moyenne from /annuel/bilan
          ?? annuelBilan?.moyenneGenerale // same endpoint, alternate field name
          ?? annuelFromList?.moyenneGenerale  // bilans list fallback
          ?? annuelFromList?.moyenne          // last resort
          ?? null;

        const annualCredits =
          annuelBilan?.creditAcquis
          ?? annuelFromList?.creditAcquis
          ?? null;

        const decisionFr =
          annuelBilan?.typeDecisionLibelleFr
          ?? annuelFromList?.typeDecisionLibelleFr
          ?? null;
        const decisionAr =
          annuelBilan?.typeDecisionLibelleAr
          ?? annuelFromList?.typeDecisionLibelleAr
          ?? decisionFr;
        const decisionLabel = ar ? decisionAr : decisionFr;

        const isPass = annualAvg != null && annualAvg >= 10;
        // Show the card whenever we have at least the average OR the decision
        const showCard = annualAvg != null || decisionLabel != null;

        return (<>
          {showCard && (
            <div className="decision-card card">
              {decisionLabel && (
                <p className={`decision-card-label ${isPass ? 'dc-pass' : 'dc-fail'}`}>
                  {ar
                      ? `القرار : ${decisionLabel}`
                      : `Decision: ${decisionLabel}`}
                  
                </p>
              )}
              <div className="decision-pills">
                {annualAvg != null && (
                  <span className={`dc-pill dc-pill-avg ${isPass ? 'dc-pill-pass' : 'dc-pill-fail'}`}>
                    {ar
                      ? `المعدل السنوي: ${Number(annualAvg).toFixed(2)}/20`
                      : `Annual average: ${Number(annualAvg).toFixed(2)}/20`}
                  </span>
                )}
                {annualCredits != null && (
                  <span className="dc-pill dc-pill-credits">
                    {ar ? `الأرصدة: ${annualCredits}` : `Credits: ${annualCredits}`}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="bilans-grid">
          {bilans.map(bilan => (
            <div key={bilan.id} className="bilan-card card">
              <div className={`bilan-card-header ${bilan.moyenne != null && bilan.moyenne < 10 ? 'header-fail' : ''}`}>
                <div className="bilan-card-header-left">
                  <span className="sem-label">
                    {ar ? bilan.periodeLibelleAr : bilan.periodeLibelleFr}
                  </span>
                  <span className="level-label">
                    {ar ? bilan.niveauLibelleLongAr : bilan.niveauLibelleLongLt}
                  </span>
                </div>
                <div className="bilan-badges">
                  <div className="bilan-badge">
                    <span className="badge-label">{t.bilans.moyenne}</span>
                    <span className={`badge-value ${gradeClass(bilan.moyenne)}`}>{bilan.moyenne?.toFixed(2) ?? '—'}</span>
                  </div>
                  <div className="bilan-badge">
                    <span className="badge-label">{t.bilans.credits}</span>
                    <span className="badge-value">{bilan.creditAcquis}</span>
                  </div>
                </div>
                {/* Decision badge */}
                {(bilan.typeDecisionLibelleFr || bilan.typeDecisionLibelleAr) && (
                  <div className={`decision-badge ${bilan.admis ? 'decision-pass' : bilan.passageL1AvecDette ? 'decision-dette' : 'decision-fail'}`}>
                    {ar ? (bilan.typeDecisionLibelleAr || bilan.typeDecisionLibelleFr) : (bilan.typeDecisionLibelleFr)}
                  </div>
                )}
                {/* Mention badge */}
                {(bilan.mentionLibelleFr || bilan.mentionLibelleAr) && (
                  <div className="mention-badge">
                    {ar ? (bilan.mentionLibelleAr || bilan.mentionLibelleFr) : bilan.mentionLibelleFr}
                  </div>
                )}
              </div>

              <div className="bilan-body">
                {bilan.bilanUes?.map((ue, ueIdx) => (
                  <div key={ueIdx} className="ue-block">
                    <div className="ue-header">
                      <span className="ue-type">
                        {ar ? ue.ueNatureLcAr : ue.ueNatureLcFr}
                      </span>
                      <span className="ue-code">
                        {ar ? ue.ueLibelleAr : ue.ueLibelleFr}
                      </span>
                      <div className="ue-summary">
                        <span className={`ue-moyenne ${gradeClass(ue.moyenne)}`}>{ue.moyenne?.toFixed(2) ?? '—'}</span>
                        <span className="ue-credits">{ue.creditAcquis}/{ue.credit} cr.</span>
                      </div>
                    </div>

                    {(() => {
                      const hasSession = ue.bilanMcs?.some(mc =>
                        mc.noteExamenSession1 != null || mc.moyenneControleContinuSession1 != null
                      );
                      return (
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>{t.bilans.matiere}</th>
                                <th style={{ textAlign: 'right' }}>{t.bilans.coeff}</th>
                                {hasSession && <>
                                  <th style={{ textAlign: 'right' }}>{t.bilans.cc} S1</th>
                                  <th style={{ textAlign: 'right' }}>{t.bilans.examen} S1</th>
                                  <th style={{ textAlign: 'right' }}>{t.bilans.session1}</th>
                                  <th style={{ textAlign: 'right' }}>{t.bilans.cc} S2</th>
                                  <th style={{ textAlign: 'right' }}>{t.bilans.examen} S2</th>
                                  <th style={{ textAlign: 'right' }}>{t.bilans.session2}</th>
                                </>}
                                <th style={{ textAlign: 'right' }}>{t.bilans.moyenne}</th>
                                <th style={{ textAlign: 'right' }}>{t.bilans.credits}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ue.bilanMcs?.map((mc, mcIdx) => (
                                <tr key={mcIdx}>
                                  <td>{ar ? mc.mcLibelleAr : mc.mcLibelleFr}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{mc.coefficient}</td>
                                  {hasSession && <>
                                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{mc.moyenneControleContinuSession1 != null ? Number(mc.moyenneControleContinuSession1).toFixed(2) : '—'}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{mc.noteExamenSession1 != null ? Number(mc.noteExamenSession1).toFixed(2) : '—'}</td>
                                    <td style={{ textAlign: 'right' }}><GradePill value={mc.moyenneSession1} /></td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{mc.moyenneControleContinuSession2 != null ? Number(mc.moyenneControleContinuSession2).toFixed(2) : '—'}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{mc.noteExamenSession2 != null ? Number(mc.noteExamenSession2).toFixed(2) : '—'}</td>
                                    <td style={{ textAlign: 'right' }}><GradePill value={mc.moyenneSession2} /></td>
                                  </>}
                                  <td style={{ textAlign: 'right' }}><GradePill value={mc.moyenneGenerale} /></td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className={mc.creditObtenu > 0 ? 'grade-pass' : 'grade-fail'}>{mc.creditObtenu}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                ))}

                <div className="bilan-footer">
                  {bilan.passageL1AvecDette && (
                    <div className="dette-warning">
                      <span>⚠</span>
                      <span>{t.bilans.dette}</span>
                    </div>
                  )}
                  <div className="bilan-footer-item">
                    <span>{t.bilans.semMoyenne}</span>
                    <span className={`bilan-footer-value ${gradeClass(bilan.moyenneSemestre)}`}>
                      {bilan.moyenneSemestre?.toFixed(2) ?? '—'}
                    </span>
                  </div>
                  <div className="bilan-footer-item">
                    <span>{t.bilans.creditsAcquired}</span>
                    <span className="bilan-footer-value">{bilan.creditAcquis}</span>
                  </div>
                  {bilan.cumulCreditPrecedent != null && (
                    <div className="bilan-footer-item">
                      <span>{t.bilans.cumul}</span>
                      <span className="bilan-footer-value">{bilan.cumulCreditPrecedent}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </>);
      })()}

      {!loading && !error && bilans.length === 0 && selectedDia && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <p>{t.bilans.noData}</p>
        </div>
      )}
    </div>
  );
}
