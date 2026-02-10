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
  const [pokemonPopupData, setPokemonPopupData] = useState<{
    isOpen: boolean;
    pokemonName?: string;
  }>({ isOpen: false });
  const [isPokemonPicked, setIsPokemonPicked] = useState(false);
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

  const handlePokemonPopupChange = (isOpen: boolean, pokemonName?: string) => {
    setPokemonPopupData({ isOpen, pokemonName });
  };

  const handlePokemonPick = (pokemonName: string) => {
    // Close pokemon picker popup
    setPokemonPopupData({ isOpen: false });
    
    // Disable movement
    setIsPokemonPicked(true);
    
    const endPopup = document.querySelector('.endPopup');
    if (endPopup) {
      endPopup.classList.remove('hidden');
      endPopup.innerHTML = `You picked ${pokemonName} as your starter! You are now ready to go explore the world of Pokémon. <br /><br />Made with &lt;3 by antoine, every model made by myself except the pokemons that are from the cobblemon gitlab :) <br /><br /><button type="button" onclick="window.location.reload()">Restart</button>`;
    }
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
    const anyPopupOpen = popupData.isOpen || pokemonPopupData.isOpen;
    if (previousPopupState.current && !anyPopupOpen) {
      const canvas = canvasRef.current?.querySelector("canvas");
      if (canvas) {
        setTimeout(() => {
          canvas.requestPointerLock();
        }, 100);
      }
    }
    previousPopupState.current = anyPopupOpen;
  }, [popupData.isOpen, pokemonPopupData.isOpen]);

  return (
    <div className="canvas-container" ref={canvasRef}>
      <div className="endPopup hidden"></div>
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
          isPopupOpen={popupData.isOpen || pokemonPopupData.isOpen}
          onFadeChange={setFadeOpacity}
          onPokemonPopupChange={handlePokemonPopupChange}
          onPokemonPick={handlePokemonPick}
          isPokemonPicked={isPokemonPicked}
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

      {pokemonPopupData.isOpen && pokemonPopupData.pokemonName && (
        <div
          className="signPopup"
          role="dialog"
          aria-live="polite"
        >
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
            style={{ marginLeft: '10px' }}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
