import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Camera, 
  Eye, 
  EyeOff, 
  Trash2, 
  Crop, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  X, 
  Check, 
  Hash, 
  MessageSquare,
  Send,
  Bell,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AvatarCropModal from '../components/AvatarCropModal';
import { 
  getStoredChatId, 
  setStoredChatId, 
  isTelegramNotificationEnabled, 
  setTelegramNotificationEnabled, 
  testTelegramConnection, 
  BOT_URL, 
  BOT_USERNAME 
} from '../services/telegramService';

export default function SettingsPage() {
  const { user, handleUpdateProfile } = useAuth();
  const { toast } = useToast();

  // Profile Edit State
  const [nama, setNama] = useState(user?.nama || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [tag, setTag] = useState(user?.tag || '#');
  const [describe, setDescribe] = useState(user?.describe || 'Best emoji to describe your day?');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setUsername(user.username || '');
      setAvatar(user.avatar || '');
      if (user.tag !== undefined) setTag(user.tag || '#');
      if (user.describe !== undefined) setDescribe(user.describe || 'Best emoji to describe your day?');
      if (user.telegramChatId) setTelegramChatId(user.telegramChatId);
    }
  }, [user]);

  // Telegram Notifications State
  const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId || getStoredChatId());
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(isTelegramNotificationEnabled());
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  // Discord Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rawCropImage, setRawCropImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  // Edit Profile Modal Password State
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditCurrentPass, setShowEditCurrentPass] = useState(false);
  const [showEditNewPass, setShowEditNewPass] = useState(false);
  const [showEditConfirmPass, setShowEditConfirmPass] = useState(false);
  const [isPasswordExpandedInModal, setIsPasswordExpandedInModal] = useState(false);
  const [savingEditProfile, setSavingEditProfile] = useState(false);

  const openEditProfileModal = () => {
    setNama(user?.nama || '');
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setTag(user?.tag || '#');
    setDescribe(user?.describe || 'Best emoji to describe your day?');
    setTelegramChatId(user?.telegramChatId || getStoredChatId());
    setIsTelegramEnabled(isTelegramNotificationEnabled());
    setEditCurrentPassword('');
    setEditNewPassword('');
    setEditConfirmPassword('');
    setShowEditCurrentPass(false);
    setShowEditNewPass(false);
    setShowEditConfirmPass(false);
    setIsPasswordExpandedInModal(false);
    setIsEditModalOpen(true);
  };

  const fileInputRef = useRef(null);
  const editMenuRef = useRef(null);

  // Close edit menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editMenuRef.current && !editMenuRef.current.contains(e.target)) {
        setShowEditMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setRawCropImage(uploadEvent.target.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl) => {
    setAvatar(croppedDataUrl);
    setIsCropModalOpen(false);
    setRawCropImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Otomatis tersimpan begitu selesai crop
    try {
      const res = await handleUpdateProfile({
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        avatar: croppedDataUrl
      });
      if (res?.user) {
        toast.success('Foto profil berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan foto profil.');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan foto profil.');
    }
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setRawCropImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = async () => {
    setShowEditMenu(false);
    setAvatar('');
    try {
      await handleUpdateProfile({
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        avatar: null
      });
      toast.info('Foto profil berhasil dihapus.');
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus foto.');
    }
  };

  // Avatar Presets
  const avatarPresets = ['🌿', '🎓', '☕', '🐱', '🚀', '✨', '🧘', '🎧'];

  const handleSelectPreset = async (preset) => {
    setAvatar(preset);
    try {
      const res = await handleUpdateProfile({
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        avatar: preset
      });
      if (res?.user) {
        toast.success('Avatar berhasil diperbarui!');
      } else {
        toast.error('Gagal memperbarui avatar.');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui avatar.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel page-header-panel" style={{ 
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            padding: '7px', 
            borderRadius: '8px', 
            background: 'rgba(0, 173, 181, 0.2)', 
            border: '1px solid rgba(0, 173, 181, 0.4)',
            flexShrink: 0
          }}>
            <ShieldCheck size={18} color="#00FFF5" />
          </div>
          <div>
            <h2 className="page-header-title" style={{ fontWeight: 800, color: '#EEEEEE', margin: 0, lineHeight: 1.2 }}>Account & Profile Settings</h2>
            <p className="mobile-hide" style={{ fontSize: '11px', color: '#b0b8c1', margin: '2px 0 0 0' }}>
              Perbarui nama, username, foto profil, dan kata sandi akun Anda.
            </p>
          </div>
        </div>
      </div>

      {/* DISCORD-STYLE USER PROFILE CARD */}
      <div style={{
        width: '100%',
        background: '#181a20',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 173, 181, 0.25)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 173, 181, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Banner (Discord style) */}
        <div style={{
          height: '80px',
          background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.45), rgba(34, 40, 49, 0.95))',
          position: 'relative',
          borderBottom: '1px solid rgba(0, 173, 181, 0.2)'
        }} />

        {/* Profile Card Body */}
        <div style={{ padding: '0 18px 20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Avatar & Speech Bubble Row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-42px' }}>
            {/* Circular Avatar */}
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Klik untuk mengganti foto profil"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: '6px solid #181a20',
                background: '#222831',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
              className="discord-avatar-container"
            >
              {avatar ? (
                avatar.startsWith('data:') || avatar.startsWith('http') ? (
                  <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '38px' }}>{avatar}</span>
                )
              ) : (
                <User size={40} color="#00FFF5" />
              )}

              {/* Hover Camera Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s'
              }}
              className="discord-avatar-overlay"
              >
                <Camera size={20} color="#FFFFFF" />
              </div>

            </div>

            {/* Status Speech Bubble (Discord style) */}
            <div 
              onClick={openEditProfileModal}
              title="Klik untuk ubah status describe"
              style={{
                position: 'relative',
                background: '#2b2d31',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                color: '#b0b8c1',
                maxWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#32353b'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2b2d31'}
            >
              {/* Speech Bubble Arrow */}
              <div style={{
                position: 'absolute',
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '6px solid #2b2d31'
              }} />
              <span style={{ color: '#00FFF5', fontSize: '13px' }}>+</span>
              <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.describe || 'Best emoji to describe your day?'}
              </span>
            </div>
          </div>

          {/* User Identity: Bold Name & Handle */}
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 800,
              color: '#EEEEEE',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}>
              {user?.nama || 'SAXTON'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
                .{user?.username || 'pikrii'}
              </span>
              <span style={{
                background: 'rgba(0, 173, 181, 0.25)',
                color: '#00FFF5',
                fontSize: '11px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 173, 181, 0.4)'
              }}>
                {user?.tag ? (user.tag.startsWith('#') ? user.tag : `#${user.tag}`) : '#'}
              </span>
            </div>

            {/* Telegram Bot Connection Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#00FFF5',
                  background: 'rgba(0, 173, 181, 0.15)',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 173, 181, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                title="Klik untuk membuka bot di Telegram"
              >
                <Send size={11} color="#00FFF5" />
                <span>Telegram: @{BOT_USERNAME}</span>
                <span style={{
                  fontSize: '9px',
                  background: isTelegramEnabled && telegramChatId ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  color: isTelegramEnabled && telegramChatId ? '#10b981' : '#94a3b8',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 800
                }}>
                  {isTelegramEnabled && telegramChatId ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </a>
            </div>
          </div>


          {/* Action Card: Edit Profile only */}
          <div style={{
            background: '#232428',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <button
              type="button"
              onClick={openEditProfileModal}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: '#EEEEEE',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Edit3 size={16} color="#94a3b8" />
              <span>Edit Profil</span>
            </button>
          </div>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handlePhotoUpload} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>



      {/* Discord-style Avatar Crop Modal */}
      {isCropModalOpen && rawCropImage && (
        <AvatarCropModal
          imageSrc={rawCropImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Discord-style Edit Profile Modal (Mounted to document.body for true viewport centering) */}
      {isEditModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99990,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#181a20',
              border: '1px solid rgba(0, 173, 181, 0.35)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 173, 181, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={18} color="#00FFF5" />
                  <span>Edit Profil</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Atur foto profil, nama, tag #, status bio, dan username kamu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Avatar Edit Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 14px',
              background: '#232428',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#222831',
                border: '3px solid #00ADB5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {avatar ? (
                  avatar.startsWith('data:') || avatar.startsWith('http') ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '30px' }}>{avatar}</span>
                  )
                ) : (
                  <User size={32} color="#00FFF5" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '6px', gap: '4px' }}
                  >
                    <Camera size={13} />
                    <span>Ganti Foto</span>
                  </button>

                  {avatar && (avatar.startsWith('data:') || avatar.startsWith('http')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawCropImage(avatar);
                        setIsCropModalOpen(true);
                      }}
                      className="glass-button"
                      style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '6px', gap: '4px', color: '#00FFF5' }}
                    >
                      <Crop size={13} />
                      <span>Pangkas</span>
                    </button>
                  )}

                  {avatar && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Mendukung JPG, PNG, WEBP (Maks. 10MB)</span>
              </div>
            </div>

            {/* Quick Avatar Emojis */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Atau pilih avatar cepat:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {avatarPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      background: avatar === preset ? 'rgba(0, 173, 181, 0.4)' : '#232428',
                      border: avatar === preset ? '2px solid #00FFF5' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#b0b8c1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Display Name (Nama Tampilan)
              </label>
              <input
                type="text"
                placeholder="e.g. SAXTON"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#232428',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#EEEEEE',
                  fontSize: '13px',
                  outline: 'none',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Username & Tag (#) Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#b0b8c1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px', fontWeight: 700 }}>
                    .
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="pikrii"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 20px',
                      background: '#232428',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#EEEEEE',
                      fontSize: '13px',
                      outline: 'none',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#b0b8c1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Hash size={12} color="#00FFF5" />
                  <span>Tag (#)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="# atau #0001"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#232428',
                    border: '1px solid rgba(0, 173, 181, 0.35)',
                    color: '#00FFF5',
                    fontWeight: 700,
                    fontSize: '13px',
                    outline: 'none',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Describe / Status Mood */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#b0b8c1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <MessageSquare size={12} color="#00FFF5" />
                  <span>Describe / Status Mood</span>
                </label>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Gelembung pesan avatar</span>
              </div>
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. Best emoji to describe your day? atau Lagi fokus ngoding 💻"
                value={describe}
                onChange={(e) => setDescribe(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#232428',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#EEEEEE',
                  fontSize: '13px',
                  outline: 'none',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Telegram Bot Notification Integration */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.12), rgba(35, 36, 40, 0.95))',
              borderRadius: '12px',
              border: '1px solid rgba(0, 173, 181, 0.35)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0, 173, 181, 0.25)' }}>
                    <Send size={15} color="#00FFF5" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Notifikasi Bot Telegram
                      <span style={{ fontSize: '10px', color: '#00FFF5', background: 'rgba(0, 173, 181, 0.2)', padding: '1px 6px', borderRadius: '4px' }}>
                        @{BOT_USERNAME}
                      </span>
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Kirim otomatis tugas & deadline kuliah ke Telegram
                    </span>
                  </div>
                </div>

                <a
                  href={BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '11px',
                    color: '#00FFF5',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0, 173, 181, 0.15)',
                    border: '1px solid rgba(0, 173, 181, 0.3)'
                  }}
                  title="Buka bot di Telegram"
                >
                  <span>Buka Bot</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#b0b8c1', marginBottom: '5px' }}>
                  TELEGRAM CHAT ID
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Contoh: 8025609014"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#181a20',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#00FFF5',
                      fontWeight: 700,
                      fontSize: '12px',
                      outline: 'none',
                      borderRadius: '6px'
                    }}
                  />
                  <button
                    type="button"
                    disabled={isTestingTelegram}
                    onClick={async () => {
                      if (!telegramChatId.trim()) {
                        toast.error('Masukkan Chat ID terlebih dahulu.');
                        return;
                      }
                      setIsTestingTelegram(true);
                      try {
                        const displayName = nama || username || 'demo';
                        const res = await testTelegramConnection(telegramChatId.trim(), displayName);
                        if (res?.ok) {
                          toast.success('Pesan tes berhasil dikirim! Silakan periksa Telegram Anda.');
                        } else {
                          if (res?.description?.includes('chat not found')) {
                            toast.error('Gagal: Buka @Semestara_Bot di Telegram dan klik tombol "START" terlebih dahulu!');
                          } else {
                            toast.error(res?.description || res?.error || 'Gagal mengirim pesan tes Telegram.');
                          }
                        }
                      } catch (err) {
                        toast.error(err.message || 'Gagal terhubung ke Telegram.');
                      } finally {
                        setIsTestingTelegram(false);
                      }
                    }}
                    className="glass-button"
                    style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px', whiteSpace: 'nowrap', gap: '5px' }}
                  >
                    <Send size={12} color="#00FFF5" />
                    <span>{isTestingTelegram ? 'Mengirim...' : 'Tes Pesan'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                <input
                  type="checkbox"
                  id="telegramToggle"
                  checked={isTelegramEnabled}
                  onChange={(e) => setIsTelegramEnabled(e.target.checked)}
                  style={{ accentColor: '#00ADB5', cursor: 'pointer' }}
                />
                <label htmlFor="telegramToggle" style={{ fontSize: '11px', color: '#EEEEEE', cursor: 'pointer' }}>
                  Aktifkan kirim notifikasi otomatis saat menambah/menyelesaikan tugas
                </label>
              </div>

              <div style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                💡 <em>Catatan:</em> Pastikan Anda sudah membuka <a href={BOT_URL} target="_blank" rel="noreferrer" style={{ color: '#00FFF5' }}>@{BOT_USERNAME}</a> dan menekan tombol <strong>Start</strong> di Telegram agar bot diizinkan mengirim pesan.
              </div>
            </div>

            {/* Change Password Section in Edit Profile Modal */}
            <div style={{
              background: '#232428',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div
                onClick={() => setIsPasswordExpandedInModal(!isPasswordExpandedInModal)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={15} color="#00FFF5" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE' }}>
                    Ganti Password (Opsional)
                  </span>
                </div>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  {isPasswordExpandedInModal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isPasswordExpandedInModal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                  {/* Password Saat Ini */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#b0b8c1', marginBottom: '5px' }}>
                      PASSWORD SAAT INI
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEditCurrentPass ? 'text' : 'password'}
                        placeholder="Masukkan password saat ini"
                        value={editCurrentPassword}
                        onChange={(e) => setEditCurrentPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 36px 8px 12px',
                          background: '#181a20',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#EEEEEE',
                          fontSize: '12px',
                          outline: 'none',
                          borderRadius: '6px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditCurrentPass(!showEditCurrentPass)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: showEditCurrentPass ? '#00FFF5' : '#b0b8c1',
                          cursor: 'pointer'
                        }}
                      >
                        {showEditCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#b0b8c1', marginBottom: '5px' }}>
                      PASSWORD BARU (MIN. 6 KARAKTER)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEditNewPass ? 'text' : 'password'}
                        placeholder="Masukkan password baru"
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 36px 8px 12px',
                          background: '#181a20',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#EEEEEE',
                          fontSize: '12px',
                          outline: 'none',
                          borderRadius: '6px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditNewPass(!showEditNewPass)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: showEditNewPass ? '#00FFF5' : '#b0b8c1',
                          cursor: 'pointer'
                        }}
                      >
                        {showEditNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password Baru dengan tombol mata */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#b0b8c1', marginBottom: '5px' }}>
                      KONFIRMASI PASSWORD BARU
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEditConfirmPass ? 'text' : 'password'}
                        placeholder="Ulangi password baru"
                        value={editConfirmPassword}
                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 36px 8px 12px',
                          background: '#181a20',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#EEEEEE',
                          fontSize: '12px',
                          outline: 'none',
                          borderRadius: '6px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditConfirmPass(!showEditConfirmPass)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: showEditConfirmPass ? '#00FFF5' : '#b0b8c1',
                          cursor: 'pointer'
                        }}
                      >
                        {showEditConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="glass-button"
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px' }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingEditProfile}
                onClick={async () => {
                  if (!username.trim()) {
                    toast.error('Username tidak boleh kosong.');
                    return;
                  }

                  const wantsToChangePass = Boolean(editCurrentPassword || editNewPassword || editConfirmPassword);
                  if (wantsToChangePass) {
                    if (!editCurrentPassword) {
                      toast.error('Masukkan password saat ini untuk mengganti password.');
                      return;
                    }
                    if (editNewPassword.length < 6) {
                      toast.error('Password baru minimal 6 karakter.');
                      return;
                    }
                    if (editNewPassword !== editConfirmPassword) {
                      toast.error('Konfirmasi password baru tidak cocok.');
                      return;
                    }
                  }

                  setSavingEditProfile(true);
                  try {
                    const payload = {
                      nama: nama.trim(),
                      username: username.trim().toLowerCase(),
                      avatar: avatar || null,
                      tag: tag.trim() || '#',
                      describe: describe.trim() || 'Best emoji to describe your day?',
                      telegramChatId: telegramChatId.trim() || null
                    };
                    if (wantsToChangePass) {
                      payload.currentPassword = editCurrentPassword;
                      payload.newPassword = editNewPassword;
                    }

                    // Save telegram preference locally
                    setStoredChatId(telegramChatId);
                    setTelegramNotificationEnabled(isTelegramEnabled);

                    const res = await handleUpdateProfile(payload);
                    if (res?.user) {
                      toast.success(wantsToChangePass ? 'Profil & password berhasil diperbarui!' : 'Profil berhasil diperbarui!');
                      setIsEditModalOpen(false);
                    }
                  } catch (err) {
                    toast.error(err.message || 'Gagal memperbarui profil.');
                  } finally {
                    setSavingEditProfile(false);
                  }
                }}
                className="glass-button glass-button-primary"
                style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, gap: '6px' }}
              >
                <Check size={14} />
                <span>{savingEditProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
