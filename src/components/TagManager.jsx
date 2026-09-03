import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Hash, Layers } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function TagManager() {
  const { tags, moods, createTag } = useData();
  const { toast } = useToast();
  const [tagName, setTagName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    setIsSubmitting(true);
    try {
      await createTag(tagName.trim());
      toast.success(`Tag '${tagName.trim()}' added successfully!`);
      setTagName('');
    } catch (err) {
      toast.error('Failed to add tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute tag counts
  const tagCounts = {};
  moods.forEach((m) => {
    (m.tags || []).forEach((tObj) => {
      const id = tObj.tagId || tObj.tag?.id;
      if (id) {
        tagCounts[id] = (tagCounts[id] || 0) + 1;
      }
    });
  });

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '0px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TagIcon size={20} color="#00ADB5" />
          <span>Manage Custom Trigger Tags</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Tags help identify primary factors causing emotional shifts (e.g., #AllNighter, #Presentation).
        </p>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          className="glass-input"
          style={{ borderRadius: '0px' }}
          placeholder="New tag name (e.g. Group Project Done)..."
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="glass-button glass-button-primary"
          style={{ whiteSpace: 'nowrap', borderRadius: '0px' }}
        >
          <Plus size={16} />
          Add Tag
        </button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {tags.map((t) => {
          const count = tagCounts[t.id] || 0;
          return (
            <div
              key={t.id}
              style={{
                padding: '8px 14px',
                borderRadius: '0px',
                background: 'rgba(34, 40, 49, 0.6)',
                border: '1px solid rgba(0, 173, 181, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#EEEEEE',
                fontWeight: 600
              }}
            >
              <Hash size={14} color="#00ADB5" />
              <span>{t.nama}</span>
              <span style={{ fontSize: '11px', background: 'rgba(0, 173, 181, 0.2)', color: '#00FFF5', padding: '2px 6px', borderRadius: '0px' }}>
                {count} {count === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
