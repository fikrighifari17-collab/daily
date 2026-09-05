import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, History } from 'lucide-react';
import MoodCheckin from '../components/MoodCheckin';

export default function NewCheckinPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Navigation & Header Banner */}
      <div className="glass-panel mood-header-banner" style={{ background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.22), rgba(57, 62, 70, 0.85))', border: '1px solid rgba(0, 173, 181, 0.35)', borderRadius: '0px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', flexShrink: 0 }}>
              <PlusCircle size={20} color="#00FFF5" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>Today's Mood Check-in</h2>
              <p style={{ fontSize: '11px', color: '#b0b8c1', marginTop: '2px' }}>
                Express feelings, attach photos/videos, or record voice reflection.
              </p>
            </div>
          </div>

          <NavLink
            to="/checkin"
            className="glass-button"
            style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '0px', gap: '6px' }}
          >
            <ArrowLeft size={14} color="#00FFF5" />
            <History size={14} />
            <span>Check-in History</span>
          </NavLink>

        </div>
      </div>

      {/* Mood Checkin Form */}
      <MoodCheckin onSuccess={() => navigate('/checkin')} />

    </div>
  );
}
