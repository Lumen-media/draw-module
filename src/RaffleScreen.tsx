import { useEffect, useRef, useState } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const rand = () => ALPHABET[Math.floor(Math.random() * 26)];

const FACES = 4;
const FACE_DEG = 360 / FACES;
const RADIUS = 40;
const PERSPECTIVE = 240;

interface TileProps {
  char: string;
  index: number;
  onDone: () => void;
  duration: number;
}

function LetterTile({ char, index, onDone, duration }: TileProps) {
  const [faceLetters, setFaceLetters] = useState<string[]>(() =>
    Array.from({ length: FACES }, rand)
  );
  const [isDone, setIsDone] = useState(false);
  const drumRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setIsDone(false);
    setFaceLetters(Array.from({ length: FACES }, rand));

    const drum = drumRef.current;
    if (!drum) return;

    const stagger = index * 90;
    const fullSpins = 4 + Math.floor(Math.random() * 3);
    const totalDeg = fullSpins * 360;

    // Rotation via Web Animations API — no React state involved
    const anim = drum.animate(
      [{ transform: "rotateX(0deg)" }, { transform: `rotateX(${totalDeg}deg)` }],
      {
        duration,
        delay: stagger,
        easing: "cubic-bezier(0.2, 0, 0.1, 1)",
        fill: "forwards",
      }
    );

    // Letter updates via RAF — synced with the same easing curve
    const startTime = performance.now() + stagger;
    let lastFace = -1;

    const updateLetters = (now: number) => {
      if (doneRef.current) return;
      const elapsed = now - startTime;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(updateLetters); return; }
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const deg = eased * totalDeg;
      const faceNow = Math.floor(deg / FACE_DEG) % FACES;
      if (faceNow !== lastFace) {
        lastFace = faceNow;
        setFaceLetters(prev => {
          const next = [...prev];
          next[(faceNow + Math.floor(FACES / 2)) % FACES] = rand();
          return next;
        });
      }
      if (t < 1) rafRef.current = requestAnimationFrame(updateLetters);
    };

    rafRef.current = requestAnimationFrame(updateLetters);

    anim.addEventListener("finish", () => {
      if (doneRef.current) return;
      doneRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setFaceLetters(prev => {
        const next = [...prev];
        next[0] = char.toUpperCase();
        return next;
      });
      setIsDone(true);
      onDone();
    });

    return () => {
      doneRef.current = true;
      cancelAnimationFrame(rafRef.current);
      anim.cancel();
    };
  }, [char, index, duration]);

  return (
    <div style={{ perspective: PERSPECTIVE, width: 64, height: 80 }}>
      <div
        ref={drumRef}
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: isDone ? "rotateX(0deg)" : undefined,
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
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: "white" }}>
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
  background?: "solid" | "transparent" | "card";
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  animType?: "roulette" | "none";
  animDuration?: number;
}

export function createRaffleScreen() {
  return function RaffleScreenPanel(rawProps: unknown) {
    const {
      name,
      animationKey = 0,
      background = "solid",
      backgroundColor = "var(--color-background)",
      fontSize = 72,
      fontFamily = "",
      animType = "roulette",
      animDuration = 1600,
    } = (rawProps ?? {}) as RaffleScreenProps;

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

    const containerStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 40,
      fontFamily: fontFamily || undefined,
      backgroundColor: background === "transparent" ? "transparent" : backgroundColor,
    };

    const tilesRow = words.length > 0 && (
      <div style={{ display: "flex", alignItems: "center" }}>
        {words.map((_, wi) => (
          <div key={wi} style={{ display: "flex", alignItems: "center" }}>
            {wi > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 16 }}>
              {tiles
                .filter((t) => t.word === wi)
                .map((t) => (
                  animType === "none" ? (
                    <div
                      key={`${animationKey}-${t.idx}`}
                      style={{
                        width: 64, height: 80, display: "flex", alignItems: "center",
                        justifyContent: "center", borderRadius: 12,
                        background: "oklch(17% 0.035 265)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      onLoad={() => handleTileDone()}
                    >
                      <span style={{ fontSize: 40, fontWeight: 800, color: "white" }}>
                        {t.char.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <LetterTile
                      key={`${animationKey}-${t.idx}`}
                      char={t.char}
                      index={t.idx}
                      onDone={handleTileDone}
                      duration={animDuration}
                    />
                  )
                ))}
            </div>
          </div>
        ))}
      </div>
    );

    if (background === "card" && words.length > 0) {
      return (
        <div style={{ ...containerStyle, backgroundColor: "transparent" }}>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Current Raffle</p>
          <div style={{
            backgroundColor, borderRadius: 24, padding: "32px 48px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
          }}>
            {tilesRow}
            {allDone && name && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize, fontWeight: 700, color: "var(--color-primary)", margin: 0, fontFamily: fontFamily || undefined }}>{name}</p>
                <p className="text-sm text-muted-foreground">🎉 Congratulations!</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Current Raffle</p>
        {tilesRow}
        {allDone && name && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize, fontWeight: 700, color: "var(--color-primary)", margin: 0, fontFamily: fontFamily || undefined }}>{name}</p>
            <p className="text-sm text-muted-foreground">🎉 Congratulations!</p>
          </div>
        )}
      </div>
    );
  };
}
