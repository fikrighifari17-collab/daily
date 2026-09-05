import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Camera, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2,
  Crop,
  ChevronDown,
  Edit3,
  X,
  Check,
  Hash,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AvatarCropModal from '../components/AvatarCropModal';

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
    }
  }, [user]);

  // Discord Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rawCropImage, setRawCropImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  const openEditProfileModal = () => {
    setNama(user?.nama || '');
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setTag(user?.tag || '#');
    setDescribe(user?.describe || 'Best emoji to describe your day?');
    setIsEditModalOpen(true);
  };

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
      await handleUpdateProfile({
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        avatar: preset
      });
      toast.success('Avatar berhasil diperbarui!');
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui avatar.');
    }
  };

  // Auto-save Nama & Username saat selesai mengetik (onBlur) atau tekan Enter
  const handleAutoSaveField = async () => {
    if (!username.trim()) {
      toast.error('Username tidak boleh kosong.');
      return;
    }
    if (nama.trim() === (user?.nama || '') && username.trim().toLowerCase() === (user?.username || '')) {
      return;
    }
    try {
      const res = await handleUpdateProfile({
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        avatar: avatar || null
      });
      if (res?.user) {
        toast.success('Profil berhasil diperbarui!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui profil.');
    }
  };

  // Save Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await handleUpdateProfile({
        currentPassword,
        newPassword
      });

      if (res?.user) {
        toast.success('Password successfully changed!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Failed to update password.');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating password. Check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ 
        padding: '18px 20px', 
        background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', 
        border: '1px solid rgba(0, 173, 181, 0.3)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            padding: '10px', 
            borderRadius: '8px', 
            background: 'rgba(0, 173, 181, 0.2)', 
            border: '1px solid rgba(0, 173, 181, 0.4)' 
          }}>
            <ShieldCheck size={22} color="#00FFF5" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>Account & Profile Settings</h2>
            <p style={{ fontSize: '12px', color: '#b0b8c1', margin: '3px 0 0 0' }}>
              Perbarui nama, username, foto profil, dan kata sandi akun Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Column (Profile & Photo), Right Column (Password & PIN) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '12px'
      }}>
        
        {/* ================= CARD 1: DISCORD-STYLE USER PROFILE CARD ================= */}
        <div style={{
          background: '#181a20',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 173, 181, 0.25)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 173, 181, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Banner (Discord style) */}
          <div style={{
            height: '75px',
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

                {/* Status Indicator Dot (Online Green) */}
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '3px solid #181a20'
                }} />
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
            </div>

            {/* Category / Collection Pill (Game Collection style) */}
            <div style={{
              background: '#232428',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                Akun Mahasiswa
              </span>
              <span style={{
                fontSize: '11px',
                color: '#00FFF5',
                background: 'rgba(0, 173, 181, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                border: '1px solid rgba(0, 173, 181, 0.35)'
              }}>
                Aktif
              </span>
            </div>

            {/* Action Card: Edit Profile only (Tanpa Do Not Disturb & Switch Accounts) */}
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
                <span>Edit Profile</span>
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

        {/* ================= CARD 2: CHANGE PASSWORD ("BENARKAN PASSWORD") ================= */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '8px', border: '1px solid rgba(0, 173, 181, 0.25)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <KeyRound size={18} color="#00ADB5" />
            <span>Ganti Password</span>
          </h3>

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Current Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Password Saat Ini
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: 'rgba(34, 40, 49, 0.9)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    borderRadius: '8px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showCurrentPass ? '#00FFF5' : '#b0b8c1',
                    cursor: 'pointer'
                  }}
                >
                  {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Password Baru (Min. 6 Karakter)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: 'rgba(34, 40, 49, 0.9)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    borderRadius: '8px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showNewPass ? '#00FFF5' : '#b0b8c1',
                    cursor: 'pointer'
                  }}
                >
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                required
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(34, 40, 49, 0.9)',
                  border: '1px solid rgba(0, 173, 181, 0.3)',
                  color: '#EEEEEE',
                  fontSize: '13px',
                  outline: 'none',
                  borderRadius: '8px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="glass-button glass-button-primary"
              style={{
                marginTop: '4px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '8px'
              }}
            >
              <KeyRound size={15} />
              <span>{savingPassword ? 'Updating...' : 'Perbarui Password'}</span>
            </button>
          </form>
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
                  <span>Edit Profile</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Sesuaikan foto profil, nama, tag #, status describe, dan username akun Anda.
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
                onClick={async () => {
                  if (!username.trim()) {
                    toast.error('Username tidak boleh kosong.');
                    return;
                  }
                  try {
                    const res = await handleUpdateProfile({
                      nama: nama.trim(),
                      username: username.trim().toLowerCase(),
                      avatar: avatar || null,
                      tag: tag.trim() || '#',
                      describe: describe.trim() || 'Best emoji to describe your day?'
                    });
                    if (res?.user) {
                      toast.success('Profil berhasil diperbarui!');
                      setIsEditModalOpen(false);
                    }
                  } catch (err) {
                    toast.error(err.message || 'Gagal memperbarui profil.');
                  }
                }}
                className="glass-button glass-button-primary"
                style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, gap: '6px' }}
              >
                <Check size={14} />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
