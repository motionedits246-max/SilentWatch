import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Download, X } from 'lucide-react';
import { ExportFolderIllustration } from '@/assets/VisualAssets';
import type { MotionTier } from '@/types/telemetry';

interface ExportActionButtonProps {
  label?: string;
  motionTier: MotionTier;
  onExport: () => Promise<{ filename: string; saved_path: string | null }>;
}

export const ExportActionButton: React.FC<ExportActionButtonProps> = ({
  label = 'Export Sanitized Report',
  motionTier,
  onExport,
}) => {
  const [phase, setPhase] = useState<'idle' | 'working' | 'saved' | 'error'>('idle');
  const [toastFile, setToastFile] = useState<string | null>(null);

  const handleClick = async () => {
    if (phase === 'working') return;
    setPhase('working');
    try {
      const res = await onExport();
      setPhase('saved');
      setToastFile(res.filename);
      setTimeout(() => setPhase('idle'), 2200);
      setTimeout(() => setToastFile(null), 3600);
    } catch {
      setPhase('error');
      setTimeout(() => setPhase('idle'), 2400);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="sw-cta-primary"
        style={{
          minWidth: 196,
          background:
            phase === 'saved'
              ? 'rgba(94, 209, 138, 0.16)'
              : phase === 'error'
                ? 'rgba(224, 108, 117, 0.18)'
                : 'var(--sw-mauve)',
          color: phase === 'saved' ? '#5ED18A' : phase === 'error' ? '#E06C75' : '#0A0A0A',
          borderColor:
            phase === 'saved' ? '#5ED18A' : phase === 'error' ? '#E06C75' : 'rgba(253,206,241,0.35)',
        }}
      >
        {phase === 'idle' && (
          <>
            <Download size={14} strokeWidth={2} />
            <span>{label}</span>
          </>
        )}
        {phase === 'working' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} aria-label="Exporting">
            {motionTier === 'off' ? (
              <span>Exporting...</span>
            ) : (
              <>
                <span className="sw-dot-wave-1" style={{ width: 5, height: 5, borderRadius: '50%', background: '#0A0A0A' }} />
                <span className="sw-dot-wave-2" style={{ width: 5, height: 5, borderRadius: '50%', background: '#0A0A0A' }} />
                <span className="sw-dot-wave-3" style={{ width: 5, height: 5, borderRadius: '50%', background: '#0A0A0A' }} />
              </>
            )}
          </span>
        )}
        {phase === 'saved' && (
          <>
            <Check size={15} strokeWidth={2.2} />
            <span>Saved Locally</span>
          </>
        )}
        {phase === 'error' && (
          <>
            <X size={15} strokeWidth={2.2} />
            <span>Export Failed</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {toastFile && (
          <motion.div
            initial={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: motionTier === 'off' ? 0.08 : 0.22 }}
            style={{
              position: 'fixed',
              right: 22,
              bottom: 22,
              zIndex: 90,
              background: 'var(--sw-glass)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(94, 209, 138, 0.36)',
              borderRadius: 14,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
            }}
          >
            <ExportFolderIllustration size={38} tucked />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#5ED18A' }}>Sanitized report saved</div>
              <div className="mono" style={{ fontSize: 11, color: '#A8A2A8', marginTop: 2 }}>
                {toastFile}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
