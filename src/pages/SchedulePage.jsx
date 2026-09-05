import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  BookOpen,
  Clock,
  AlertCircle,
  CheckSquare,
  X,
  Filter,
  Search,
  Edit3,
  Check,
  CheckCircle2,
  Circle,
  ListTodo,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Paperclip,
  Presentation,
  FileText,
  File,
  Download,
  ExternalLink,
  UploadCloud,
  Link2,
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import CalendarOverlay from '../components/CalendarOverlay';
import { parseScheduleItem, serializeScheduleJudul } from '../utils/scheduleUtils';
import {
  saveAttachmentData,
  getAttachmentData,
  deleteAttachmentData,
  openOrDownloadAttachment,
  isMobileDevice
} from '../utils/attachmentStorage';

export default function SchedulePage() {
  const { schedules, moods, addScheduleItem, updateScheduleItem, removeScheduleItem } = useData();
  const { toast } = useToast();

  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jamTenggat, setJamTenggat] = useState('23:59');
  const [addSubtasks, setAddSubtasks] = useState([]);
  const [newAddSubtaskInput, setNewAddSubtaskInput] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addAttachments, setAddAttachments] = useState([]);
  const [showAddLinkInput, setShowAddLinkInput] = useState(false);
  const [addLinkUrl, setAddLinkUrl] = useState('');
  const [addLinkTitle, setAddLinkTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Task Modal State
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editJudul, setEditJudul] = useState('');
  const [editJenis, setEditJenis] = useState('');
  const [editTanggalMulai, setEditTanggalMulai] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editJamTenggat, setEditJamTenggat] = useState('23:59');
  const [editProgress, setEditProgress] = useState(0);
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [newEditSubtaskInput, setNewEditSubtaskInput] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAttachments, setEditAttachments] = useState([]);
  const [showEditLinkInput, setShowEditLinkInput] = useState(false);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  // Complete Confirmation State (2-step verification)
  const [scheduleToComplete, setScheduleToComplete] = useState(null);

  // Reopen Confirmation State (2-step verification)
  const [scheduleToReopen, setScheduleToReopen] = useState(null);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable subtasks state for cards (accordion/expanded preview)
  const [expandedCards, setExpandedCards] = useState({});

  // Collapsible toggle for completed tasks list ("List Tugas Beres")
  const [isCompletedListExpanded, setIsCompletedListExpanded] = useState(true);

  const toggleCardExpanded = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open Edit Modal
  const openEditModal = (s) => {
    const parsed = parseScheduleItem(s);
    setEditingSchedule(s);
    setEditJudul(parsed.cleanTitle);
    setEditJenis(s.jenis || '');
    setEditTanggalMulai(
      parsed.startTime ||
      (typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0])
    );
    setEditTanggal(
      typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0]
    );
    setEditJamTenggat(parsed.deadlineTime || '23:59');
    setEditProgress(typeof parsed.progress === 'number' ? parsed.progress : 0);
    setEditSubtasks(parsed.subtasks ? JSON.parse(JSON.stringify(parsed.subtasks)) : []);
    setNewEditSubtaskInput('');
    setEditNotes(parsed.notes || '');

    const initialAtts = parsed.attachments ? JSON.parse(JSON.stringify(parsed.attachments)) : [];
    setEditAttachments(initialAtts);
    setShowEditLinkInput(false);
    setEditLinkUrl('');
    setEditLinkTitle('');

    // Pre-load data from IndexedDB for any attachments missing in-memory data
    for (const att of initialAtts) {
      if (att.hasData && !att.data) {
        getAttachmentData(att.id).then((cached) => {
          if (cached) {
            setEditAttachments((prev) =>
              prev.map((item) => (item.id === att.id ? { ...item, data: cached } : item))
            );
          }
        });
      }
    }
  };

  // Attachment upload & link management
  const handleFileUpload = (e, isEdit = true) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 25MB.');
      e.target.value = '';
      return;
    }

    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let fileType = 'other';
    if (['ppt', 'pptx'].includes(ext)) fileType = 'pptx';
    else if (['doc', 'docx'].includes(ext)) fileType = 'docx';
    else if (ext === 'pdf') fileType = 'pdf';
    else if (['xls', 'xlsx'].includes(ext)) fileType = 'xlsx';
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) fileType = 'image';

    const fileId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result;
      // Persist binary safely into IndexedDB
      await saveAttachmentData(fileId, fileData);

      const newAtt = {
        id: fileId,
        name: file.name,
        size: formatSize(file.size),
        type: fileType,
        ext: ext,
        data: fileData,
        hasData: true,
        link: null,
        createdAt: new Date().toISOString()
      };

      if (isEdit) {
        setEditAttachments((prev) => [...prev, newAtt]);
      } else {
        setAddAttachments((prev) => [...prev, newAtt]);
      }
      toast.success(`File "${file.name}" berhasil dilampirkan!`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddExternalLink = (isEdit = true) => {
    const url = isEdit ? editLinkUrl.trim() : addLinkUrl.trim();
    const title = isEdit ? editLinkTitle.trim() : addLinkTitle.trim();
    if (!url) {
      toast.error('Masukkan URL tautan Google Drive / Docs / Materi.');
      return;
    }
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const newAtt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: title || 'Tautan Materi (Google Drive/Docs)',
      size: 'Web Link',
      type: 'link',
      ext: 'link',
      data: null,
      hasData: false,
      link: formattedUrl,
      createdAt: new Date().toISOString()
    };
    if (isEdit) {
      setEditAttachments((prev) => [...prev, newAtt]);
      setEditLinkUrl('');
      setEditLinkTitle('');
      setShowEditLinkInput(false);
    } else {
      setAddAttachments((prev) => [...prev, newAtt]);
      setAddLinkUrl('');
      setAddLinkTitle('');
      setShowAddLinkInput(false);
    }
    toast.success('Link materi berhasil dilampirkan!');
  };

  const handleRemoveAttachment = async (attId, isEdit = true) => {
    await deleteAttachmentData(attId);
    if (isEdit) {
      setEditAttachments((prev) => prev.filter((a) => a.id !== attId));
    } else {
      setAddAttachments((prev) => prev.filter((a) => a.id !== attId));
    }
    toast.info('Lampiran dihapus.');
  };

  const handleDownloadAttachment = async (att, forceDownload = false) => {
    try {
      const res = await openOrDownloadAttachment(att, { forceDownload });
      if (res && !res.success) {
        toast.error(res.message || 'Gagal memproses berkas.');
      } else if (res && res.message && forceDownload) {
        toast.success(res.message);
      }
    } catch (err) {
      console.error('Error handling attachment:', err);
      toast.error('Gagal membuka atau mengunduh berkas.');
    }
  };

  const getFileBadgeInfo = (att) => {
    const isPPT = att.type === 'pptx' || ['ppt', 'pptx'].includes(att.ext);
    const isDoc = att.type === 'docx' || ['doc', 'docx'].includes(att.ext);
    const isPDF = att.type === 'pdf' || att.ext === 'pdf';
    const isXls = att.type === 'xlsx' || ['xls', 'xlsx'].includes(att.ext);
    const isLink = att.type === 'link' || Boolean(att.link);

    if (isPPT) {
      return {
        label: 'PPT / Slides',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.4)',
        icon: <Presentation size={14} color="#f97316" />
      };
    }
    if (isDoc) {
      return {
        label: 'Word / Doc',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.4)',
        icon: <FileText size={14} color="#38bdf8" />
      };
    }
    if (isPDF) {
      return {
        label: 'PDF',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        icon: <File size={14} color="#ef4444" />
      };
    }
    if (isXls) {
      return {
        label: 'Excel',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
        icon: <FileSpreadsheet size={14} color="#10b981" />
      };
    }
    if (isLink) {
      return {
        label: 'Link Web / Drive',
        color: '#00FFF5',
        bg: 'rgba(0, 255, 245, 0.15)',
        border: 'rgba(0, 173, 181, 0.4)',
        icon: <ExternalLink size={14} color="#00FFF5" />
      };
    }
    return {
      label: (att.ext || 'FILE').toUpperCase(),
      color: '#EEEEEE',
      bg: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      icon: <Paperclip size={14} color="#00FFF5" />
    };
  };

  // Subtask management inside Edit Modal
  const handleAddEditSubtask = () => {
    const text = newEditSubtaskInput.trim();
    if (!text) return;
    const newItem = {
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text,
      done: false
    };
    setEditSubtasks((prev) => [...prev, newItem]);
    setNewEditSubtaskInput('');
  };

  const handleToggleEditSubtask = (subtaskId) => {
    setEditSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st))
    );
  };

  const handleRemoveEditSubtask = (subtaskId) => {
    setEditSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
  };

  const handleAutoCalcEditProgress = () => {
    if (editSubtasks.length === 0) return;
    const doneCount = editSubtasks.filter((st) => st.done).length;
    const autoProgress = Math.round((doneCount / editSubtasks.length) * 100);
    setEditProgress(autoProgress);
    toast.info(`Progres disesuaikan otomatis menjadi ${autoProgress}% berdasarkan checklist.`);
  };

  // Subtask management inside Add Modal
  const handleAddAddSubtask = () => {
    const text = newAddSubtaskInput.trim();
    if (!text) return;
    const newItem = {
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text,
      done: false
    };
    setAddSubtasks((prev) => [...prev, newItem]);
    setNewAddSubtaskInput('');
  };

  const handleRemoveAddSubtask = (subtaskId) => {
    setAddSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
  };

  // Submit Add Form
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!judul.trim() || !tanggal || !jenis.trim()) {
      toast.error('Mohon lengkapi judul, kategori, dan batas pengumpulan (deadline).');
      return;
    }
    setIsSubmitting(true);

    const cleanJenis = jenis.trim();

    try {
      const fullJudul = serializeScheduleJudul({
        title: judul.trim(),
        startTime: tanggalMulai,
        deadlineTime: jamTenggat,
        progress: 0,
        subtasks: addSubtasks,
        notes: addNotes.trim(),
        attachments: addAttachments
      });

      await addScheduleItem({ judul: fullJudul, jenis: cleanJenis, tanggal });
      toast.success('Jadwal tugas berhasil disimpan!');
      setJudul('');
      setJenis('');
      setAddSubtasks([]);
      setNewAddSubtaskInput('');
      setAddNotes('');
      setAddAttachments([]);
      setShowAddLinkInput(false);
      setAddLinkUrl('');
      setAddLinkTitle('');
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error('Gagal menyimpan jadwal tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editJudul.trim() || !editTanggal || !editJenis.trim()) {
      toast.error('Mohon lengkapi judul, kategori, dan tanggal deadline.');
      return;
    }
    setIsUpdating(true);

    try {
      const fullJudul = serializeScheduleJudul({
        title: editJudul.trim(),
        startTime: editTanggalMulai,
        deadlineTime: editJamTenggat,
        progress: editProgress,
        subtasks: editSubtasks,
        notes: editNotes.trim(),
        attachments: editAttachments
      });

      await updateScheduleItem(editingSchedule.id, {
        judul: fullJudul,
        jenis: editJenis.trim(),
        tanggal: editTanggal
      });

      toast.success('Perubahan tugas berhasil disimpan!');
      setEditingSchedule(null);
    } catch (err) {
      toast.error('Gagal memperbarui jadwal tugas.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick toggle completion directly from card
  const handleToggleCompleteQuick = async (s, targetProgress = null) => {
    const parsed = parseScheduleItem(s);
    const newProgress = targetProgress !== null ? targetProgress : (parsed.progress === 100 ? 0 : 100);
    const updatedSubtasks = parsed.subtasks.map((st) => ({
      ...st,
      done: newProgress === 100
    }));

    const newJudul = serializeScheduleJudul({
      title: parsed.cleanTitle,
      startTime: parsed.startTime,
      deadlineTime: parsed.deadlineTime,
      progress: newProgress,
      subtasks: updatedSubtasks,
      notes: parsed.notes,
      attachments: parsed.attachments || []
    });

    try {
      await updateScheduleItem(s.id, {
        judul: newJudul,
        jenis: s.jenis,
        tanggal: s.tanggal
      });
      toast.success(
        newProgress === 100
          ? 'Hore! Tugas beres, terhapus dari kalender & masuk ke list tugas beres!'
          : 'Tugas dikembalikan ke daftar tugas aktif & kalender.'
      );
    } catch {
      toast.error('Gagal memperbarui status tugas.');
    }
  };

  // 2-step verification trigger for circle button
  const handleCircleClick = (s) => {
    const parsed = parseScheduleItem(s);
    if (parsed.progress === 100) {
      // 2-step verification to reopen task back to active
      setScheduleToReopen(s);
    } else {
      // 2-step verification to complete task
      setScheduleToComplete(s);
    }
  };

  const handleConfirmComplete = async () => {
    if (!scheduleToComplete) return;
    const target = scheduleToComplete;
    setScheduleToComplete(null);
    await handleToggleCompleteQuick(target, 100);
  };

  const handleConfirmReopen = async () => {
    if (!scheduleToReopen) return;
    const target = scheduleToReopen;
    setScheduleToReopen(null);
    await handleToggleCompleteQuick(target, 0);
  };

  // Quick toggle subtask directly from card
  const handleToggleSubtaskQuick = async (s, subtaskId) => {
    const parsed = parseScheduleItem(s);
    const updatedSubtasks = parsed.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    const doneCount = updatedSubtasks.filter((st) => st.done).length;
    const autoProgress =
      updatedSubtasks.length > 0
        ? Math.round((doneCount / updatedSubtasks.length) * 100)
        : parsed.progress;

    const newJudul = serializeScheduleJudul({
      title: parsed.cleanTitle,
      startTime: parsed.startTime,
      deadlineTime: parsed.deadlineTime,
      progress: autoProgress,
      subtasks: updatedSubtasks,
      notes: parsed.notes,
      attachments: parsed.attachments || []
    });

    try {
      await updateScheduleItem(s.id, {
        judul: newJudul,
        jenis: s.jenis,
        tanggal: s.tanggal
      });
    } catch {
      toast.error('Gagal memperbarui checklist sub-tugas.');
    }
  };

  // Delete handler
  const handleConfirmDelete = () => {
    if (!scheduleToDelete) return;
    removeScheduleItem(scheduleToDelete.id);
    setScheduleToDelete(null);
    toast.info('Jadwal berhasil dihapus.');
  };

  // Listen for Escape and Enter keys on modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 0a. Complete Confirmation Modal
      if (scheduleToComplete) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setScheduleToComplete(null);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmComplete();
        }
        return;
      }

      // 0b. Reopen Confirmation Modal
      if (scheduleToReopen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setScheduleToReopen(null);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmReopen();
        }
        return;
      }

      // 1. Delete Confirmation Modal
      if (scheduleToDelete) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setScheduleToDelete(null);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmDelete();
        }
        return;
      }

      // 2. Edit Schedule Modal
      if (editingSchedule) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditingSchedule(null);
        } else if (e.key === 'Enter') {
          if (document.activeElement?.id === 'edit-new-subtask-input') {
            e.preventDefault();
            handleAddEditSubtask();
            return;
          }
          if (document.activeElement?.id === 'edit-link-url-input' || document.activeElement?.id === 'edit-link-title-input') {
            e.preventDefault();
            handleAddExternalLink(true);
            return;
          }
          if (e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (!isUpdating) {
              handleSaveEdit();
            }
          }
        }
        return;
      }

      // 3. Add Task Modal
      if (isAddModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsAddModalOpen(false);
        } else if (e.key === 'Enter') {
          if (document.activeElement?.id === 'add-new-subtask-input') {
            e.preventDefault();
            handleAddAddSubtask();
            return;
          }
          if (document.activeElement?.id === 'add-link-url-input' || document.activeElement?.id === 'add-link-title-input') {
            e.preventDefault();
            handleAddExternalLink(false);
            return;
          }
          if (e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (!isSubmitting) {
              handleSubmit();
            }
          }
        }
      }
    };

    if (scheduleToDelete || scheduleToComplete || scheduleToReopen || isAddModalOpen || editingSchedule) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = orig;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    scheduleToDelete,
    scheduleToComplete,
    scheduleToReopen,
    isAddModalOpen,
    editingSchedule,
    judul,
    jenis,
    tanggal,
    tanggalMulai,
    jamTenggat,
    addSubtasks,
    newAddSubtaskInput,
    addNotes,
    isSubmitting,
    editJudul,
    editJenis,
    editTanggal,
    editTanggalMulai,
    editJamTenggat,
    editProgress,
    editSubtasks,
    newEditSubtaskInput,
    editNotes,
    isUpdating
  ]);

  // Dynamic unique categories from user's actual entered tasks
  const dynamicCategories = Array.from(
    new Set(schedules.map((s) => (s.jenis || '').trim()).filter(Boolean))
  );

  const displayedSchedules = schedules.filter((s) => {
    // 1. Category filter
    if (selectedCategory !== 'all') {
      const sJenis = (s.jenis || '').toLowerCase();
      if (sJenis !== selectedCategory.toLowerCase()) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const parsed = parseScheduleItem(s);
      const matchJudul = (parsed.cleanTitle || '').toLowerCase().includes(q);
      const matchJenis = (s.jenis || '').toLowerCase().includes(q);
      if (!matchJudul && !matchJenis) return false;
    }

    return true;
  });

  // Separate active vs completed schedules
  const activeSchedules = displayedSchedules.filter((s) => {
    const parsed = parseScheduleItem(s);
    return parsed.progress < 100;
  });

  const completedSchedules = displayedSchedules.filter((s) => {
    const parsed = parseScheduleItem(s);
    return parsed.progress === 100;
  });

  const getCategoryCount = (cat) => {
    return schedules.filter((s) => {
      if (cat === 'all') return true;
      return (s.jenis || '').toLowerCase() === cat.toLowerCase();
    }).length;
  };

  // Reusable Task Card Renderer
  const renderTaskCard = (s, isCompletedCard = false) => {
    const parsed = parseScheduleItem(s);
    const dateStr = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' });
    const isCompleted = parsed.progress === 100;
    const subtasks = parsed.subtasks || [];
    const attachments = parsed.attachments || [];
    const doneSubtasks = subtasks.filter((st) => st.done);
    const remainingSubtasks = subtasks.filter((st) => !st.done);
    const isExpanded = Boolean(expandedCards[s.id]);

    return (
      <div
        key={s.id}
        style={{
          padding: '14px 16px',
          borderRadius: '0px',
          background: isCompleted ? 'rgba(22, 35, 30, 0.75)' : 'rgba(34, 40, 49, 0.65)',
          border: isCompleted ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(0, 173, 181, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          transition: 'all 0.2s ease',
          boxShadow: isCompleted ? '0 2px 10px rgba(16, 185, 129, 0.1)' : '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Top Row: Quick Complete Toggle, Title & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <button
              type="button"
              onClick={() => handleCircleClick(s)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
              title={isCompleted ? 'Kembalikan ke tugas aktif (Verifikasi 2 Langkah)' : 'Tandai selesai 100% (Verifikasi 2 Langkah)'}
            >
              {isCompleted ? (
                <CheckCircle2 size={19} color="#10b981" />
              ) : (
                <Circle size={19} color="rgba(0, 173, 181, 0.7)" />
              )}
            </button>

            <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: isCompleted ? '#9ca3af' : '#EEEEEE',
              textDecoration: isCompleted ? 'line-through' : 'none',
              wordBreak: 'break-word',
              lineHeight: '1.3'
            }}>
              {parsed.cleanTitle}
            </span>
          </div>

          {/* Action Buttons: Edit & Delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => openEditModal(s)}
              className="glass-button"
              style={{
                padding: '5px 10px',
                color: isCompleted ? '#10b981' : '#00FFF5',
                borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 173, 181, 0.4)',
                fontSize: '11px',
                background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 173, 181, 0.1)',
                borderRadius: '0px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Edit tugas, progres & apa saja yang belum"
            >
              <Edit3 size={13} />
              <span>Edit & Progres</span>
            </button>

            <button
              onClick={() => setScheduleToDelete(s)}
              className="glass-button"
              style={{ padding: '5px 9px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '11px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0px' }}
              title="Hapus jadwal"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Second Row: Badges, Progress & Attachment counters in one neat row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginTop: '-2px' }}>
          <span className={`badge badge-${(s.jenis || 'tugas').toLowerCase()}`}>{(s.jenis || 'tugas').toUpperCase()}</span>

          {/* Progress Badge */}
          {isCompleted ? (
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '1px 7px' }}>
              SELESAI (100%)
            </span>
          ) : (
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#00FFF5', background: 'rgba(0, 173, 181, 0.15)', border: '1px solid rgba(0, 173, 181, 0.4)', padding: '1px 7px' }}>
              {parsed.progress}% SELESAI
            </span>
          )}

          {/* Subtasks Count Badge */}
          {subtasks.length > 0 && (
            <span style={{ fontSize: '11px', color: remainingSubtasks.length === 0 ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ListTodo size={12} color={remainingSubtasks.length === 0 ? '#10b981' : '#00FFF5'} />
              <span>{doneSubtasks.length}/{subtasks.length} sub-tugas</span>
            </span>
          )}

          {/* Attachments Count Badge */}
          {attachments.length > 0 && (
            <span style={{ fontSize: '11px', color: '#00FFF5', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Paperclip size={12} />
              <span>{attachments.length} berkas</span>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          background: 'rgba(0, 0, 0, 0.35)',
          height: '6px',
          borderRadius: '0px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            width: `${parsed.progress}%`,
            height: '100%',
            background: isCompleted ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #00ADB5, #00FFF5)',
            boxShadow: isCompleted ? '0 0 8px rgba(16, 185, 129, 0.6)' : '0 0 8px rgba(0, 255, 245, 0.4)',
            transition: 'width 0.35s ease'
          }} />
        </div>

        {/* Dates Row: Deadline & Mulai */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isCompleted ? '#10b981' : '#00FFF5', fontWeight: 600 }}>
            <Clock size={12} />
            Deadline: {dateStr} {parsed.deadlineTime ? `(Pukul ${parsed.deadlineTime})` : ''}
          </span>
          {parsed.startTime && (
            <span>Mulai: {parsed.startTime}</span>
          )}
          {parsed.notes && (
            <span style={{ color: '#b0b8c1', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlignLeft size={11} />
              {parsed.notes.length > 50 ? `${parsed.notes.substring(0, 50)}...` : parsed.notes}
            </span>
          )}
        </div>

        {/* Checklist Subtasks ("Apa saja yang belum") */}
        {subtasks.length > 0 && (
          <div style={{
            marginTop: '4px',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0, 173, 181, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ color: isCompleted ? '#10b981' : '#00FFF5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckSquare size={12} />
                <span>Checklist Pengerjaan:</span>
              </span>

              <button
                type="button"
                onClick={() => toggleCardExpanded(s.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{isExpanded ? 'Tutup Rincian' : `Lihat Semua (${subtasks.length})`}</span>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}>
              {(isExpanded ? subtasks : remainingSubtasks.length > 0 ? remainingSubtasks.slice(0, 3) : subtasks.slice(0, 2)).map((st) => (
                <label
                  key={st.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: st.done ? 'var(--text-muted)' : '#EEEEEE',
                    textDecoration: st.done ? 'line-through' : 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => handleToggleSubtaskQuick(s, st.id)}
                    style={{ cursor: 'pointer', accentColor: '#00FFF5', width: '14px', height: '14px' }}
                  />
                  <span>{st.text}</span>
                  {!st.done && (
                    <span style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontWeight: 700 }}>
                      BELUM
                    </span>
                  )}
                </label>
              ))}

              {!isExpanded && remainingSubtasks.length > 3 && (
                <div style={{ fontSize: '10px', color: '#00FFF5', cursor: 'pointer' }} onClick={() => toggleCardExpanded(s.id)}>
                  +{remainingSubtasks.length - 3} item belum selesai lainnya...
                </div>
              )}

              {remainingSubtasks.length === 0 && subtasks.length > 0 && !isExpanded && (
                <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} />
                  <span>Semua checklist sudah beres!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attachments (Word, PPT, PDF, Link) */}
        {attachments.length > 0 && (
          <div style={{
            marginTop: '2px',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0, 173, 181, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00FFF5', fontWeight: 700 }}>
              <Paperclip size={12} />
              <span>Berkas / Materi Tugas ({attachments.length}):</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {attachments.map((att) => {
                const badge = getFileBadgeInfo(att);
                const isMobile = isMobileDevice();
                return (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      padding: '8px 10px',
                      background: 'rgba(34, 40, 49, 0.75)',
                      border: `1px solid ${badge.border}`,
                      borderRadius: '0px'
                    }}
                  >
                    {/* Row 1: File Icon + Badge + Full Filename (gets full width, never squished!) */}
                    <div
                      onClick={() => handleDownloadAttachment(att, false)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                      title={isMobile ? 'Klik untuk membuka sesuai bawaan HP' : 'Klik untuk membuka langsung di browser'}
                    >
                      <div style={{ flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                        {badge.icon}
                      </div>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          color: badge.color,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          flexShrink: 0,
                          textTransform: 'uppercase',
                          marginTop: '1px'
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#EEEEEE',
                          fontWeight: 600,
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          flex: 1
                        }}
                        title={att.name}
                      >
                        {att.name}
                      </span>
                    </div>

                    {/* Row 2: File Size on Left, Action buttons on Right */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {att.size ? att.size : (isMobile ? 'Berkas lampiran' : 'PDF / Dokumen')}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAttachment(att, false);
                          }}
                          className="glass-button glass-button-primary"
                          style={{
                            fontSize: '10px',
                            padding: '3px 9px',
                            borderRadius: '0px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={
                            att.link
                              ? 'Buka tautan di tab baru'
                              : isMobile
                              ? 'Buka sesuai pengaturan bawaan HP'
                              : 'Buka langsung di tab browser default'
                          }
                        >
                          <ExternalLink size={11} />
                          <span>Buka</span>
                        </button>

                        {!att.link && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadAttachment(att, true);
                            }}
                            className="glass-button"
                            style={{
                              fontSize: '10px',
                              padding: '3px 9px',
                              borderRadius: '0px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#EEEEEE',
                              borderColor: 'rgba(255, 255, 255, 0.2)'
                            }}
                            title="Unduh file ke perangkat"
                          >
                            <Download size={11} />
                            <span>Unduh</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', border: '1px solid rgba(0, 173, 181, 0.3)', borderRadius: '0px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', flexShrink: 0 }}>
              <CheckSquare size={18} color="#00FFF5" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>Tugas & Deadline Kuliah</h2>
              <p className="mobile-hide" style={{ fontSize: '11px', color: '#b0b8c1', margin: '2px 0 0 0' }}>
                Tugas yang sudah selesai otomatis terhapus dari kalender dan tersimpan di list tugas beres.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <NavLink
              to="/academic-schedule"
              className="glass-button"
              style={{ fontSize: '12px', padding: '7px 12px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BookOpen size={13} color="#00FFF5" />
              <span>Jadwal Kuliah &rarr;</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Minimalist Calendar Overlay (Completed tasks automatically excluded) */}
      <CalendarOverlay
        moods={moods}
        schedules={schedules}
      />

      {/* ================= SECTION 1: DAFTAR TUGAS AKTIF ================= */}
      <div className="glass-panel" style={{ padding: '16px 18px', borderRadius: '0px' }}>
        {/* Header Title & Add Task Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} color="#00FFF5" />
              <span>Daftar Tugas & Deadline</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#00FFF5', fontWeight: 600, background: 'rgba(0, 173, 181, 0.15)', border: '1px solid rgba(0, 173, 181, 0.35)', padding: '2px 8px' }}>
              {activeSchedules.length} Tugas Aktif
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="glass-button glass-button-primary"
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Tambah Tugas</span>
          </button>
        </div>

        {/* Filter Bar: Category Tabs & Search Box */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          padding: '8px 10px',
          background: 'rgba(34, 40, 49, 0.5)',
          border: '1px solid rgba(0, 173, 181, 0.2)'
        }}>
          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} color="#00FFF5" />
              <span>Filter:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="glass-button"
              style={{
                padding: '3px 9px',
                fontSize: '11px',
                borderRadius: '0px',
                background: selectedCategory === 'all' ? 'rgba(0, 173, 181, 0.35)' : 'transparent',
                borderColor: selectedCategory === 'all' ? '#00FFF5' : 'rgba(0, 173, 181, 0.2)',
                color: selectedCategory === 'all' ? '#00FFF5' : 'var(--text-secondary)',
                fontWeight: selectedCategory === 'all' ? 700 : 500
              }}
            >
              Semua ({getCategoryCount('all')})
            </button>

            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className="glass-button"
                style={{
                  padding: '3px 9px',
                  fontSize: '11px',
                  borderRadius: '0px',
                  background: selectedCategory === cat.toLowerCase() ? 'rgba(0, 173, 181, 0.35)' : 'transparent',
                  borderColor: selectedCategory === cat.toLowerCase() ? '#00FFF5' : 'rgba(0, 173, 181, 0.2)',
                  color: selectedCategory === cat.toLowerCase() ? '#00FFF5' : 'var(--text-secondary)',
                  fontWeight: selectedCategory === cat.toLowerCase() ? 700 : 500
                }}
              >
                {cat} ({getCategoryCount(cat)})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '160px', flex: '1 1 160px', maxWidth: '240px' }}>
            <Search size={13} color="#00FFF5" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              className="glass-input"
              style={{
                width: '100%',
                padding: '4px 8px 4px 26px',
                fontSize: '11px',
                borderRadius: '0px'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Active Schedule List Items */}
        {activeSchedules.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={28} style={{ opacity: 0.35 }} />
            <div>
              {completedSchedules.length > 0
                ? 'Semua tugas aktif sudah selesai! Cek "List Tugas Beres" di bawah.'
                : searchQuery || selectedCategory !== 'all'
                ? 'Tidak ada tugas yang sesuai dengan filter pencarian / kategori.'
                : 'Belum ada tugas atau deadline ujian yang dijadwalkan.'}
            </div>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="glass-button"
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '0px' }}
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeSchedules.map((s) => renderTaskCard(s, false))}
          </div>
        )}
      </div>

      {/* ================= SECTION 2: LIST TUGAS BERES (RIWAYAT SELESAI) ================= */}
      {completedSchedules.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 18px',
            borderRadius: '0px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'rgba(20, 30, 26, 0.55)'
          }}
        >
          {/* Header List Tugas Beres */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: isCompletedListExpanded ? '14px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{
                padding: '5px',
                borderRadius: '0px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <CheckCircle2 size={15} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                List Tugas Beres (Riwayat Selesai)
              </h3>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px' }}>
                {completedSchedules.length} Beres
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCompletedListExpanded((prev) => !prev)}
              className="glass-button"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '0px',
                color: '#10b981',
                borderColor: 'rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>{isCompletedListExpanded ? 'Sembunyikan' : `Tampilkan (${completedSchedules.length})`}</span>
              {isCompletedListExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* List of Completed Task Cards */}
          {isCompletedListExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedSchedules.map((s) => renderTaskCard(s, true))}
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT TASK MODAL ================= */}
      {editingSchedule && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSchedule(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel task-modal-container"
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 173, 181, 0.2)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '6px',
                  borderRadius: '0px',
                  background: 'rgba(0, 173, 181, 0.2)',
                  border: '1px solid rgba(0, 173, 181, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={16} color="#00FFF5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                    Edit Tugas & Progres
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Atur persentase pengerjaan dan rincian apa saja yang belum
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="glass-button"
                style={{ padding: '6px 8px', borderRadius: '0px', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Judul */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Judul Tugas / Ujian:
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Contoh: Laporan Praktikum, Resume Bab 3..."
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%' }}
                  required
                />
              </div>

              {/* Kategori */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Kategori:
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Contoh: Tugas Kuliah, Kuis, Praktikum..."
                  value={editJenis}
                  onChange={(e) => setEditJenis(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%' }}
                  required
                />
              </div>

              {/* Progress Slider (% Selesai) */}
              <div style={{
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 173, 181, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#00FFF5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} />
                    <span>Sudah Berapa Persen?</span>
                  </label>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: editProgress === 100 ? '#10b981' : '#00FFF5'
                  }}>
                    {editProgress}% {editProgress === 100 ? '(Selesai)' : ''}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="task-progress-slider"
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[0, 25, 50, 75, 100].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditProgress(p)}
                      className="glass-button"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        borderRadius: '0px',
                        background: editProgress === p ? 'rgba(0, 173, 181, 0.35)' : 'transparent',
                        borderColor: editProgress === p ? '#00FFF5' : 'rgba(0, 173, 181, 0.2)',
                        color: editProgress === p ? '#00FFF5' : 'var(--text-secondary)',
                        fontWeight: editProgress === p ? 800 : 500
                      }}
                    >
                      {p === 100 ? '100% Selesai' : `${p}%`}
                    </button>
                  ))}

                  {editSubtasks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoCalcEditProgress}
                      className="glass-button"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        borderRadius: '0px',
                        color: '#00FFF5',
                        borderColor: 'rgba(0, 173, 181, 0.3)'
                      }}
                      title="Hitung persentase otomatis dari jumlah checklist yang sudah dicentang"
                    >
                      Hitung Otomatis dari Checklist
                    </button>
                  )}
                </div>
              </div>

              {/* Subtasks Checklist ("Apa Saja Yang Belum") */}
              <div style={{
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 173, 181, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ListTodo size={14} color="#00FFF5" />
                  <span>Checklist ("Apa Saja Yang Belum"):</span>
                </label>

                {/* Input Add Subtask */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    id="edit-new-subtask-input"
                    type="text"
                    className="glass-input"
                    placeholder="Ketik apa yang belum (misal: Bab 1, Analisis, Daftar Pustaka)..."
                    value={newEditSubtaskInput}
                    onChange={(e) => setNewEditSubtaskInput(e.target.value)}
                    style={{ borderRadius: '0px', width: '100%', fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddEditSubtask}
                    className="glass-button glass-button-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '0px', flexShrink: 0 }}
                  >
                    + Tambah
                  </button>
                </div>

                {/* Subtask Items List */}
                {editSubtasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', marginTop: '4px' }}>
                    {editSubtasks.map((st) => (
                      <div
                        key={st.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(34, 40, 49, 0.7)',
                          border: st.done ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 173, 181, 0.2)'
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, fontSize: '12px', color: st.done ? 'var(--text-muted)' : '#EEEEEE', textDecoration: st.done ? 'line-through' : 'none' }}>
                          <input
                            type="checkbox"
                            checked={st.done}
                            onChange={() => handleToggleEditSubtask(st.id)}
                            style={{ cursor: 'pointer', accentColor: '#00FFF5' }}
                          />
                          <span>{st.text}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveEditSubtask(st.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px', opacity: 0.8 }}
                          title="Hapus item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Belum ada rincian checklist. Kamu bisa menambahkan item-item tugas di atas.
                  </div>
                )}
              </div>

              {/* Start Date & Deadline Date Grid */}
              <div className="task-modal-date-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tanggal Mulai:
                  </label>
                  <input
                    type="date"
                    className="glass-input"
                    value={editTanggalMulai}
                    onChange={(e) => setEditTanggalMulai(e.target.value)}
                    style={{ borderRadius: '0px', width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Batas Pengumpulan (Deadline):
                  </label>
                  <input
                    type="date"
                    className="glass-input"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    style={{ borderRadius: '0px', width: '100%' }}
                    required
                  />
                </div>
              </div>

              {/* Jam Deadline Time */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Jam Deadline:
                </label>
                <input
                  type="time"
                  className="glass-input"
                  value={editJamTenggat}
                  onChange={(e) => setEditJamTenggat(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%' }}
                  required
                />
              </div>

              {/* Catatan Tambahan (Notes) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Catatan Tambahan (Opsional):
                </label>
                <textarea
                  className="glass-input"
                  placeholder="Catatan dari dosen, link pengumpulan, ketentuan format..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%', minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              {/* File Lampiran Tugas (Word, PPT, PDF, Link Drive) */}
              <div style={{
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 173, 181, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} color="#00FFF5" />
                    <span>File Lampiran / Berkas Tugas (PPT, Word, PDF):</span>
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Maks. 15MB per file
                  </span>
                </div>

                {/* Upload & Link Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    className="glass-button glass-button-primary"
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '0px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <UploadCloud size={13} />
                    <span>+ Upload File (PPT / Word / PDF)</span>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.doc,.docx,.pdf,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                      onChange={(e) => handleFileUpload(e, true)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowEditLinkInput(!showEditLinkInput)}
                    className="glass-button"
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '0px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#00FFF5',
                      borderColor: 'rgba(0, 173, 181, 0.4)'
                    }}
                  >
                    <Link2 size={13} />
                    <span>{showEditLinkInput ? 'Tutup Input Link' : '+ Tambah Link Drive/Docs'}</span>
                  </button>
                </div>

                {/* Add Link Input Box */}
                {showEditLinkInput && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(0, 173, 181, 0.08)',
                    border: '1px dashed rgba(0, 173, 181, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <input
                      id="edit-link-url-input"
                      type="url"
                      className="glass-input"
                      placeholder="Tempel link Google Drive / Google Docs / Materi..."
                      value={editLinkUrl}
                      onChange={(e) => setEditLinkUrl(e.target.value)}
                      style={{ borderRadius: '0px', fontSize: '12px', width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        id="edit-link-title-input"
                        type="text"
                        className="glass-input"
                        placeholder="Nama/Keterangan link (opsional)..."
                        value={editLinkTitle}
                        onChange={(e) => setEditLinkTitle(e.target.value)}
                        style={{ borderRadius: '0px', fontSize: '12px', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddExternalLink(true)}
                        className="glass-button glass-button-primary"
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '0px', flexShrink: 0 }}
                      >
                        Simpan Link
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Attached Files */}
                {editAttachments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
                    {editAttachments.map((att) => {
                      const badge = getFileBadgeInfo(att);
                      return (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'rgba(34, 40, 49, 0.8)',
                            border: `1px solid ${badge.border}`,
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                              {badge.icon}
                            </div>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              color: badge.color,
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              flexShrink: 0,
                              textTransform: 'uppercase'
                            }}>
                              {badge.label}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              color: '#EEEEEE',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }} title={att.name}>
                              {att.name}
                            </span>
                            {att.size && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                ({att.size})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(att)}
                              className="glass-button"
                              style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '0px', color: '#00FFF5' }}
                              title={att.link ? 'Buka tautan' : 'Unduh'}
                            >
                              {att.link ? <ExternalLink size={11} /> : <Download size={11} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id, true)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                              title="Hapus lampiran"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Belum ada file PPT, Word, atau link materi yang dilampirkan.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="glass-button"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 14px', fontSize: '12px', borderRadius: '0px' }}
                >
                  Batal (Esc)
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="glass-button glass-button-primary"
                  style={{ flex: 2, justifyContent: 'center', padding: '10px 16px', fontSize: '12px', borderRadius: '0px', fontWeight: 700 }}
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan (Enter)'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ================= ADD TASK / EXAM DEADLINE POP-UP MODAL ================= */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel task-modal-container"
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 173, 181, 0.2)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '6px',
                  borderRadius: '0px',
                  background: 'rgba(0, 173, 181, 0.2)',
                  border: '1px solid rgba(0, 173, 181, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Plus size={16} color="#00FFF5" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                  Tambah Tugas / Deadline
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="glass-button"
                style={{ padding: '6px 8px', borderRadius: '0px', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Judul Tugas / Ujian:
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Contoh: Laporan Praktikum, Resume Bab 3..."
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%' }}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Kategori:
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Contoh: Tugas Kuliah, Kuis, Praktikum..."
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%' }}
                  required
                />
              </div>

              {/* Start Date & Deadline Date Grid */}
              <div className="task-modal-date-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tanggal Mulai:
                  </label>
                  <input
                    type="date"
                    className="glass-input"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    style={{ borderRadius: '0px', width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Batas Pengumpulan (Deadline):
                  </label>
                  <input
                    type="date"
                    className="glass-input"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    style={{ borderRadius: '0px', width: '100%' }}
                    required
                  />
                </div>
              </div>

              {/* Jam Deadline Time */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Jam Deadline:
                </label>
                <input
                  type="time"
                  className="glass-input"
                  value={jamTenggat}
                  onChange={(e) => setJamTenggat(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%' }}
                  required
                />
              </div>

              {/* Optional Initial Checklist */}
              <div style={{
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(0, 173, 181, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ListTodo size={13} color="#00FFF5" />
                  <span>Checklist / Apa Saja yang Dikerjakan (Opsional):</span>
                </label>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    id="add-new-subtask-input"
                    type="text"
                    className="glass-input"
                    placeholder="Tambah item (misal: Bab 1, Analisa Data)..."
                    value={newAddSubtaskInput}
                    onChange={(e) => setNewAddSubtaskInput(e.target.value)}
                    style={{ borderRadius: '0px', width: '100%', fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAddSubtask}
                    className="glass-button glass-button-primary"
                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '0px', flexShrink: 0 }}
                  >
                    + Tambah
                  </button>
                </div>

                {addSubtasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {addSubtasks.map((st) => (
                      <div
                        key={st.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          background: 'rgba(34, 40, 49, 0.6)',
                          border: '1px solid rgba(0, 173, 181, 0.15)',
                          fontSize: '11px'
                        }}
                      >
                        <span style={{ color: '#EEEEEE' }}>• {st.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddSubtask(st.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan Tambahan (Notes) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Catatan Tambahan (Opsional):
                </label>
                <textarea
                  className="glass-input"
                  placeholder="Catatan dari dosen, link pengumpulan, ketentuan format..."
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  style={{ borderRadius: '0px', width: '100%', minHeight: '55px', resize: 'vertical' }}
                />
              </div>

              {/* File Lampiran Tugas (Word, PPT, PDF, Link Drive) */}
              <div style={{
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(0, 173, 181, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} color="#00FFF5" />
                    <span>File Lampiran / Berkas Tugas (PPT, Word, PDF):</span>
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Maks. 15MB per file
                  </span>
                </div>

                {/* Upload & Link Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    className="glass-button glass-button-primary"
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '0px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <UploadCloud size={13} />
                    <span>+ Upload File (PPT / Word / PDF)</span>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.doc,.docx,.pdf,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                      onChange={(e) => handleFileUpload(e, false)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowAddLinkInput(!showAddLinkInput)}
                    className="glass-button"
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '0px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#00FFF5',
                      borderColor: 'rgba(0, 173, 181, 0.4)'
                    }}
                  >
                    <Link2 size={13} />
                    <span>{showAddLinkInput ? 'Tutup Input Link' : '+ Tambah Link Drive/Docs'}</span>
                  </button>
                </div>

                {/* Add Link Input Box */}
                {showAddLinkInput && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(0, 173, 181, 0.08)',
                    border: '1px dashed rgba(0, 173, 181, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <input
                      id="add-link-url-input"
                      type="url"
                      className="glass-input"
                      placeholder="Tempel link Google Drive / Google Docs / Materi..."
                      value={addLinkUrl}
                      onChange={(e) => setAddLinkUrl(e.target.value)}
                      style={{ borderRadius: '0px', fontSize: '12px', width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        id="add-link-title-input"
                        type="text"
                        className="glass-input"
                        placeholder="Nama/Keterangan link (opsional)..."
                        value={addLinkTitle}
                        onChange={(e) => setAddLinkTitle(e.target.value)}
                        style={{ borderRadius: '0px', fontSize: '12px', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddExternalLink(false)}
                        className="glass-button glass-button-primary"
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '0px', flexShrink: 0 }}
                      >
                        Simpan Link
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Attached Files */}
                {addAttachments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
                    {addAttachments.map((att) => {
                      const badge = getFileBadgeInfo(att);
                      return (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'rgba(34, 40, 49, 0.8)',
                            border: `1px solid ${badge.border}`,
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                              {badge.icon}
                            </div>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              color: badge.color,
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              flexShrink: 0,
                              textTransform: 'uppercase'
                            }}>
                              {badge.label}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              color: '#EEEEEE',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }} title={att.name}>
                              {att.name}
                            </span>
                            {att.size && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                ({att.size})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(att)}
                              className="glass-button"
                              style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '0px', color: '#00FFF5' }}
                              title={att.link ? 'Buka tautan' : 'Unduh'}
                            >
                              {att.link ? <ExternalLink size={11} /> : <Download size={11} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id, false)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                              title="Hapus lampiran"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Belum ada file PPT, Word, atau link materi yang dilampirkan.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="glass-button"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 14px', fontSize: '12px', borderRadius: '0px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button glass-button-primary"
                  style={{ flex: 2, justifyContent: 'center', padding: '10px 16px', fontSize: '12px', borderRadius: '0px', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ================= 2-STEP COMPLETION VERIFICATION MODAL ================= */}
      {scheduleToComplete && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setScheduleToComplete(null)}
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
              border: '1.5px solid rgba(16, 185, 129, 0.55)',
              padding: '22px',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '0px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                  Konfirmasi Selesaikan Tugas
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Yakin ingin menandai tugas ini sebagai sudah selesai 100%?
                </p>
              </div>
            </div>

            {/* Task Details Summary */}
            {(() => {
              const parsed = parseScheduleItem(scheduleToComplete);
              const subtasks = parsed.subtasks || [];
              const remaining = subtasks.filter((st) => !st.done).length;

              return (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  color: '#EEEEEE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Tugas:</strong> {parsed.cleanTitle}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Kategori:</strong> <span className={`badge badge-${(scheduleToComplete.jenis || 'tugas').toLowerCase()}`}>{(scheduleToComplete.jenis || 'tugas').toUpperCase()}</span></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Deadline:</strong> {new Date(scheduleToComplete.tanggal).toLocaleString('id-ID', { dateStyle: 'medium' })} {parsed.deadlineTime ? `(Pukul ${parsed.deadlineTime})` : ''}</div>

                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px', color: remaining > 0 ? '#f87171' : '#10b981' }}>
                    {remaining > 0
                      ? `ℹ️ Ada ${remaining} sub-tugas yang belum dicentang. Menandai selesai akan mengubah status tugas menjadi 100% (SELESAI), menghapusnya dari kalender, dan memindahkannya ke "List Tugas Beres".`
                      : `✓ Seluruh (${subtasks.length}) checklist sub-tugas sudah selesai. Tugas akan dipindahkan ke "List Tugas Beres" dan terhapus dari kalender.`
                    }
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setScheduleToComplete(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '0px' }}
              >
                Batal (Esc)
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="glass-button"
                style={{
                  fontSize: '13px',
                  padding: '8px 18px',
                  background: '#10b981',
                  color: 'white',
                  borderColor: '#10b981',
                  fontWeight: 700,
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={15} />
                <span>Ya, Tandai Selesai (Enter)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= 2-STEP REOPEN VERIFICATION MODAL ================= */}
      {scheduleToReopen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setScheduleToReopen(null)}
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
              border: '1.5px solid rgba(0, 173, 181, 0.55)',
              padding: '22px',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 173, 181, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '0px',
                background: 'rgba(0, 173, 181, 0.15)',
                border: '1px solid rgba(0, 173, 181, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00FFF5',
                flexShrink: 0
              }}>
                <Circle size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                  Kembalikan ke Tugas Aktif?
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Tugas ini akan kembali aktif dan muncul lagi di kalender serta daftar tugas aktif.
                </p>
              </div>
            </div>

            {(() => {
              const parsed = parseScheduleItem(scheduleToReopen);
              return (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  color: '#EEEEEE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Tugas:</strong> {parsed.cleanTitle}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Kategori:</strong> <span className={`badge badge-${(scheduleToReopen.jenis || 'tugas').toLowerCase()}`}>{(scheduleToReopen.jenis || 'tugas').toUpperCase()}</span></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Deadline:</strong> {new Date(scheduleToReopen.tanggal).toLocaleString('id-ID', { dateStyle: 'medium' })}</div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setScheduleToReopen(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '0px' }}
              >
                Batal (Esc)
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="glass-button glass-button-primary"
                style={{
                  fontSize: '13px',
                  padding: '8px 18px',
                  borderRadius: '0px',
                  fontWeight: 700
                }}
              >
                Ya, Kembalikan ke Aktif (Enter)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= 2-STEP DELETION VERIFICATION MODAL ================= */}
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
                  Konfirmasi Hapus Jadwal
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Yakin mau menghapus jadwal ini? Data yang dihapus tidak bisa dikembalikan lagi ya.
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
              <div><strong style={{ color: 'var(--text-muted)' }}>Judul:</strong> {parseScheduleItem(scheduleToDelete).cleanTitle}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Kategori:</strong> <span className={`badge badge-${(scheduleToDelete.jenis || 'tugas').toLowerCase()}`}>{(scheduleToDelete.jenis || 'tugas').toUpperCase()}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Deadline:</strong> {new Date(scheduleToDelete.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>

            <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>
              * Jadwal ini akan langsung dihapus secara permanen.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setScheduleToDelete(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Batal (Esc)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
                Ya, Hapus Jadwal (Enter)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
