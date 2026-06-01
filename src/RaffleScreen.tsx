import { useEffect, useRef, useState } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const rand = () => ALPHABET[Math.floor(Math.random() * 26)];

const FACES = 4;
const FACE_DEG = 360 / FACES;
const RADIUS = 40;
const PERSPECTIVE = 260;

interface TileProps {
  char: string;
  index: number;
  onDone: () => void;
}

function LetterTile({ char, index, onDone }: TileProps) {
  const [rot, setRot] = useState(0);
  const [faceLetters, setFaceLetters] = useState<string[]>(() =>
    Array.from({ length: FACES }, rand)
  );
  const rafRef = useRef(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {

    setRot(0);
    setFaceLetters(Array.from({ length: FACES }, rand));
    startRef.current = null;

    const fullSpins = 4 + Math.floor(Math.random() * 3);
    const totalDeg = fullSpins * 360;
    const duration = 1600;
    const stagger = index * 90;

    let lastFacePassed = -1;

    const frame = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const deg = eased * totalDeg;

      setRot(deg);

      const faceNow = Math.floor(deg / FACE_DEG) % FACES;
      if (faceNow !== lastFacePassed && t < 0.88) {
        lastFacePassed = faceNow;
        setFaceLetters(prev => {
          const next = [...prev];
          next[(faceNow + Math.floor(FACES / 2)) % FACES] = rand();
          return next;
        });
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setFaceLetters(prev => {
          const next = [...prev];
          next[0] = char.toUpperCase();
          return next;
        });
        setRot(totalDeg);
        onDone();
      }
    };

    const tid = setTimeout(() => {
      rafRef.current = requestAnimationFrame(frame);
    }, stagger);

    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(rafRef.current);
    };
  }, [char, index]);

  return (
    <div style={{ perspective: PERSPECTIVE, width: 64, height: 80 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rot}deg)`,
          position: "relative",
        }}
      >
        {faceLetters.map((letter, fi) => (
          <div
            key={fi}
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: `rotateX(${-fi * FACE_DEG}deg) translateZ(${RADIUS}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: "oklch(17% 0.035 265)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span
              style={{
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1,
                color: "white",
              }}
            >
              {letter}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RaffleScreenProps {
  name?: string | null;
  animationKey?: number;
}

export function createRaffleScreen() {
  return function RaffleScreenPanel(rawProps: unknown) {
    const { name, animationKey = 0 } = (rawProps ?? {}) as RaffleScreenProps;
    const words = name ? name.trim().split(/\s+/) : [];

    const tiles: { word: number; char: string; idx: number }[] = [];
    let g = 0;
    words.forEach((word, wi) => {
      word.split("").forEach((char) => tiles.push({ word: wi, char, idx: g++ }));
    });

    const [doneTiles, setDoneTiles] = useState(0);
    const allDone = tiles.length > 0 && doneTiles >= tiles.length;

    useEffect(() => {
      setDoneTiles(0);
    }, [animationKey]);

    const handleTileDone = () => setDoneTiles((n) => n + 1);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-10 bg-background">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
          Current Raffle
        </p>

        {words.length > 0 && (
          <div className="flex items-center">
            {words.map((_, wi) => (
              <div key={wi} className="flex items-center">
                {wi > 0 && (
                  <div className="flex items-center justify-center w-10">
                    <div className="w-2 h-2 rounded-full bg-foreground/20" />
                  </div>
                )}
                <div className="flex gap-5">
                  {tiles
                    .filter((t) => t.word === wi)
                    .map((t) => (
                      <LetterTile
                        key={`${animationKey}-${t.idx}`}
                        char={t.char}
                        index={t.idx}
                        onDone={handleTileDone}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {allDone && name && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-7xl font-bold text-primary">{name}</p>
            <p className="text-sm text-muted-foreground">🎉 Congratulations!</p>
          </div>
        )}
      </div>
    );
  };
}
