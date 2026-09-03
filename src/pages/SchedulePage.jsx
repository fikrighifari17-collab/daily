import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Trash2, BookOpen, Clock, AlertCircle, CheckSquare } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import CalendarOverlay from '../components/CalendarOverlay';

const DEFAULT_JENIS = [
  { id: 'tugas', label: 'Course Assignment' },
  { id: 'uts', label: 'Midterm Exam (UTS)' },
  { id: 'uas', label: 'Final Exam (UAS)' },
  { id: 'presentasi', label: 'Presentation / Seminar' },
  { id: 'lainnya', label: 'Other' }
];

export default function SchedulePage() {
  const { schedules, moods, addScheduleItem, removeScheduleItem } = useData();
  const { toast } = useToast();

  const [judul, setJudul] = useState('');
  const [jenisOptions, setJenisOptions] = useState(DEFAULT_JENIS);
  const [jenis, setJenis] = useState('tugas');
  const [customJenisInput, setCustomJenisInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jamTenggat, setJamTenggat] = useState('23:59');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  useEffect(() => {
    if (scheduleToDelete) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [scheduleToDelete]);

  const handleAddCustomJenis = (e) => {
    e.preventDefault();
    if (!customJenisInput.trim()) return;
    const newId = customJenisInput.trim().toLowerCase().replace(/\s+/g, '_');
    const newObj = { id: newId, label: customJenisInput.trim() };
    setJenisOptions([...jenisOptions, newObj]);
    setJenis(newId);
    toast.success(`Agenda type '${customJenisInput.trim()}' added successfully!`);
    setCustomJenisInput('');
    setIsAddingCustom(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!judul.trim() || !tanggal) return;
    setIsSubmitting(true);
    
    let selectedJenisLabel = jenis;
    const found = jenisOptions.find(j => j.id === jenis);
    if (found) {
      selectedJenisLabel = found.id;
    } else if (jenis === 'custom' && customJenisInput.trim()) {
      selectedJenisLabel = customJenisInput.trim().toLowerCase().replace(/\s+/g, '_');
    }

    try {
      const fullJudul = `${judul.trim()} (Start: ${tanggalMulai}) [Due: ${jamTenggat}]`;
      await addScheduleItem({ judul: fullJudul, jenis: selectedJenisLabel, tanggal });
      toast.success('Academic schedule item saved successfully!');
      setJudul('');
    } catch (err) {
      toast.error('Failed to save academic schedule item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', border: '1px solid rgba(0, 173, 181, 0.3)', borderRadius: '0px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
              <CheckSquare size={20} color="#00FFF5" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>Tasks, Assignments & Deadlines</h2>
              <p style={{ fontSize: '12px', color: '#b0b8c1', margin: '4px 0 0 0' }}>
                Track deadlines for assignments, exams (UTS/UAS), quizzes, and presentations to manage academic stress.
              </p>
            </div>
          </div>

          <NavLink
            to="/academic-schedule"
            className="glass-button"
            style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={14} color="#00FFF5" />
            <span>Open Academic Schedule (Jadwal Kuliah) &rarr;</span>
          </NavLink>
        </div>
      </div>

      {/* Calendar Overlay */}
      <CalendarOverlay moods={moods} schedules={schedules} />

      {/* Add Schedule Form & Schedule List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
        
        {/* Form Card */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '0px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#00ADB5" />
            <span>Add Task / Exam Deadline</span>
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Task / Assignment / Exam Title:
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g., Computer Networks Lab Report..."
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                style={{ borderRadius: '0px' }}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Schedule Type:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(!isAddingCustom)}
                  style={{ background: 'none', border: 'none', color: '#00FFF5', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isAddingCustom ? 'Close Custom Input' : '+ Add New Type'}
                </button>
              </div>

              {!isAddingCustom ? (
                <select
                  className="glass-input"
                  value={jenis}
                  onChange={(e) => {
                    if (e.target.value === 'custom_new') {
                      setIsAddingCustom(true);
                    } else {
                      setJenis(e.target.value);
                    }
                  }}
                  style={{ cursor: 'pointer', borderRadius: '0px' }}
                >
                  {jenisOptions.map(opt => (
                    <option key={opt.id} value={opt.id} style={{ background: '#222831' }}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="custom_new" style={{ background: '#222831', color: '#00FFF5', fontWeight: 'bold' }}>
                    + Add Custom Schedule Type...
                  </option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="New type name (e.g., Quiz, Practicum, Final Project)..."
                    value={customJenisInput}
                    onChange={(e) => setCustomJenisInput(e.target.value)}
                    style={{ borderRadius: '0px', fontSize: '12px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomJenis}
                    className="glass-button glass-button-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '0px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Start Date & Deadline Date Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Start Date:
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  style={{ borderRadius: '0px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Due Date:
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  style={{ borderRadius: '0px' }}
                  required
                />
              </div>
            </div>

            {/* Jam Deadline Time */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Due Time:
              </label>
              <input
                type="time"
                className="glass-input"
                value={jamTenggat}
                onChange={(e) => setJamTenggat(e.target.value)}
                style={{ borderRadius: '0px' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-button glass-button-primary"
              style={{ justifyContent: 'center', marginTop: '6px', padding: '10px', borderRadius: '0px' }}
            >
              {isSubmitting ? 'Saving...' : 'Save Academic Schedule'}
            </button>
          </form>
        </div>

        {/* Schedule Items List */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '0px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#00FFF5" />
            <span>Academic Schedule List</span>
          </h3>

          {schedules.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No schedules saved yet. Start adding one on the left!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {schedules.map((s) => {
                const dateStr = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toLocaleDateString('en-US');
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '0px',
                      background: 'rgba(34, 40, 49, 0.6)',
                      border: '1px solid rgba(0, 173, 181, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>{s.judul}</span>
                        <span className={`badge badge-${s.jenis}`}>{s.jenis.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Clock size={12} />
                        <span>Due: {dateStr}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setScheduleToDelete(s)}
                      className="glass-button"
                      style={{ padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '11px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0px' }}
                      title="Delete schedule"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 2-Step Deletion Verification Modal */}
      {scheduleToDelete && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setScheduleToDelete(null)}
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
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                  Confirm Deletion (Step 2/2)
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Are you sure you want to permanently delete this academic schedule?
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
              <div><strong style={{ color: 'var(--text-muted)' }}>Title:</strong> {scheduleToDelete.judul}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Type:</strong> <span className={`badge badge-${scheduleToDelete.jenis}`}>{scheduleToDelete.jenis.toUpperCase()}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Due Date:</strong> {new Date(scheduleToDelete.tanggal).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>

            <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>
              * This schedule item will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setScheduleToDelete(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeScheduleItem(scheduleToDelete.id);
                  setScheduleToDelete(null);
                  toast.info('Academic schedule item deleted successfully.');
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
                Yes, Delete Schedule
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}



