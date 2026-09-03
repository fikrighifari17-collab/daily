import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, BarChart3, ShieldCheck, Lock, PlusCircle, History, BookOpen, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { pinCode, lockAppNow } = useAuth();

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: '8px',
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 173, 181, 0.25)',
      background: 'rgba(34, 40, 49, 0.9)',
      marginBottom: '8px',
      borderRadius: '0px'
    }}>
      <div style={{ width: '100%', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', background: 'rgba(57, 62, 70, 0.6)', padding: '4px 6px', borderRadius: '0px', border: '1px solid rgba(0, 173, 181, 0.2)', flexWrap: 'wrap', flex: 1 }}>
          {[
            { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
            { to: '/checkin/new', label: 'Mood Check-in', icon: PlusCircle },
            { to: '/checkin', label: 'Mood History', icon: History, end: true },
            { to: '/insight', label: 'Insights & Analytics', icon: BarChart3 },
            { to: '/academic-schedule', label: 'Academic Schedule', icon: BookOpen },
            { to: '/schedule', label: 'Tasks & Deadlines', icon: Calendar },
            { to: '/settings', label: 'Privacy & PIN', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `glass-button ${isActive ? 'glass-button-primary' : ''}`}
                style={({ isActive }) => ({
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '0px',
                  background: isActive ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 173, 181, 0.4)' : 'none',
                  color: isActive ? '#ffffff' : '#b0b8c1',
                  fontWeight: isActive ? 700 : 600
                })}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Lock Action Button */}
        {pinCode && (
          <button
            onClick={lockAppNow}
            className="glass-button"
            style={{ borderColor: 'rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '12px', padding: '6px 12px', borderRadius: '0px', background: 'rgba(239, 68, 68, 0.1)' }}
            title="Lock application now"
          >
            <Lock size={14} />
            <span>Lock App</span>
          </button>
        )}

      </div>
    </header>
  );
}



