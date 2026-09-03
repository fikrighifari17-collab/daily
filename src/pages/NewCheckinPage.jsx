import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, History } from 'lucide-react';
import MoodCheckin from '../components/MoodCheckin';

export default function NewCheckinPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Navigation & Header Banner */}
      <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.22), rgba(57, 62, 70, 0.85))', border: '1px solid rgba(0, 173, 181, 0.35)', borderRadius: '0px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
              <PlusCircle size={22} color="#00FFF5" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>Today's Mood Check-in Form</h2>
              <p style={{ fontSize: '12px', color: '#b0b8c1', marginTop: '2px' }}>
                Express your feelings right now, attach photos/atmosphere, or record a private voice note.
              </p>
            </div>
          </div>

          <NavLink
            to="/checkin"
            className="glass-button"
            style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', gap: '6px' }}
          >
            <ArrowLeft size={15} color="#00FFF5" />
            <History size={15} />
            <span>View Check-in History</span>
          </NavLink>

        </div>
      </div>

      {/* Mood Checkin Form */}
      <MoodCheckin onSuccess={() => navigate('/checkin')} />

    </div>
  );
}
