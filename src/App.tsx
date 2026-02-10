import "./App.css";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { useState, useEffect, useRef } from "react";

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [popupData, setPopupData] = useState<{
    isOpen: boolean;
    text?: string;
    type?: "sign" | "post";
  }>({ isOpen: false });
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const previousPopupState = useRef(false);

  const handlePopupChange = (
    isOpen: boolean,
    text?: string,
    type?: "sign" | "post"
  ) => {
    setPopupData({ isOpen, text, type });
  };

  const closePopup = () => {
    setPopupData({ isOpen: false });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape" && popupData.isOpen) {
        event.preventDefault();
        event.stopPropagation();
        closePopup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popupData.isOpen]);

  useEffect(() => {
    if (previousPopupState.current && !popupData.isOpen) {
      const canvas = canvasRef.current?.querySelector("canvas");
      if (canvas) {
        setTimeout(() => {
          canvas.requestPointerLock();
        }, 100);
      }
    }
    previousPopupState.current = popupData.isOpen;
  }, [popupData.isOpen]);

  return (
    <div className="canvas-container" ref={canvasRef}>
      {/* Overlay de fondu au noir */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          opacity: fadeOpacity,
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />

      <Canvas
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [0, 1, 5],
        }}
      >
        <Scene 
          onPopupChange={handlePopupChange} 
          isPopupOpen={popupData.isOpen}
          onFadeChange={setFadeOpacity}
        />
      </Canvas>
      
      {popupData.isOpen && popupData.type && (
        <div
          className={
            popupData.type === "post" ? "postSignPopup" : "signPopup"
          }
          role="dialog"
          aria-live="polite"
        >
          <p>{popupData.text}</p>
          <button
            className="sign-popup-close"
            type="button"
            onClick={closePopup}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
