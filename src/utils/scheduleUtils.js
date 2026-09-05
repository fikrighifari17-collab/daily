/**
 * Schedule metadata parsing and serialization utilities.
 * Encodes progress (percentage), checklist of subtasks, and notes
 * seamlessly alongside start time and deadline time.
 */

export const serializeScheduleJudul = ({
  title = '',
  startTime = '',
  deadlineTime = '',
  progress = 0,
  subtasks = [],
  notes = '',
  attachments = []
}) => {
  let cleanTitle = String(title || '').trim();
  // Strip any old [Meta:...] if passed
  const oldMetaIdx = cleanTitle.indexOf('[Meta:');
  if (oldMetaIdx !== -1) {
    cleanTitle = cleanTitle.substring(0, oldMetaIdx).trim();
  }
  // Strip any old Mulai / Deadline tags if present in title
  cleanTitle = cleanTitle.replace(/\(Mulai:\s*[^\)]+\)/gi, '').trim();
  cleanTitle = cleanTitle.replace(/\[Deadline:\s*[^\]]+\]/gi, '').trim();
  // Strip any leaked stray braces from previous regex bug
  cleanTitle = cleanTitle.replace(/(\s*\}[\}\]\s]*)+$/g, '').trim();

  let res = cleanTitle;
  if (startTime && String(startTime).trim()) {
    res += ` (Mulai: ${String(startTime).trim()})`;
  }
  if (deadlineTime && String(deadlineTime).trim()) {
    res += ` [Deadline: ${String(deadlineTime).trim()}]`;
  }

  const meta = {};
  const cleanProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  if (cleanProgress > 0) {
    meta.progress = cleanProgress;
  }
  if (Array.isArray(subtasks) && subtasks.length > 0) {
    meta.subtasks = subtasks
      .filter((st) => st && String(st.text || '').trim().length > 0)
      .map((st) => ({
        id: st.id || `st_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        text: String(st.text).trim(),
        done: Boolean(st.done)
      }));
  }
  if (notes && String(notes).trim()) {
    meta.notes = String(notes).trim();
  }
  if (Array.isArray(attachments) && attachments.length > 0) {
    meta.attachments = attachments
      .filter((att) => att && (att.name || att.link || att.data || att.hasData))
      .map((att) => ({
        id: att.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: String(att.name || 'Dokumen Tugas').trim(),
        size: att.size || null,
        type: att.type || 'other',
        ext: att.ext || 'doc',
        hasData: Boolean(att.data || att.hasData),
        link: att.link || null,
        createdAt: att.createdAt || new Date().toISOString()
      }));
  }

  if (Object.keys(meta).length > 0) {
    try {
      res += ` [Meta:${JSON.stringify(meta)}]`;
    } catch {}
  }

  return res;
};

export const parseScheduleItem = (s) => {
  let title = s?.judul || 'Tanpa Judul';
  let startTime = null;
  let deadlineTime = null;
  let progress = 0;
  let subtasks = [];
  let notes = '';
  let attachments = [];

  // 1. Extract [Meta:...] safely using indexOf and lastIndexOf to prevent nested bracket truncation
  const metaPrefix = '[Meta:';
  const metaIdx = title.lastIndexOf(metaPrefix);
  if (metaIdx !== -1) {
    const afterMeta = title.substring(metaIdx + metaPrefix.length);
    const lastBracketIdx = afterMeta.lastIndexOf(']');
    if (lastBracketIdx !== -1) {
      const jsonCandidate = afterMeta.substring(0, lastBracketIdx).trim();
      try {
        const parsedMeta = JSON.parse(jsonCandidate);
        if (typeof parsedMeta.progress === 'number') {
          progress = Math.max(0, Math.min(100, Math.round(parsedMeta.progress)));
        }
        if (Array.isArray(parsedMeta.subtasks)) {
          subtasks = parsedMeta.subtasks.map((st, idx) => ({
            id: st.id || `st_${idx}`,
            text: String(st.text || ''),
            done: Boolean(st.done)
          }));
        }
        if (parsedMeta.notes) {
          notes = String(parsedMeta.notes);
        }
        if (Array.isArray(parsedMeta.attachments)) {
          attachments = parsedMeta.attachments.map((att, idx) => ({
            id: att.id || `att_${idx}`,
            name: String(att.name || 'Dokumen Tugas'),
            size: att.size || null,
            type: att.type || 'other',
            ext: att.ext || 'doc',
            data: att.data || null,
            hasData: Boolean(att.hasData || att.data),
            link: att.link || null,
            createdAt: att.createdAt || null
          }));
        }
      } catch (err) {
        console.warn('Failed to parse meta JSON:', err);
      }
      title = title.substring(0, metaIdx).trim();
    }
  }

  // 2. Extract (Mulai: ...)
  const startMatch = title.match(/\(Mulai:\s*([^\)]+)\)/i);
  if (startMatch) {
    startTime = startMatch[1].trim();
    title = title.replace(startMatch[0], '').trim();
  }

  // 3. Extract [Deadline: ...]
  const deadlineMatch = title.match(/\[Deadline:\s*([^\]]+)\]/i);
  if (deadlineMatch) {
    deadlineTime = deadlineMatch[1].trim();
    title = title.replace(deadlineMatch[0], '').trim();
  }

  // 4. Clean up any trailing leaked braces/brackets left by previous regex bug
  title = title.replace(/(\s*\}[\}\]\s]*)+$/g, '').trim();

  return {
    ...s,
    cleanTitle: title,
    startTime,
    deadlineTime,
    progress,
    subtasks,
    notes,
    attachments
  };
};
