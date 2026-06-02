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

    const anim = drum.animate(
      [{ transform: "rotateX(0deg)" }, { transform: `rotateX(${totalDeg}deg)` }],
      { duration, delay: stagger, easing: "cubic-bezier(0.2, 0, 0.1, 1)", fill: "forwards" }
    );

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
    <div className="w-16 h-20" style={{ perspective: PERSPECTIVE }}>
      <div
        ref={drumRef}
        className="w-full h-full relative transform-3d"
        style={{ transform: isDone ? "rotateX(0deg)" : undefined }}
      >
        {faceLetters.map((letter, fi) => (
          <div
            key={fi}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-[oklch(17%_0.035_265)] border border-white/[0.07]"
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateX(${-fi * FACE_DEG}deg) translateZ(${RADIUS}px)`,
            }}
          >
            <span className="text-[2.5rem] font-extrabold leading-none text-white">
              {letter}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RaffleScreenBackground {
  type: "theme" | "image" | "video";
  src: string;
  name: string;
}

interface RaffleScreenProps {
  name?: string | null;
  animationKey?: number;
  background?: "default" | "transparent" | "card" | "media";
  backgroundMedia?: RaffleScreenBackground;
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
      background = "default",
      backgroundMedia,
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

    const isCard = background === "card";

    const tilesContent = words.length > 0 && (
      <div className="flex items-center">
        {words.map((_, wi) => (
          <div key={wi} className="flex items-center">
            {wi > 0 && (
              <div className="flex items-center justify-center w-10">
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
            )}
            <div style={{ display: "flex", gap: 16 }}>
              {tiles
                .filter((t) => t.word === wi)
                .map((t) => (
                  animType === "none" ? (
                    <div
                      key={`${animationKey}-${t.idx}`}
                      className="w-16 h-20 flex items-center justify-center rounded-xl bg-[oklch(17%_0.035_265)] border border-white/[0.07]"
                      onLoad={() => handleTileDone()}
                    >
                      <span className="text-[2.5rem] font-extrabold leading-none text-white">
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

    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center gap-8"
        style={{
          fontFamily: fontFamily || undefined,
          backgroundColor: undefined,
        }}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mix-blend-plus-lighter">
          Current Raffle
        </p>

        {isCard ? (
          <div
            className="flex flex-col items-center rounded-[20px] bg-background"
            style={{ padding: "28px 40px", boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            {tilesContent}
          </div>
        ) : tilesContent}

        <p
          className="text-sm text-muted-foreground transition-opacity duration-400"
          style={{ opacity: allDone && name ? 1 : 0 }}
        >
          🎉 Congratulations!
        </p>
      </div>
    );
  };
}
