import { useEffect, useState } from "react";

type MobileJumpButtonProps = {
  onJump: () => void;
  disabled?: boolean;
};

export function MobileJumpButton({ onJump, disabled = false }: MobileJumpButtonProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(isTouchDevice && (isSmallScreen || isMobileUA));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <button
      onClick={onJump}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      disabled={disabled}
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '60px',
        fontSize: '24px',
        zIndex: 1000,
        opacity: disabled ? 0.3 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      Jump
    </button>
  );
}
