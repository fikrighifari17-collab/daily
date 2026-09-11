import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Frown, Meh, Smile, Zap, AlertCircle, Mic, MicOff, Check, Plus, Tag as TagIcon, Clock, Camera, Image as ImageIcon, Upload, X, Trash2, Video, RefreshCw, Play, Pause, Square } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { isVideoUrl, compressImageFile } from '../utils/mediaUtils';

const getMoodInfo = (percent) => {
  if (percent <= 20) return { label: 'Lagi Kacau / Drop', desc: 'Stres berat / Overwhelmed banget', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.18)', score: 1 };
  if (percent <= 40) return { label: 'Stres / Berat', desc: 'Beban pikiran lumayan numpuk', color: '#f97316', bg: 'rgba(249, 115, 22, 0.18)', score: 2 };
  if (percent <= 60) return { label: 'Biasa Aja / Datar', desc: 'Lempeng, stabil, santai', color: '#eab308', bg: 'rgba(234, 179, 8, 0.18)', score: 3 };
  if (percent <= 80) return { label: 'Tenang / Adem', desc: 'Positif, lega, & produktif', color: '#00ADB5', bg: 'rgba(0, 173, 181, 0.18)', score: 4 };
  return { label: 'Semangat / Happy', desc: 'Full energi & ceria banget', color: '#10b981', bg: 'rgba(16, 185, 129, 0.18)', score: 5 };
};

const formatSeconds = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function MoodCheckin({ onSuccess }) {
  const { tags, addMoodEntry, createTag } = useData();
  const { toast } = useToast();

  const [percent, setPercent] = useState(60);
  const [userLabel, setUserLabel] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Real voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNoteData, setVoiceNoteData] = useState(null); // base64 audio data url
  const [voiceNoteDuration, setVoiceNoteDuration] = useState(0); // final seconds recorded
  const [voiceNoteError, setVoiceNoteError] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  const [photoUrl, setPhotoUrl] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' | 'video'
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecordingSeconds, setVideoRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoTimerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Lock body scrolling when camera modal is active so it cannot be scrolled
  useEffect(() => {
    if (isCameraActive) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCameraActive]);

  // Clean up audio streams, video streams, and timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const timeFormatted = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const toggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleAddNewTag = async (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tag = await createTag(newTagInput.trim());
    if (tag) {
      setSelectedTagIds([...selectedTagIds, tag.id]);
      setNewTagInput('');
    }
  };

  const startRecording = async () => {
    setVoiceNoteError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let options = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceNoteData(reader.result);
        };
        reader.readAsDataURL(blob);

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop());
          audioStreamRef.current = null;
        }
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1;
          // Auto-stop after 10 minutes (600 seconds)
          if (next >= 600) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error("Microphone access error:", err);
      setVoiceNoteError("Gagal akses mikrofon. Coba izinkan akses mikrofon di browsermu ya.");
      toast.error("Gagal akses mikrofon. Cek izin browser kamu ya.");
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setVoiceNoteDuration(recordingSeconds);
  };

  const handleRemoveVoiceNote = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }
    setIsPlayingVoice(false);
    setVoiceNoteData(null);
    setVoiceNoteDuration(0);
    setRecordingSeconds(0);
    setVoiceNoteError(null);
  };

  const togglePlayVoiceNote = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingVoice) {
      audioPreviewRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      audioPreviewRef.current.play().then(() => {
        setIsPlayingVoice(true);
      }).catch(err => {
        console.error("Play error:", err);
      });
    }
  };

  const handleMediaFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Check size limit: 30MB
    if (file.size > 30 * 1024 * 1024) {
      toast.error('Ukuran file kegedean (maks 30MB). Pilih video yang lebih pendek atau foto yang lebih kecil ya.');
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file, 1200, 0.8);
        setPhotoUrl(compressed);
        toast.success('Foto berhasil dikompres dan dilampirkan!');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoUrl(reader.result);
          toast.success('Video berhasil dilampirkan!');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File process error:', err);
      toast.error('Gagal memproses file yang dipilih.');
    }
  };

  const handleRemoveMedia = () => {
    setPhotoUrl(null);
  };

  const startCamera = async (initialMode = 'photo') => {
    setCameraError(null);
    setCameraMode(initialMode);
    setIsCameraActive(true);
    setIsRecordingVideo(false);
    setVideoRecordingSeconds(0);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
      } catch (audioErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      }
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Gagal buka kamera. Pastikan kamu sudah kasih izin akses kamera di browsermu ya.");
    }
  };

  const stopCamera = () => {
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      try {
        videoRecorderRef.current.stop();
      } catch (e) { }
    }
    setIsRecordingVideo(false);
    setVideoRecordingSeconds(0);

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoUrl(dataUrl);
    stopCamera();
    toast.success('Foto berhasil dijepret!');
  };

  const startVideoRecording = () => {
    if (!cameraStreamRef.current) return;
    videoChunksRef.current = [];

    let options = {};
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        options = { mimeType: 'video/webm;codecs=vp9,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
    }
    options.videoBitsPerSecond = 800000;

    try {
      const recorder = new MediaRecorder(cameraStreamRef.current, options);
      videoRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'video/webm';
        const blob = new Blob(videoChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoUrl(reader.result);
          toast.success('Klip video berhasil direkam dan disimpan!');
          stopCamera();
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(200);
      setIsRecordingVideo(true);
      setVideoRecordingSeconds(0);

      videoTimerRef.current = setInterval(() => {
        setVideoRecordingSeconds(prev => {
          const next = prev + 1;
          if (next >= 60) {
            stopVideoRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Video record error:", err);
      toast.error("Gagal merekam video di perangkat ini.");
    }
  };

  const stopVideoRecording = () => {
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }
    setIsRecordingVideo(false);
  };

  const currentMoodInfo = getMoodInfo(percent);
  const activeLabel = userLabel.trim() ? userLabel : currentMoodInfo.label;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Build note containing custom label if provided
    let finalNote = catatan;
    if (userLabel.trim()) {
      const header = activeLabel;
      finalNote = catatan.trim() ? `${header} - ${catatan}` : header;
    }

    try {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const fullWaktuStr = timeStr;

      await addMoodEntry({
        moodScore: currentMoodInfo.score,
        catatan: finalNote,
        waktu: fullWaktuStr,
        tanggal,
        tagIds: selectedTagIds,
        voiceNotePath: voiceNoteData || null,
        photoUrl: photoUrl
      });

      toast.success('Catatan mood berhasil disimpan!');
      setMessage({ type: 'success', text: 'Catatan mood berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);

      setCatatan('');
      setUserLabel('');
      handleRemoveVoiceNote();
      setPhotoUrl(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Gagal menyimpan catatan mood.');
      setMessage({ type: 'error', text: 'Gagal menyimpan catatan mood.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel mood-checkin-card">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Catat Mood Hari Ini</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Gimana perasaanmu sekarang? Catatan ini tersimpan rahasia & aman cuma buat kamu.
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '0px',
          marginBottom: '16px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} style={{ flexShrink: 0 }} />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Continuous Slider Track Bar (0% - 100%) */}
        <div className="mood-slider-panel">
          <div className="mood-slider-header">
            <div className="mood-slider-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Level Mood:
                </label>
                <span style={{
                  background: currentMoodInfo.bg,
                  color: currentMoodInfo.color,
                  border: `1px solid ${currentMoodInfo.color}`,
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {currentMoodInfo.label}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {currentMoodInfo.desc}
              </div>
            </div>

            {/* Live Percentage Indicator */}
            <div style={{
              padding: '4px 12px',
              background: currentMoodInfo.bg,
              border: `2px solid ${currentMoodInfo.color}`,
              color: currentMoodInfo.color,
              fontSize: '22px',
              fontWeight: 800,
              borderRadius: '0px',
              textAlign: 'center',
              minWidth: '72px',
              boxShadow: `0 0 14px ${currentMoodInfo.color}33`,
              alignSelf: 'flex-start'
            }}>
              {percent}%
            </div>
          </div>

          {/* Free-Entry Mood Name Input */}
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              value={userLabel}
              onChange={(e) => setUserLabel(e.target.value)}
              placeholder={`Beri nama perasaanmu (bawaan: ${currentMoodInfo.label})...`}
              className="mood-name-input"
              style={{
                background: 'var(--bg-input)',
                border: `1.5px solid ${currentMoodInfo.color}`,
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '13px',
                padding: '8px 12px',
                outline: 'none',
                borderRadius: '0px',
                boxShadow: `0 0 8px ${currentMoodInfo.color}22`
              }}
              title="Tulis sebutan perasaanmu secara bebas"
            />
          </div>

          {/* Slider Input (0 to 100) */}
          <div style={{ position: 'relative', margin: '14px 0 8px 0' }}>
            {/* Visual Fill Bar */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translateY(-50%)',
              height: '12px',
              width: `${percent}%`,
              background: `linear-gradient(90deg, #ef4444 0%, ${currentMoodInfo.color} 100%)`,
              pointerEvents: 'none',
              zIndex: 1,
              borderRadius: '0px'
            }} />

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              style={{ position: 'relative', zIndex: 2 }}
            />
          </div>

          {/* Labels for 0% and 100% bounds */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            <span>0% (Lagi Drop)</span>
            <span>50%</span>
            <span>100% (Happy Banget)</span>
          </div>
        </div>

        {/* Date & Time of Day */}
        <div className="mood-datetime-grid">
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Tanggal:
            </label>
            <input
              type="date"
              className="glass-input"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Waktu Catat:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'rgba(0, 173, 181, 0.12)',
              border: '1px solid rgba(0, 173, 181, 0.35)',
              color: 'var(--accent-teal)',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '0px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <Clock size={16} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
              <span>{timeFormatted}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                (Otomatis Real-time)
              </span>
            </div>
          </div>
        </div>

        {/* Tags Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Tag Pemicu / Konteks (Pilih yang relevan):
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', marginBottom: '10px' }}>
            {tags.map((t) => {
              const isSelected = selectedTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '0px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'var(--bg-inner)',
                    border: `1px solid ${isSelected ? 'var(--accent-teal)' : 'var(--border-glass)'}`,
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    touchAction: 'manipulation'
                  }}
                >
                  <TagIcon size={12} />
                  {t.nama}
                </button>
              );
            })}
          </div>

          {/* Inline add new tag */}
          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '360px' }}>
            <input
              type="text"
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '0px', flex: 1, minWidth: 0 }}
              placeholder="+ Tambah tag sendiri..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="glass-button"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '0px', flexShrink: 0 }}
            >
              <Plus size={14} />
              Tambah
            </button>
          </div>
        </div>

        {/* Note / Journal */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Catatan Hati / Jurnal (Opsional):
          </label>
          <textarea
            className="glass-input"
            rows={3}
            placeholder="Ceritain apa yang lagi bikin kamu ngerasa gini (misal: tugas numpuk, dosen killer, kurang tidur)..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            style={{ resize: 'vertical', borderRadius: '0px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Photo & Video Attachment Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Lampiran Foto & Video / Suasana Mood (Opsional):
          </label>

          {photoUrl ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: 'var(--bg-inner)', padding: '6px' }}>
              {isVideoUrl(photoUrl) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <video
                    src={photoUrl}
                    controls
                    playsInline
                    style={{ maxHeight: '240px', width: '100%', borderRadius: '0px', display: 'block', background: '#000' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00FFF5', fontWeight: 700, padding: '2px 4px' }}>
                    <Video size={13} />
                    <span>Klip Video Terlampir</span>
                  </div>
                </div>
              ) : (
                <img
                  src={photoUrl}
                  alt="Checkin attachment preview"
                  style={{ maxHeight: '220px', width: '100%', objectFit: 'contain', background: '#000', borderRadius: '0px', display: 'block' }}
                />
              )}
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="glass-button"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(239, 68, 68, 0.88)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '11px',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  zIndex: 3
                }}
              >
                <X size={14} />
                {isVideoUrl(photoUrl) ? 'Hapus Video' : 'Hapus Foto'}
              </button>
            </div>
          ) : (
            <div style={{
              padding: '14px',
              borderRadius: '0px',
              background: 'var(--bg-inner)',
              border: '1px dashed var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '0px',
                  background: 'rgba(0, 173, 181, 0.15)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-teal)',
                  flexShrink: 0
                }}>
                  <Video size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Abadikan Momen & Suasana (Foto & Video)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Jepret foto langsung, rekam video pendek, atau pilih dari galeri HP/laptop
                  </div>
                </div>
              </div>

              {/* Action Buttons: Capture Photo vs Record Video vs File Upload */}
              <div className="mood-media-buttons-grid">
                {/* Live Camera Photo Button */}
                <button
                  type="button"
                  onClick={() => startCamera('photo')}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '12px', padding: '9px 12px', justifyContent: 'center' }}
                >
                  <Camera size={15} />
                  <span>Jepret Foto</span>
                </button>

                {/* Live Video Recorder Button */}
                <button
                  type="button"
                  onClick={() => startCamera('video')}
                  className="glass-button"
                  style={{
                    fontSize: '12px',
                    padding: '9px 12px',
                    justifyContent: 'center',
                    borderColor: 'rgba(239, 68, 68, 0.45)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#fca5a5'
                  }}
                >
                  <Video size={15} color="#ef4444" />
                  <span>Rekam Video</span>
                </button>

                {/* File Upload Button */}
                <label
                  className="glass-button"
                  style={{ fontSize: '12px', padding: '9px 12px', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Upload size={15} color="var(--accent-teal)" />
                  <span>Pilih Berkas</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Direct mobile camera fallback inputs */}
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                paddingTop: '6px',
                borderTop: '1px dashed var(--border-glass)'
              }}>
                <span>Kamera langsung HP:</span>
                <label style={{
                  color: 'var(--accent-teal)',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  background: 'rgba(0, 173, 181, 0.12)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Camera size={12} />
                  Jepret Foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleMediaFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <label style={{
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Video size={12} />
                  Rekam Video
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleMediaFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Live Camera Viewfinder Modal */}
        {isCameraActive && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999999,
              padding: '12px',
              overflow: 'hidden',
              touchAction: 'none',
              overscrollBehavior: 'none'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isRecordingVideo) stopCamera();
            }}
          >
            <div
              className="mood-camera-modal"
              style={{
                border: isRecordingVideo ? '1px solid #ef4444' : '1px solid rgba(0, 173, 181, 0.45)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {cameraMode === 'video' ? (
                    <>
                      <Video size={16} color="#ef4444" />
                      <span>Rekam Klip Video</span>
                    </>
                  ) : (
                    <>
                      <Camera size={16} color="var(--accent-teal)" />
                      <span>Kamera Foto Langsung</span>
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  disabled={isRecordingVideo}
                  onClick={stopCamera}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isRecordingVideo ? '#555' : '#b0b8c1',
                    cursor: isRecordingVideo ? 'not-allowed' : 'pointer',
                    padding: '4px'
                  }}
                  title="Tutup kamera"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              {!cameraError && (
                <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.45)', padding: '3px', border: '1px solid rgba(0, 173, 181, 0.25)', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={isRecordingVideo}
                    onClick={() => setCameraMode('photo')}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: cameraMode === 'photo' ? 'rgba(0, 173, 181, 0.25)' : 'transparent',
                      color: cameraMode === 'photo' ? '#00FFF5' : 'var(--text-secondary)',
                      border: cameraMode === 'photo' ? '1px solid #00ADB5' : '1px solid transparent',
                      cursor: isRecordingVideo ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={14} />
                    <span>Mode Foto</span>
                  </button>
                  <button
                    type="button"
                    disabled={isRecordingVideo}
                    onClick={() => setCameraMode('video')}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: cameraMode === 'video' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                      color: cameraMode === 'video' ? '#f87171' : 'var(--text-secondary)',
                      border: cameraMode === 'video' ? '1px solid #ef4444' : '1px solid transparent',
                      cursor: isRecordingVideo ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Video size={14} />
                    <span>Mode Video</span>
                  </button>
                </div>
              )}

              {cameraError ? (
                <div style={{
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  borderRadius: '0px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{cameraError}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label className="glass-button" style={{ fontSize: '11px', padding: '6px 10px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                      <Camera size={13} />
                      Foto Bawaan HP
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          handleMediaFileChange(e);
                          stopCamera();
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="glass-button" style={{ fontSize: '11px', padding: '6px 10px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                      <Video size={13} color="#ef4444" />
                      Video Bawaan HP
                      <input
                        type="file"
                        accept="video/*"
                        capture="environment"
                        onChange={(e) => {
                          handleMediaFileChange(e);
                          stopCamera();
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  background: '#000',
                  overflow: 'hidden',
                  border: isRecordingVideo ? '2px solid #ef4444' : '1px solid rgba(0, 173, 181, 0.25)'
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: 'min(240px, 36vh)', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Photo Mode Subtitle */}
                  {cameraMode === 'photo' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: '#00FFF5',
                      border: '1px solid rgba(0, 173, 181, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      Arahkan kamera ke sekelilingmu atau ekspresimu
                    </div>
                  )}

                  {/* Video Mode Subtitle & Status */}
                  {cameraMode === 'video' && isRecordingVideo && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 14px rgba(239, 68, 68, 0.65)'
                    }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                      <span>REC {formatSeconds(videoRecordingSeconds)} / 01:00</span>
                    </div>
                  )}

                  {cameraMode === 'video' && !isRecordingVideo && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: '#fca5a5',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      Klik "Mulai Merekam" (maks 60 dtk)
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={isRecordingVideo}
                  onClick={stopCamera}
                  className="glass-button"
                  style={{
                    fontSize: '13px',
                    padding: '8px 14px',
                    flex: 1,
                    justifyContent: 'center',
                    cursor: isRecordingVideo ? 'not-allowed' : 'pointer',
                    opacity: isRecordingVideo ? 0.5 : 1
                  }}
                >
                  Batal
                </button>

                {!cameraError && cameraMode === 'photo' && (
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '13px', padding: '8px 16px', flex: 1.5, justifyContent: 'center' }}
                  >
                    <Camera size={15} />
                    Jepret Sekarang
                  </button>
                )}

                {!cameraError && cameraMode === 'video' && !isRecordingVideo && (
                  <button
                    type="button"
                    onClick={startVideoRecording}
                    className="glass-button"
                    style={{
                      fontSize: '13px',
                      padding: '8px 16px',
                      flex: 1.5,
                      justifyContent: 'center',
                      background: '#ef4444',
                      borderColor: '#ef4444',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                    Mulai Merekam
                  </button>
                )}

                {!cameraError && cameraMode === 'video' && isRecordingVideo && (
                  <button
                    type="button"
                    onClick={stopVideoRecording}
                    className="glass-button"
                    style={{
                      fontSize: '13px',
                      padding: '8px 16px',
                      flex: 1.5,
                      justifyContent: 'center',
                      background: '#dc2626',
                      borderColor: '#ef4444',
                      color: 'white',
                      fontWeight: 700,
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.7)'
                    }}
                  >
                    <Square size={13} fill="white" />
                    Stop & Simpan
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Voice Note Recording Section */}
        <div
          className="mood-voice-panel"
          style={{
            border: `1px ${isRecording ? 'solid #ef4444' : voiceNoteData ? 'solid rgba(0, 255, 245, 0.4)' : 'dashed var(--border-glass)'}`
          }}
        >
          {voiceNoteError && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{voiceNoteError}</span>
            </div>
          )}

          <div className="mood-voice-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '0px',
                background: isRecording ? 'rgba(239, 68, 68, 0.25)' : voiceNoteData ? 'rgba(0, 173, 181, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isRecording ? '#ef4444' : voiceNoteData ? '#00FFF5' : 'rgba(255, 255, 255, 0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRecording ? '#ef4444' : voiceNoteData ? '#00FFF5' : 'var(--text-secondary)',
                flexShrink: 0
              }}>
                <Mic size={18} className={isRecording ? 'pulse-glow' : ''} />
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isRecording ? '#f87171' : 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isRecording ? (
                    <>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                      <span>Lagi Rekam Suara Curhat... ({formatSeconds(recordingSeconds)})</span>
                    </>
                  ) : voiceNoteData ? (
                    <span style={{ color: '#00FFF5' }}>Rekaman Suara Terlampir ({formatSeconds(voiceNoteDuration || recordingSeconds)})</span>
                  ) : (
                    <span>Rekaman Suara / Curhat Santai</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isRecording
                    ? 'Ceritain aja santai. Tekan "Stop Rekaman" kalau sudah beres.'
                    : voiceNoteData
                      ? 'Curhatanmu tersimpan. Klik Putar buat dengerin atau Rekam Ulang.'
                      : 'Bisa rekam curhat sampai 10 menit langsung pakai mikrofon'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mood-voice-actions">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="glass-button"
                  style={{
                    fontSize: '12px',
                    padding: '9px 16px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: '1px solid #ef4444',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <Square size={13} fill="#ffffff" />
                  <span>Stop Rekaman ({formatSeconds(recordingSeconds)})</span>
                </button>
              ) : voiceNoteData ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={togglePlayVoiceNote}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1 }}
                  >
                    {isPlayingVoice ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlayingVoice ? 'Jeda' : 'Putar Suara'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveVoiceNote}
                    className="glass-button"
                    style={{ fontSize: '12px', padding: '8px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1 }}
                    title="Hapus dan rekam ulang"
                  >
                    <Trash2 size={13} />
                    <span>Rekam Ulang</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '12px', padding: '9px 16px', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}
                >
                  <Mic size={14} />
                  <span>Mulai Rekam Suara</span>
                </button>
              )}
            </div>
          </div>

          {/* Hidden Audio Element for Playback */}
          {voiceNoteData && (
            <audio
              ref={audioPreviewRef}
              src={voiceNoteData}
              onEnded={() => setIsPlayingVoice(false)}
              onError={() => setIsPlayingVoice(false)}
              style={{ display: 'none' }}
            />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="glass-button glass-button-primary"
          style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '14px', fontWeight: 700, borderRadius: '0px' }}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan Mood'}
        </button>

      </form>
    </div>
  );
}
