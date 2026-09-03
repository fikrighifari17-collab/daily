import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Frown, Meh, Smile, Zap, AlertCircle, Mic, MicOff, Check, Plus, Tag as TagIcon, Clock, Camera, Image as ImageIcon, Upload, X, Trash2, Video, RefreshCw, Play, Pause, Square } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const getMoodInfo = (percent) => {
  if (percent <= 20) return { label: 'Very Bad', desc: 'Severe stress / Overwhelmed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.18)', score: 1 };
  if (percent <= 40) return { label: 'Bad / Anxious', desc: 'Quite heavy burden', color: '#f97316', bg: 'rgba(249, 115, 22, 0.18)', score: 2 };
  if (percent <= 60) return { label: 'Neutral', desc: 'Stable / Neutral', color: '#eab308', bg: 'rgba(234, 179, 8, 0.18)', score: 3 };
  if (percent <= 80) return { label: 'Good / Calm', desc: 'Positive & productive', color: '#00ADB5', bg: 'rgba(0, 173, 181, 0.18)', score: 4 };
  return { label: 'Very Good', desc: 'Very energetic & joyful', color: '#10b981', bg: 'rgba(16, 185, 129, 0.18)', score: 5 };
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
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  // Clean up audio streams and timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
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
      setVoiceNoteError("Failed to access microphone. Please allow microphone permissions in your browser.");
      toast.error("Failed to access microphone. Please check your browser permissions.");
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

  const handlePhotoFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Failed to access camera. Please allow camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
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

      toast.success('Emotion check-in entry saved successfully!');
      setMessage({ type: 'success', text: 'Mood entry saved successfully!' });
      setTimeout(() => setMessage(null), 3000);

      setCatatan('');
      setUserLabel('');
      handleRemoveVoiceNote();
      setPhotoUrl(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Failed to save mood entry.');
      setMessage({ type: 'error', text: 'Failed to save mood entry.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', borderRadius: '0px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Today's Mood Check-in</span>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          How are you feeling right now? This data is stored privately for you.
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '0px',
          marginBottom: '20px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* Continuous Slider Track Bar (0% - 100%) */}
        <div style={{ marginBottom: '24px', background: 'rgba(34, 40, 49, 0.6)', padding: '20px', border: '1px solid rgba(0, 173, 181, 0.25)', borderRadius: '0px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Adjust Mood Slider (%):
              </label>
              
              {/* Free-Entry Mood Name Input */}
              <div style={{ marginTop: '6px' }}>
                <input
                  type="text"
                  value={userLabel}
                  onChange={(e) => setUserLabel(e.target.value)}
                  placeholder="Name this emotion..."
                  style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: `2px solid ${currentMoodInfo.color}`,
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    padding: '6px 12px',
                    outline: 'none',
                    borderRadius: '0px',
                    width: '220px',
                    boxShadow: `0 0 10px ${currentMoodInfo.color}33`
                  }}
                  title="Type your custom emotion name"
                />
              </div>
            </div>

            {/* Live Percentage Indicator */}
            <div style={{
              padding: '6px 16px',
              background: currentMoodInfo.bg,
              border: `2px solid ${currentMoodInfo.color}`,
              color: currentMoodInfo.color,
              fontSize: '26px',
              fontWeight: 800,
              borderRadius: '0px',
              boxShadow: `0 0 15px ${currentMoodInfo.color}44`
            }}>
              {percent}%
            </div>
          </div>

          {/* Slider Input (0 to 100) */}
          <div style={{ position: 'relative', margin: '20px 0 10px 0' }}>
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
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Date & Time of Day */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Date:
            </label>
            <input
              type="date"
              className="glass-input"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Check-in Time:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'rgba(0, 173, 181, 0.15)',
              border: '1px solid rgba(0, 173, 181, 0.4)',
              color: '#00FFF5',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '0px'
            }}>
              <Clock size={16} color="#00FFF5" />
              <span>{timeFormatted}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>
                (Automatic Real-time)
              </span>
            </div>
          </div>
        </div>

        {/* Tags Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Trigger / Context Tags (Select relevant):
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {tags.map((t) => {
              const isSelected = selectedTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '0px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? '#00FFF5' : 'var(--border-glass)'}`,
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <TagIcon size={13} />
                  {t.nama}
                </button>
              );
            })}
          </div>

          {/* Inline add new tag */}
          <div style={{ display: 'flex', gap: '8px', maxWidth: '350px' }}>
            <input
              type="text"
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '0px' }}
              placeholder="+ Add custom tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="glass-button"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '0px' }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {/* Note / Journal */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Emotion Notes (Optional):
          </label>
          <textarea
            className="glass-input"
            rows={3}
            placeholder="Write what is making you feel this way (e.g., assignment pileup, professor, sleep schedule)..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            style={{ resize: 'vertical', borderRadius: '0px' }}
          />
        </div>

        {/* Photo Attachment Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Photo / Daily Mood Attachment (Optional):
          </label>

          {photoUrl ? (
            <div style={{ position: 'relative', width: 'fit-content', borderRadius: '0px', overflow: 'hidden', border: '1px solid rgba(0, 173, 181, 0.4)', background: 'rgba(0, 0, 0, 0.3)', padding: '6px' }}>
              <img
                src={photoUrl}
                alt="Checkin attachment preview"
                style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'cover', borderRadius: '0px', display: 'block' }}
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="glass-button"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(239, 68, 68, 0.85)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '11px',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
                Remove Photo
              </button>
            </div>
          ) : (
            <div style={{
              padding: '18px',
              borderRadius: '0px',
              background: 'rgba(34, 40, 49, 0.4)',
              border: '1px dashed rgba(0, 173, 181, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '0px',
                  background: 'rgba(0, 173, 181, 0.15)',
                  border: '1px solid rgba(0, 173, 181, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00FFF5'
                }}>
                  <Camera size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                    Capture Today's Moment / Atmosphere
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Select from gallery or snap directly using device camera
                  </div>
                </div>
              </div>

              {/* Dual Options: Camera vs File Upload */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* Live Camera Button */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '12px', padding: '9px 16px', flex: 1, minWidth: '150px', justifyContent: 'center' }}
                >
                  <Camera size={15} />
                  <span>Capture via Camera</span>
                </button>

                {/* File Upload Button */}
                <label
                  className="glass-button"
                  style={{ fontSize: '12px', padding: '9px 16px', flex: 1, minWidth: '150px', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Upload size={15} color="#00FFF5" />
                  <span>Choose from Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Direct mobile camera fallback input */}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Or on smartphone:</span>
                <label style={{ color: '#00FFF5', cursor: 'pointer', textDecoration: 'underline' }}>
                  Open native camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Live Camera Viewfinder Modal - Rendered at document.body level to escape parent stacking contexts */}
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
              padding: '16px',
              overflow: 'hidden',
              touchAction: 'none',
              overscrollBehavior: 'none'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) stopCamera();
            }}
          >
            <div
              style={{
                background: '#1b2028',
                border: '1px solid rgba(0, 173, 181, 0.45)',
                padding: '18px 20px',
                maxWidth: '520px',
                width: '94%',
                maxHeight: 'min(580px, 92vh)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '0px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
                margin: 'auto',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="#00FFF5" />
                  <span>Live Check-in Camera</span>
                </h3>
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{ background: 'none', border: 'none', color: '#b0b8c1', cursor: 'pointer', padding: '4px' }}
                  title="Close camera"
                >
                  <X size={20} />
                </button>
              </div>

              {cameraError ? (
                <div style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  borderRadius: '0px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{cameraError}</span>
                  </div>
                  <label className="glass-button" style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}>
                    <Camera size={14} />
                    Use Native Device Camera
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        handlePhotoFileChange(e);
                        stopCamera();
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', background: '#000', overflow: 'hidden', border: '1px solid rgba(0, 173, 181, 0.25)' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: 'min(280px, 45vh)', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.65)',
                    padding: '4px 12px',
                    fontSize: '11px',
                    color: '#00FFF5',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    Point camera to your surroundings/moment
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="glass-button"
                  style={{ fontSize: '13px', padding: '9px 18px' }}
                >
                  Cancel
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '13px', padding: '9px 20px' }}
                  >
                    <Camera size={16} />
                    Take Snapshot
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Voice Note Recording Section */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '0px',
          background: 'rgba(0,0,0,0.22)',
          border: `1px ${isRecording ? 'solid #ef4444' : voiceNoteData ? 'solid rgba(0, 255, 245, 0.4)' : 'dashed var(--border-glass)'}`,
          transition: 'all 0.25s ease'
        }}>
          
          {voiceNoteError && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>{voiceNoteError}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '0px',
                background: isRecording ? 'rgba(239, 68, 68, 0.25)' : voiceNoteData ? 'rgba(0, 173, 181, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isRecording ? '#ef4444' : voiceNoteData ? '#00FFF5' : 'rgba(255, 255, 255, 0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRecording ? '#ef4444' : voiceNoteData ? '#00FFF5' : 'var(--text-secondary)'
              }}>
                <Mic size={20} className={isRecording ? 'pulse-glow' : ''} />
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isRecording ? '#f87171' : 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isRecording ? (
                    <>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                      <span>Recording Voice Note... ({formatSeconds(recordingSeconds)})</span>
                    </>
                  ) : voiceNoteData ? (
                    <span style={{ color: '#00FFF5' }}>Voice Note Attached ({formatSeconds(voiceNoteDuration || recordingSeconds)})</span>
                  ) : (
                    <span>Record Voice Note Reflection</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isRecording
                    ? 'Speak into your microphone. Click "Stop Recording" when finished.'
                    : voiceNoteData
                    ? 'Voice reflection recorded. Click Play Audio to listen or Re-record.'
                    : 'Press button to record a real voice reflection (up to 10 minutes) using your microphone'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="glass-button"
                  style={{ fontSize: '12px', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: '1px solid #ef4444', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Square size={13} fill="#ffffff" />
                  <span>Stop Recording ({formatSeconds(recordingSeconds)})</span>
                </button>
              ) : voiceNoteData ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={togglePlayVoiceNote}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isPlayingVoice ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlayingVoice ? 'Pause' : 'Play Audio'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveVoiceNote}
                    className="glass-button"
                    style={{ fontSize: '12px', padding: '8px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Delete and record again"
                  >
                    <Trash2 size={13} />
                    <span>Re-record</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Mic size={14} />
                  <span>Start Recording</span>
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
          style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '15px', borderRadius: '0px' }}
        >
          {isSubmitting ? 'Saving...' : 'Save Emotion Check-in'}
        </button>

      </form>
    </div>
  );
}
