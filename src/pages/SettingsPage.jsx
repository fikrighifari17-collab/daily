import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Download, 
  KeyRound, 
  Check, 
  FileSpreadsheet, 
  FileJson, 
  User, 
  Camera, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Save, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user, handleUpdateProfile, pinCode, setAppPin } = useAuth();
  const { moods, schedules, tags, copingList, brainDumps } = useData();
  const { toast } = useToast();

  // Profile Edit State
  const [nama, setNama] = useState(user?.nama || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // PIN State
  const [inputPin, setInputPin] = useState(pinCode || '');

  const fileInputRef = useRef(null);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 200x200 to keep it ultra lightweight
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
        toast.info('Photo loaded. Click "Save Profile" to apply!');
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Avatar Presets
  const avatarPresets = ['🌿', '🎓', '☕', '🐱', '🚀', '✨', '🧘', '🎧'];

  // Save Profile (Name, Username, Avatar)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await handleUpdateProfile({
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        avatar: avatar || null
      });

      if (res?.user) {
        toast.success('Profile & username successfully updated!');
      } else {
        toast.error('Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
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

  // Save PIN
  const handleSavePin = (e) => {
    e.preventDefault();
    if (inputPin.length === 4) {
      setAppPin(inputPin);
      toast.success('Security PIN successfully enabled!');
    } else if (inputPin.length === 0) {
      setAppPin('');
      toast.info('Security PIN disabled.');
    } else {
      toast.error('PIN must be exactly 4 digits.');
    }
  };

  // Export JSON
  const exportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      user,
      moods,
      schedules,
      tags,
      copingList,
      brainDumps
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `semestara_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('JSON backup file downloaded successfully!');
  };

  // Export CSV
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Date,Time,MoodScore,Notes\n";
    moods.forEach((m) => {
      const row = [
        m.id,
        m.tanggal,
        m.waktu,
        m.moodScore,
        `"${(m.catatan || '').replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `semestara_moods_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('CSV mood history file downloaded successfully!');
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
              Update your username, profile photo, change password, and configure PIN privacy lock.
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
        
        {/* ================= CARD 1: PROFILE & AVATAR PHOTO ================= */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '8px', border: '1px solid rgba(0, 173, 181, 0.25)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={18} color="#00ADB5" />
            <span>Profile & Photo</span>
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Avatar Photo Preview & Upload Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(34, 40, 49, 0.6)', borderRadius: '8px', border: '1px solid rgba(0, 173, 181, 0.2)' }}>
              {/* Photo Display */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.3), rgba(57, 62, 70, 0.8))',
                border: '2px solid #00ADB5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 0 15px rgba(0, 173, 181, 0.3)'
              }}>
                {avatar ? (
                  avatar.startsWith('data:') || avatar.startsWith('http') ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '32px' }}>{avatar}</span>
                  )
                ) : (
                  <User size={36} color="#00FFF5" />
                )}
              </div>

              {/* Upload Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  style={{ display: 'none' }} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', gap: '6px', justifyContent: 'center' }}
                >
                  <Camera size={14} />
                  <span>Upload Foto</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 4px'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Avatar Emojis */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Atau pilih avatar cepat:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {avatarPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      background: avatar === preset ? 'rgba(0, 173, 181, 0.4)' : 'rgba(57, 62, 70, 0.6)',
                      border: avatar === preset ? '2px solid #00FFF5' : '1px solid rgba(0, 173, 181, 0.2)',
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

            {/* Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Nama Lengkap (Full Name)
              </label>
              <input
                type="text"
                placeholder="e.g. Haerin"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
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

            {/* Username Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. haerin123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              disabled={savingProfile}
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
              <Save size={15} />
              <span>{savingProfile ? 'Saving...' : 'Simpan Profil & Username'}</span>
            </button>
          </form>
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

      {/* ================= CARD 3: PIN ACCESS LOCK & DATA EXPORT ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '12px'
      }}>
        
        {/* PIN Security */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '8px', border: '1px solid rgba(0, 173, 181, 0.25)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Lock size={18} color="#00ADB5" />
            <span>PIN Access Lock (Optional)</span>
          </h3>
          <p style={{ fontSize: '12px', color: '#b0b8c1', marginBottom: '14px' }}>
            Kunci antarmuka aplikasi dengan 4-digit PIN setiap kali dibuka.
          </p>

          <form onSubmit={handleSavePin} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input
              type="password"
              maxLength={4}
              placeholder="e.g. 1234 (Kosongkan jika nonaktif)"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'rgba(34, 40, 49, 0.9)',
                border: '1px solid rgba(0, 173, 181, 0.3)',
                color: '#EEEEEE',
                fontSize: '13px',
                outline: 'none',
                borderRadius: '8px',
                letterSpacing: '0.1em'
              }}
            />
            <button
              type="submit"
              className="glass-button glass-button-primary"
              style={{ padding: '9px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              <Check size={15} />
              <span>Simpan PIN</span>
            </button>
          </form>
        </div>

        {/* Data Export */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '8px', border: '1px solid rgba(0, 173, 181, 0.25)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Download size={18} color="#00ADB5" />
            <span>Export & Backup Data</span>
          </h3>
          <p style={{ fontSize: '12px', color: '#b0b8c1', marginBottom: '14px' }}>
            Unduh riwayat mood dan jadwal kuliah Anda untuk cadangan data pribadi.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={exportJSON}
              className="glass-button"
              style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', gap: '6px' }}
            >
              <FileJson size={15} color="#00ADB5" />
              <span>Full Backup (JSON)</span>
            </button>
            <button
              onClick={exportCSV}
              className="glass-button"
              style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', gap: '6px' }}
            >
              <FileSpreadsheet size={15} color="#00FFF5" />
              <span>Mood History (CSV)</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
