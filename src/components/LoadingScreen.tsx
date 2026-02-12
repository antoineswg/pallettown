import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import "./LoadingScreen.css";

type LoadingScreenProps = {
    onLoadingComplete?: () => void;
};

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
    const { progress } = useProgress();
    const [isFinished, setIsFinished] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const isReady = progress === 100

    useEffect(() => {
        const handleInteraction = () => {
            if (isReady && !isExiting) {
                setIsExiting(true);
            }
        };

        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('click', handleInteraction);

        return () => {
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, [isReady, isExiting]);

    useEffect(() => {
        if (isExiting) {
            const exitTimer = setTimeout(() => {
                setIsFinished(true);
                onLoadingComplete?.();
            }, 500);

            return () => clearTimeout(exitTimer);
        }
    }, [isExiting, onLoadingComplete]);


    if (isFinished) {
        return null;
    }

    return (
        <div className={`loading-screen ${isExiting ? 'loading-screen--exit' : ''}`}>
            <div className="loading-content">
                
                <div className="speech">
                    Hey there ! Ready to dive into the world of Pokémon ?<br/>Press any key to start your journey !
                    <span className="speech-arrow">⏷</span>
                </div>


        </div>
    </div>
  );
}
