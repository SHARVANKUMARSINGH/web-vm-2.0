import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

/* ─── Status Overlay ──────────────────────────────────── */
function StatusOverlay({ status, progress, onBoot }) {
  if (status === 'running') return null;

  return (
    <div className="status-overlay">
      <div className="status-content">
        <h1 className="status-title">Web VM 2.0</h1>
        <p className="status-subtitle">x86 Linux · In Your Browser</p>

        {status === 'idle' && (
          <button className="boot-button" onClick={onBoot}>
            ▶ Boot OS
          </button>
        )}

        {status === 'booting' && (
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

        {status === 'error' && (
          <p className="status-text status-error">
            Failed to start. Check the console and make sure all assets are in{' '}
            <code>public/</code>.
          </p>
        )}

        <p className="status-hint">1 024 MB RAM · 32 MB VRAM · v86 Emulation</p>
      </div>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────── */
export default function App() {
  const screenRef = useRef(null);
  const emulatorRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | booting | running | error
  const [progress, setProgress] = useState(0);

  /* ── Boot handler ─────────────────────────────────── */
  const handleBoot = useCallback(() => {
    // Guard: already started
    if (emulatorRef.current) return;

    // Guard: libv86.js not loaded
    if (typeof window.V86Starter === 'undefined') {
      console.error(
        'V86Starter is not defined. Make sure /public/libv86.js exists ' +
          'and is loaded via a <script> tag in index.html.',
      );
      setStatus('error');
      return;
    }

    setStatus('booting');
    setProgress(0);

    try {
      const emulator = new window.V86Starter({
        /* ── BIOS ──────────────────────────────────────── */
        wasm_path: '/v86.wasm',
        bios: { url: '/seabios.bin' },
        vga_bios: { url: '/vgabios.bin' },

        /* ── Boot Media ────────────────────────────────── */
        cdrom: { url: '/TinyCore-current.iso' },

        /* ── Memory — MAXIMUM POWER ────────────────────── */
        memory_size: 1024 * 1024 * 1024, // 1 024 MB (1 GB)
        vga_memory_size: 32 * 1024 * 1024, // 32 MB

        /* ── Display ───────────────────────────────────── */
        screen_container: screenRef.current,
        autostart: true,

        /* ── Networking (user-mode NAT via WebSocket) ──── */
        network_relay_url: 'wss://relay.widgetry.org/',

        /* ── Input ─────────────────────────────────────── */
        disable_keyboard: false,
        disable_mouse: false,
      });

      emulatorRef.current = emulator;

      /* Track download progress */
      emulator.add_listener('download-progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      /* VM is alive */
      emulator.add_listener('emulator-ready', () => {
        setStatus('running');
      });
    } catch (err) {
      console.error('v86 init error:', err);
      setStatus('error');
    }
  }, []);

  /* ── Cleanup on unmount ───────────────────────────── */
  useEffect(() => {
    return () => {
      if (emulatorRef.current) {
        emulatorRef.current.destroy();
        emulatorRef.current = null;
      }
    };
  }, []);

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className="vm-root">
      <StatusOverlay
        status={status}
        progress={progress}
        onBoot={handleBoot}
      />

      {/*
        v86 DOM contract — the screen_container MUST contain:
          1. A <div>  (text-mode terminal — styled with white-space: pre)
          2. A <canvas> (VGA graphical framebuffer)
        v86 will manage their visibility automatically.
      */}
      <div id="screen_container" ref={screenRef} className="screen-container">
        <div style={{ whiteSpace: 'pre', font: '14px monospace', lineHeight: '14px' }} />
        <canvas style={{ display: 'none' }} />
      </div>
    </div>
  );
}
