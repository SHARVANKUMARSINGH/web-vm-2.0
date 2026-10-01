import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [booting, setBooting] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const screenRef = useRef(null);
  const emulatorRef = useRef(null);

  useEffect(() => {
    // Only proceed when user triggers the Boot OS button
    if (!booting) return;

    // Dynamically create <script src="/libv86.js"> and append it to document.body
    const script = document.createElement('script');
    script.src = '/libv86.js';
    script.async = true;

    // script.onload event listener prevents booting before engine exists
    script.onload = () => {
      try {
        // Inside the onload, instantiate new window.V86Starter({...})
        const emulator = new window.V86Starter({
          wasm_path: '/v86.wasm',
          bios: { url: '/seabios.bin' },
          vga_bios: { url: '/vgabios.bin' },
          cdrom: { url: '/TinyCore-current.iso' },

          // Allocate 512 MB RAM to stay within mobile WebAssembly limits
          memory_size: 512 * 1024 * 1024,
          vga_memory_size: 32 * 1024 * 1024,

          screen_container: screenRef.current,
          autostart: true,
          network_relay_url: 'wss://relay.widgetry.org/',
          disable_keyboard: false,
          disable_mouse: false,
        });

        emulatorRef.current = emulator;

        emulator.add_listener('download-progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        emulator.add_listener('emulator-ready', () => {
          setRunning(true);
        });
      } catch (err) {
        console.error('Failed to initialize v86:', err);
        setError('Failed to initialize v86 emulator.');
      }
    };

    script.onerror = () => {
      console.error('Failed to load /libv86.js');
      setError('Failed to load /libv86.js. Please verify it is in public/');
    };

    // If already loaded in window, run onload directly; otherwise append script
    if (window.V86Starter) {
      script.onload();
    } else {
      document.body.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      if (emulatorRef.current) {
        emulatorRef.current.destroy();
        emulatorRef.current = null;
      }
    };
  }, [booting]);

  const handleBoot = () => {
    setError(null);
    setBooting(true);
  };

  return (
    <div className="vm-root">
      {!running && (
        <div className="status-overlay">
          <div className="status-content">
            <h1 className="status-title">Web VM 2.0</h1>
            <p className="status-subtitle">x86 Linux · In Your Browser</p>

            {!booting && (
              <button className="boot-button" onClick={handleBoot}>
                ▶ Boot OS
              </button>
            )}

            {booting && !error && (
              <>
                <p className="status-text">Booting Tiny Core Linux…</p>
                {progress > 0 && (
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="status-text status-error">
                {error}
              </p>
            )}

            <p className="status-hint">512 MB RAM · 32 MB VRAM · v86 Emulation</p>
          </div>
        </div>
      )}

      {/* Exact DOM structure required by v86 */}
      <div id="screen_container" ref={screenRef} className="screen-container">
        <div style={{ whiteSpace: 'pre', font: '14px monospace', lineHeight: '14px' }} />
        <canvas style={{ display: 'none' }} />
      </div>
    </div>
  );
}
