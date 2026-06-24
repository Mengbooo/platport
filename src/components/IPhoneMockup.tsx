import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="iphone-status-bar">
      <span>{time}</span>
      <span className="iphone-status-spacer" />
      <span className="iphone-status-icons" aria-hidden="true">
        <span className="iphone-signal">
          <i />
          <i />
          <i />
          <i />
        </span>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <path d="M8.5 10.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" fill="currentColor" />
          <path d="M4.5 7.1a5.6 5.6 0 0 1 8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2.2 4.4a9.2 9.2 0 0 1 12.6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.3" />
          <rect x="2.5" y="2.5" width="17" height="7" rx="1.2" fill="currentColor" />
          <path d="M23 4.2C23.8 4.2 24.5 4.8 24.5 6C24.5 7.2 23.8 7.8 23 7.8V4.2Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

export function IPhoneMockup({
  children,
  screenStyle,
}: {
  children: ReactNode;
  screenStyle?: CSSProperties;
}) {
  return (
    <div className="iphone-mockup">
      <div className="iphone-shadow" />
      <div className="iphone-frame">
        <span className="iphone-button iphone-button-mute" />
        <span className="iphone-button iphone-button-volume-a" />
        <span className="iphone-button iphone-button-volume-b" />
        <span className="iphone-button iphone-button-power" />
        <div className="iphone-inner">
          <div className="iphone-island" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="iphone-screen" style={screenStyle}>
            <StatusBar />
            <div className="iphone-content">{children}</div>
            <div className="iphone-home-indicator" />
            <div className="iphone-glare" />
          </div>
        </div>
      </div>
    </div>
  );
}
