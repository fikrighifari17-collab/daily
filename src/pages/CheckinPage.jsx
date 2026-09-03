import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { History, Trash2, Tag as TagIcon, Volume2, Calendar, PlusCircle, Image as ImageIcon, X, Sparkles, Clock, Search, Filter, SlidersHorizontal, RotateCcw, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const MOOD_PERCENT = { 1: '20%', 2: '40%', 3: '60%', 4: '80%', 5: '100%' };
const MOOD_LABELS = { 1: 'Very Bad', 2: 'Bad / Stressed', 3: 'Neutral', 4: 'Good / Calm', 5: 'Very Good' };
const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#00ADB5', 5: '#10b981' };

const formatWaktuToJam = (waktuStr) => {
  if (!waktuStr) return '08:00 AM';
  const lower = waktuStr.toLowerCase().trim();
  if (lower === 'pagi' || lower === 'morning') return '08:00 AM';
  if (lower === 'siang' || lower === 'afternoon') return '01:00 PM';
  if (lower === 'sore' || lower === 'evening') return '04:30 PM';
  if (lower === 'malam' || lower === 'night') return '08:00 PM';
  return waktuStr;
};

export default function CheckinPage() {
  const { moods, removeMoodEntry, tags } = useData();
  const { toast } = useToast();
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);

  useEffect(() => {
    if (selectedPhotoModal || entryToDelete) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [selectedPhotoModal, entryToDelete]);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState('ALL');
  const [filterTagId, setFilterTagId] = useState('ALL');
  const [filterMedia, setFilterMedia] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DESC');

  const isFilterActive = searchQuery !== '' || filterScore !== 'ALL' || filterTagId !== 'ALL' || filterMedia !== 'ALL' || sortOrder !== 'DESC';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterScore('ALL');
    setFilterTagId('ALL');
    setFilterMedia('ALL');
    setSortOrder('DESC');
  };

  // Filter & Sort Logic
  const filteredMoods = moods.filter((m) => {
    // Search Query (Catatan, Waktu, Tanggal)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cat = (m.catatan || '').toLowerCase();
      const wak = (m.waktu || '').toLowerCase();
      const tgl = (m.tanggal || '').toLowerCase();
      if (!cat.includes(q) && !wak.includes(q) && !tgl.includes(q)) {
        return false;
      }
    }

    // Filter Score
    if (filterScore !== 'ALL' && String(m.moodScore) !== String(filterScore)) {
      return false;
    }

    // Filter Tag
    if (filterTagId !== 'ALL') {
      const hasTag = m.tags && m.tags.some(t => String(t.tagId || t.tag?.id) === String(filterTagId));
      if (!hasTag) return false;
    }

    // Filter Media / Feature
    if (filterMedia === 'PHOTO' && !m.photoUrl) return false;
    if (filterMedia === 'VOICE' && !m.voiceNotePath) return false;
    if (filterMedia === 'NOTE' && (!m.catatan || !m.catatan.trim())) return false;

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.tanggal || a.createdAt || 0).getTime();
    const timeB = new Date(b.tanggal || b.createdAt || 0).getTime();
    return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner & Action Button */}
      <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.22), rgba(57, 62, 70, 0.85))', border: '1px solid rgba(0, 173, 181, 0.35)', borderRadius: '0px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
              <History size={22} color="#00FFF5" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>Check-in History & Emotion Journal</h2>
              <p style={{ fontSize: '12px', color: '#b0b8c1', marginTop: '2px' }}>
                Review mood chronology, trigger notes, and photo attachments over time.
              </p>
            </div>
          </div>

          <NavLink
            to="/checkin/new"
            className="glass-button glass-button-primary"
            style={{ fontSize: '13px', padding: '10px 18px', borderRadius: '0px', gap: '8px', fontWeight: 700 }}
          >
            <PlusCircle size={18} color="#ffffff" />
            <span>Today's Mood Check-in</span>
          </NavLink>

        </div>
      </div>

      {/* History Timeline Container */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '0px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="#00ADB5" />
              <span>Saved Mood Entries List</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Chronological order of your recorded entries.
            </p>
          </div>

          <div style={{ fontSize: '12px', color: '#00FFF5', background: 'rgba(0, 173, 181, 0.15)', padding: '4px 12px', border: '1px solid rgba(0, 173, 181, 0.3)' }}>
            Showing {filteredMoods.length} of {moods.length} {moods.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          background: 'rgba(34, 40, 49, 0.8)',
          border: '1px solid rgba(0, 173, 181, 0.25)',
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '0px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Top Search & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={15} color="#00FFF5" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, date, or time..."
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(0, 173, 181, 0.3)',
                  color: '#EEEEEE',
                  fontSize: '12px',
                  padding: '7px 30px 7px 32px',
                  outline: 'none',
                  borderRadius: '0px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#b0b8c1', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="glass-button"
                style={{ fontSize: '11px', padding: '6px 12px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '0px' }}
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00FFF5', fontWeight: 700, marginRight: '4px' }}>
              <SlidersHorizontal size={13} />
              <span>Filter:</span>
            </div>

            {/* Mood Score Filter */}
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: filterScore !== 'ALL' ? '1px solid #00FFF5' : '1px solid rgba(0, 173, 181, 0.25)',
                color: filterScore !== 'ALL' ? '#00FFF5' : '#EEEEEE',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '0px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Moods</option>
              <option value="5">5 - Very Good (100%)</option>
              <option value="4">4 - Good / Calm (80%)</option>
              <option value="3">3 - Neutral (60%)</option>
              <option value="2">2 - Bad / Stressed (40%)</option>
              <option value="1">1 - Very Bad (20%)</option>
            </select>

            {/* Tag Filter */}
            <select
              value={filterTagId}
              onChange={(e) => setFilterTagId(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: filterTagId !== 'ALL' ? '1px solid #00FFF5' : '1px solid rgba(0, 173, 181, 0.25)',
                color: filterTagId !== 'ALL' ? '#00FFF5' : '#EEEEEE',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '0px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Trigger Tags</option>
              {tags && tags.map((t) => (
                <option key={t.id} value={t.id}>{t.nama}</option>
              ))}
            </select>

            {/* Media Filter */}
            <select
              value={filterMedia}
              onChange={(e) => setFilterMedia(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: filterMedia !== 'ALL' ? '1px solid #00FFF5' : '1px solid rgba(0, 173, 181, 0.25)',
                color: filterMedia !== 'ALL' ? '#00FFF5' : '#EEEEEE',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '0px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Attachments</option>
              <option value="PHOTO">Has Photo</option>
              <option value="VOICE">Has Voice Note</option>
              <option value="NOTE">Has Text Note</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 173, 181, 0.25)',
                color: '#EEEEEE',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '0px',
                outline: 'none',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>
        </div>

        {filteredMoods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span>{isFilterActive ? 'No mood entries match the selected filters.' : 'No mood check-in data recorded yet.'}</span>
            {isFilterActive ? (
              <button onClick={resetFilters} className="glass-button" style={{ fontSize: '12px', padding: '8px 16px', color: '#00FFF5' }}>
                <RotateCcw size={14} />
                Reset Filter
              </button>
            ) : (
              <NavLink to="/checkin/new" className="glass-button glass-button-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                <PlusCircle size={15} />
                Start Check-in Now
              </NavLink>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredMoods.map((m) => {
              const color = MOOD_COLORS[m.moodScore] || '#00ADB5';
              const percentStr = MOOD_PERCENT[m.moodScore] || `${m.moodScore * 20}%`;
              const dateStr = typeof m.tanggal === 'string' ? m.tanggal.split('T')[0] : new Date(m.tanggal).toLocaleDateString('en-US');
              return (
                <div
                  key={m.id}
                  className="glass-panel-hover"
                  style={{
                    padding: '16px',
                    borderRadius: '0px',
                    background: 'rgba(34, 40, 49, 0.6)',
                    border: `1px solid ${color}35`,
                    borderLeft: `4px solid ${color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '6px 12px',
                        background: `${color}22`,
                        border: `1px solid ${color}`,
                        color: color,
                        fontSize: '18px',
                        fontWeight: 800,
                        borderRadius: '0px'
                      }}>
                        {percentStr}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{MOOD_LABELS[m.moodScore]}</span>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '0px',
                            background: 'rgba(0, 173, 181, 0.15)',
                            color: '#00FFF5',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid rgba(0, 173, 181, 0.3)'
                          }}>
                            <Clock size={11} color="#00FFF5" />
                            <span>{formatWaktuToJam(m.waktu)}</span>
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                          <Calendar size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEntryToDelete(m)}
                      className="glass-button"
                      style={{ padding: '4px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '11px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0px' }}
                      title="Delete this entry"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>

                  {/* Note */}
                  {m.catatan && (
                    <p style={{ fontSize: '12px', color: '#EEEEEE', background: 'rgba(34, 40, 49, 0.8)', padding: '10px 12px', borderRadius: '0px', border: '1px solid rgba(0, 173, 181, 0.15)', lineHeight: 1.5 }}>
                      "{m.catatan}"
                    </p>
                  )}

                  {/* Photo Attachment Preview */}
                  {m.photoUrl && (
                    <div style={{ marginTop: '4px' }}>
                      <div
                        onClick={() => setSelectedPhotoModal(m.photoUrl)}
                        style={{
                          display: 'inline-block',
                          position: 'relative',
                          cursor: 'pointer',
                          border: '1px solid rgba(0, 173, 181, 0.35)',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '4px',
                          maxWidth: '280px',
                          overflow: 'hidden'
                        }}
                        title="Click to view full size photo"
                      >
                        <img
                          src={m.photoUrl}
                          alt="Check-in Photo"
                          style={{
                            width: '100%',
                            maxHeight: '160px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.75)',
                          color: '#00FFF5',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(0, 173, 181, 0.4)'
                        }}>
                          <ImageIcon size={12} />
                          View Photo
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice Note Audio Player */}
                  {m.voiceNotePath && (
                    <div style={{ marginTop: '4px', maxWidth: '340px' }}>
                      {m.voiceNotePath.startsWith('data:audio') || m.voiceNotePath.startsWith('blob:') ? (
                        <div style={{
                          padding: '8px 12px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(0, 173, 181, 0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ fontSize: '11px', color: '#00FFF5', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                            <Volume2 size={13} />
                            <span>Voice Reflection Recording</span>
                          </div>
                          <audio
                            controls
                            src={m.voiceNotePath}
                            style={{
                              width: '100%',
                              height: '32px',
                              outline: 'none',
                              filter: 'invert(1) hue-rotate(180deg)',
                              opacity: 0.85
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#00FFF5', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 173, 181, 0.15)', padding: '4px 10px', borderRadius: '0px', border: '1px solid rgba(0, 173, 181, 0.3)', width: 'fit-content' }}>
                          <Volume2 size={13} />
                          <span>Voice Note Attached</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {m.tags && m.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                      {m.tags.map((tObj, idx) => {
                        const tagLabel = tObj.tag ? tObj.tag.nama : tObj.nama || 'Tag';
                        return (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '0px',
                              background: 'rgba(0, 173, 181, 0.18)',
                              color: '#00FFF5',
                              border: '1px solid rgba(0, 173, 181, 0.35)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <TagIcon size={10} />
                            {tagLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal - Mounted to document.body via createPortal */}
      {selectedPhotoModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedPhotoModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <img
              src={selectedPhotoModal}
              alt="Check-in Photo Full"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', border: '1px solid rgba(0, 173, 181, 0.5)', background: '#000' }}
            />
            <button
              onClick={() => setSelectedPhotoModal(null)}
              className="glass-button"
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px',
                borderRadius: '0px',
                cursor: 'pointer'
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 2-Step Deletion Verification Modal */}
      {entryToDelete && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setEntryToDelete(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1b2028',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              padding: '22px',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '0px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                  Confirm Deletion (Step 2/2)
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Are you sure you want to permanently delete this mood check-in?
                </p>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '12px',
              color: '#EEEEEE',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Date & Time:</strong> {entryToDelete.tanggal} • {entryToDelete.waktu || '08:00 AM'}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Mood Score:</strong> {entryToDelete.moodScore} / 5 ({MOOD_LABELS[entryToDelete.moodScore] || 'Mood'})</div>
              {entryToDelete.catatan && (
                <div style={{ color: '#00FFF5', marginTop: '2px', fontStyle: 'italic', wordBreak: 'break-word' }}>
                  "{entryToDelete.catatan}"
                </div>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>
              * This action is permanent and cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeMoodEntry(entryToDelete.id);
                  setEntryToDelete(null);
                  toast.info('Emotion check-in entry deleted successfully.');
                }}
                className="glass-button"
                style={{
                  fontSize: '13px',
                  padding: '8px 18px',
                  background: '#ef4444',
                  color: 'white',
                  borderColor: '#ef4444',
                  fontWeight: 700
                }}
              >
                Yes, Delete Entry
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
