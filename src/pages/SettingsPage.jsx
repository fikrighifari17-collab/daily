import React, { useState } from 'react';
import { ShieldCheck, Lock, Download, Trash2, KeyRound, Check, FileSpreadsheet, FileJson, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user, pinCode, setAppPin } = useAuth();
  const { moods, schedules, tags, copingList, brainDumps } = useData();
  const { toast } = useToast();

  const [inputPin, setInputPin] = useState(pinCode || '');
  const [pinStatusMsg, setPinStatusMsg] = useState('');

  const handleSavePin = (e) => {
    e.preventDefault();
    if (inputPin.length === 4) {
      setAppPin(inputPin);
      toast.success('Security PIN successfully updated & enabled!');
      setPinStatusMsg('Security PIN successfully updated & enabled!');
      setTimeout(() => setPinStatusMsg(''), 3000);
    } else if (inputPin.length === 0) {
      setAppPin('');
      toast.info('Security PIN disabled.');
      setPinStatusMsg('Security PIN disabled.');
      setTimeout(() => setPinStatusMsg(''), 3000);
    } else {
      toast.error('PIN must be 4 numeric digits.');
      setPinStatusMsg('PIN must be 4 numeric digits.');
      setTimeout(() => setPinStatusMsg(''), 3000);
    }
  };

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
    downloadAnchor.setAttribute("download", `emotion_calendar_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('JSON backup file downloaded successfully!');
  };

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
    link.setAttribute("download", `emotion_calendar_moods_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('CSV mood history file downloaded successfully!');
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', border: '1px solid rgba(0, 173, 181, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
            <ShieldCheck size={20} color="#00FFF5" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE' }}>Privacy, Security & Data Export</h2>
            <p style={{ fontSize: '12px', color: '#b0b8c1' }}>
              Configure local PIN lock protection and backup your full mental health history anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Principles Card */}
      <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldCheck size={20} color="#00ADB5" />
          <span>User Privacy Principles & Guarantees</span>
        </h3>
        <ul style={{ fontSize: '12px', color: '#b0b8c1', paddingLeft: '18px', lineHeight: 1.7 }}>
          <li><strong>Full Autonomy:</strong> All mood data and notes are stored privately for you alone.</li>
          <li><strong>No Third Parties:</strong> No automatic reporting to professors, university departments, or any institutions.</li>
          <li><strong>PIN Security:</strong> Interface access can be locked with a built-in 4-digit PIN.</li>
          <li><strong>Manual Export:</strong> You can download full backup copies in JSON/CSV format at any time.</li>
        </ul>
      </div>

      {/* PIN Security Configuration */}
      <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Lock size={18} color="#00FFF5" />
          <span>PIN Access Lock (Optional)</span>
        </h3>

        {pinStatusMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={15} />
            {pinStatusMsg}
          </div>
        )}

        <form onSubmit={handleSavePin} style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              4-Digit PIN (Leave blank to disable):
            </label>
            <input
              type="password"
              maxLength={4}
              className="glass-input"
              placeholder="e.g. 1234"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <button type="submit" className="glass-button glass-button-primary" style={{ padding: '10px' }}>
            <Check size={15} />
            Save PIN Settings
          </button>
        </form>
      </div>

      {/* Data Export Options */}
      <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Download size={18} color="#00ADB5" />
          <span>Export & Data Backup</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Download your emotion history and academic schedule for personal safekeeping or further spreadsheet analysis.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={exportJSON} className="glass-button" style={{ borderColor: 'rgba(0, 173, 181, 0.4)', padding: '10px 16px', fontSize: '12px' }}>
            <FileJson size={15} color="#00FFF5" />
            <span>Full Backup (JSON)</span>
          </button>

          <button onClick={exportCSV} className="glass-button" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', padding: '10px 16px', fontSize: '12px' }}>
            <FileSpreadsheet size={15} color="#34d399" />
            <span>Mood History (CSV)</span>
          </button>
        </div>
      </div>

    </div>
  );
}



