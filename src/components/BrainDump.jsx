import React, { useState } from 'react';
import { Brain, Send, Trash2, Clock, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function BrainDump() {
  const { brainDumps, createBrainDump } = useData();
  const { toast } = useToast();
  const [isi, setIsi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isi.trim()) return;
    setIsSubmitting(true);
    try {
      await createBrainDump(isi.trim());
      toast.success('Brain dump thoughts saved successfully!');
      setIsi('');
    } catch (err) {
      toast.error('Failed to save brain dump.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '0px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="#00FFF5" />
          <span>Brain Dump / Mental Clutter Release</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Release all random thoughts, worries, or unfiltered venting to ease mental clutter.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <textarea
            className="glass-input"
            rows={3}
            placeholder="Type whatever is on your mind right now..."
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            style={{ paddingRight: '90px', resize: 'vertical', borderRadius: '0px' }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !isi.trim()}
            className="glass-button glass-button-primary"
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '12px',
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '0px'
            }}
          >
            <Send size={14} />
            Save
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {brainDumps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No brain dump entries yet. Write your first thought above!
          </div>
        ) : (
          brainDumps.map((dump) => (
            <div
              key={dump.id}
              style={{
                padding: '14px 16px',
                borderRadius: '0px',
                background: 'rgba(34, 40, 49, 0.6)',
                border: '1px solid rgba(0, 173, 181, 0.2)'
              }}
            >
              <p style={{ fontSize: '14px', color: '#EEEEEE', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {dump.isi}
              </p>
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} />
                <span>{new Date(dump.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
