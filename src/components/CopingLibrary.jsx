import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Wind, Play, Pause, RotateCcw, HeartHandshake } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function CopingLibrary() {
  const { copingList, createCopingStrategy } = useData();
  const { toast } = useToast();
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Breathing timer state (4-7-8 technique)
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale (4s), Hold (7s), Exhale (8s)
  const [timerSeconds, setTimerSeconds] = useState(4);

  useEffect(() => {
    let interval = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev > 1) return prev - 1;

          // Switch phase
          if (breathPhase === 'Inhale') {
            setBreathPhase('Hold');
            return 7;
          } else if (breathPhase === 'Hold') {
            setBreathPhase('Exhale');
            return 8;
          } else {
            setBreathPhase('Inhale');
            return 4;
          }
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setIsSubmitting(true);
    try {
      await createCopingStrategy(nama.trim(), deskripsi.trim());
      toast.success(`Coping strategy '${nama.trim()}' added successfully!`);
      setNama('');
      setDeskripsi('');
    } catch (err) {
      toast.error('Failed to add coping strategy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBreathing = () => {
    if (!isBreathingActive) {
      setBreathPhase('Inhale');
      setTimerSeconds(4);
    }
    setIsBreathingActive(!isBreathingActive);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeartHandshake size={20} color="#10b981" />
          <span>Personal Coping Strategy Library</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          A collection of emotional first-aid techniques when facing academic stress or anxiety.
        </p>
      </div>

      {/* Interactive 4-7-8 Breathing Box */}
      <div style={{
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: breathPhase === 'Inhale' ? 'rgba(16, 185, 129, 0.4)' : breathPhase === 'Hold' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
            color: 'white',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.5s ease'
          }}>
            {isBreathingActive ? timerSeconds : <Wind size={28} />}
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>
              {isBreathingActive ? `Phase: ${breathPhase.toUpperCase()}` : 'Relaxation Breathing Exercise (4-7-8)'}
            </h4>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
              {isBreathingActive
                ? breathPhase === 'Inhale' ? 'Breathe in slowly through your nose (4s)...' : breathPhase === 'Hold' ? 'Hold your breath (7s)...' : 'Exhale slowly through your mouth (8s)...'
                : 'Helps lower nervous arousal and heart rate immediately.'
              }
            </p>
          </div>
        </div>

        <button
          onClick={toggleBreathing}
          className="glass-button glass-button-primary"
          style={{ background: isBreathingActive ? '#ef4444' : 'linear-gradient(135deg, #10b981, #3b82f6)' }}
        >
          {isBreathingActive ? <Pause size={16} /> : <Play size={16} />}
          <span>{isBreathingActive ? 'Stop' : 'Start Exercise'}</span>
        </button>
      </div>

      {/* Add Custom Coping Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px' }}>
        <input
          type="text"
          className="glass-input"
          placeholder="Strategy name (e.g. Listen to Lo-Fi)..."
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
        />
        <input
          type="text"
          className="glass-input"
          placeholder="Description / steps (e.g. Listen to a 15-minute lo-fi playlist)..."
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting} className="glass-button glass-button-primary" style={{ whiteSpace: 'nowrap' }}>
          <Plus size={16} />
          Add
        </button>
      </form>

      {/* Coping Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
        {copingList.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-glass)'
            }}
          >
            <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
              {item.namaStrategi}
            </h5>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item.deskripsi || 'No description.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
