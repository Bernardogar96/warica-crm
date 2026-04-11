import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { C } from '@/styles/theme';

interface OverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function Overlay({ children, onClose }: OverlayProps) {
  const isMobile = useIsMobile();
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,23,19,0.32)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 100,
        overflowY: 'auto',
        padding: isMobile ? 0 : 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderRadius: isMobile ? '16px 16px 0 0' : 16,
          padding: isMobile ? '20px 16px 32px' : 24,
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowStrong,
          width: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '92vh' : '90vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
