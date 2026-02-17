import { useEffect, useState } from "react";
import { Joystick } from "react-joystick-component";
import { IJoystickUpdateEvent } from "react-joystick-component/build/lib/Joystick";

type MobileControlsProps = {
  onDirectionChange: (x: number, y: number) => void;
  disabled?: boolean;
};

export function MobileControls({ onDirectionChange, disabled = false }: MobileControlsProps) {
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

  const handleMove = (event: IJoystickUpdateEvent) => {
    if (disabled) {
      onDirectionChange(0, 0);
      return;
    }
    
    const x = (event.x ?? 0) / 100;
    const y = -(event.y ?? 0) / 100;
    
    onDirectionChange(x, y);
  };

  const handleStop = () => {
    onDirectionChange(0, 0);
  };

  if (!isMobile) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '60px',
        right: '40px',
        zIndex: 1000,
        pointerEvents: disabled ? 'none' : 'auto',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'none',
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <Joystick
        size={100}
        baseColor="rgba(255, 255, 255, 0.3)"
        stickColor="rgba(255, 255, 255, 0.7)"
        move={handleMove}
        stop={handleStop}
      />
    </div>
  );
}
