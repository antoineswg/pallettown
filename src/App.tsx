import "./App.css";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { LoadingScreen } from "./components/LoadingScreen";
import { MobileControls } from "./components/MobileControls";
import { MobileJumpButton } from "./components/MobileJumpButton";
import { Suspense, useState, useEffect, useRef } from "react";

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [popupData, setPopupData] = useState<{
    isOpen: boolean;
    text?: string;
    type?: "sign" | "post";
  }>({ isOpen: false });
  const [pokemonPopupData, setPokemonPopupData] = useState<{
    isOpen: boolean;
    pokemonName?: string;
  }>({ isOpen: false });
  const [endScreenData, setEndScreenData] = useState<{
    isOpen: boolean;
    pokemonName?: string;
  }>({ isOpen: false });
  const [isPokemonPicked, setIsPokemonPicked] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [joystickDirection, setJoystickDirection] = useState({ x: 0, y: 0 });
  const [shouldJump, setShouldJump] = useState(false);
  const previousPopupState = useRef(false);
  const pointerLockTimeoutRef = useRef<number | null>(null);

  const handleLoadingComplete = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (canvas) {
      pointerLockTimeoutRef.current = window.setTimeout(() => {
        const anyPopupOpen =
          popupData.isOpen || pokemonPopupData.isOpen || endScreenData.isOpen;
        if (!anyPopupOpen) {
          canvas.requestPointerLock();
        }
        pointerLockTimeoutRef.current = null;
      }, 100);
    }
  };

  const handlePopupChange = (
    isOpen: boolean,
    text?: string,
    type?: "sign" | "post",
  ) => {
    setPopupData({ isOpen, text, type });
  };

  const closePopup = () => {
    setPopupData({ isOpen: false });
  };

  const handlePokemonPopupChange = (isOpen: boolean, pokemonName?: string) => {
    setPokemonPopupData({ isOpen, pokemonName });
  };

  const handlePokemonPick = (pokemonName: string) => {
    // Close pokemon picker popup
    setPokemonPopupData({ isOpen: false });

    // Disable movement
    setIsPokemonPicked(true);
    setEndScreenData({ isOpen: true, pokemonName });
  };

  const handleJoystickChange = (x: number, y: number) => {
    setJoystickDirection({ x, y });
  };

  const handleJump = () => {
    setShouldJump(true);
    setTimeout(() => setShouldJump(false), 100);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape" && popupData.isOpen) {
        event.preventDefault();
        event.stopPropagation();
        closePopup();
      }
      if (event.code === "Escape" && pokemonPopupData.isOpen) {
        event.preventDefault();
        event.stopPropagation();
        setPokemonPopupData({ isOpen: false });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popupData.isOpen, pokemonPopupData.isOpen]);

  useEffect(() => {
    const anyPopupOpen =
      popupData.isOpen || pokemonPopupData.isOpen || endScreenData.isOpen;

    if (anyPopupOpen && pointerLockTimeoutRef.current !== null) {
      clearTimeout(pointerLockTimeoutRef.current);
      pointerLockTimeoutRef.current = null;
    }

    if (previousPopupState.current && !anyPopupOpen && !endScreenData.isOpen) {
      const canvas = canvasRef.current?.querySelector("canvas");
      if (canvas) {
        pointerLockTimeoutRef.current = window.setTimeout(() => {
          canvas.requestPointerLock();
          pointerLockTimeoutRef.current = null;
        }, 100);
      }
    }
    previousPopupState.current = anyPopupOpen;
  }, [popupData.isOpen, pokemonPopupData.isOpen, endScreenData.isOpen]);

  return (
    <div className="canvas-container" ref={canvasRef}>
      <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "black",
          opacity: fadeOpacity,
          transition: "opacity 0.5s ease-in-out",
          pointerEvents: "none",
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
        <Suspense fallback={null}>
          <Scene
            onPopupChange={handlePopupChange}
            isPopupOpen={
              popupData.isOpen ||
              pokemonPopupData.isOpen ||
              endScreenData.isOpen
            }
            onFadeChange={setFadeOpacity}
            onPokemonPopupChange={handlePokemonPopupChange}
            onPokemonPick={handlePokemonPick}
            isPokemonPicked={isPokemonPicked}
            joystickX={joystickDirection.x}
            joystickY={joystickDirection.y}
            shouldJump={shouldJump}
          />
        </Suspense>
      </Canvas>

      <MobileControls
        onDirectionChange={handleJoystickChange}
        disabled={
          popupData.isOpen ||
          pokemonPopupData.isOpen ||
          endScreenData.isOpen ||
          isPokemonPicked
        }
      />

      <MobileJumpButton
        onJump={handleJump}
        disabled={
          popupData.isOpen ||
          pokemonPopupData.isOpen ||
          endScreenData.isOpen ||
          isPokemonPicked
        }
      />

      {popupData.isOpen && popupData.type && (
        <div
          className={popupData.type === "post" ? "postSignPopup" : "signPopup"}
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

      {pokemonPopupData.isOpen && pokemonPopupData.pokemonName && (
        <div className="signPopup" role="dialog" aria-live="polite">
          <p>Are you sure you want to pick {pokemonPopupData.pokemonName}?</p>
          <button
            className="sign-popup-close"
            type="button"
            onClick={() => handlePokemonPick(pokemonPopupData.pokemonName!)}
          >
            Yes
          </button>
          <button
            className="sign-popup-close"
            type="button"
            onClick={() => setPokemonPopupData({ isOpen: false })}
            style={{ marginLeft: "10px" }}
          >
            No
          </button>
        </div>
      )}

      {endScreenData.isOpen && endScreenData.pokemonName && (
        <div className="signPopup">
          <p>
            You picked {endScreenData.pokemonName} as your starter! You are now
            ready to go explore the world of Pokémon.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
