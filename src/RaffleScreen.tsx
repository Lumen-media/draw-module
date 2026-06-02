import { useEffect, useRef, useState } from "react";
import { Wheel } from "react-custom-roulette";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const rand = () => ALPHABET[Math.floor(Math.random() * 26)];

const FACES = 4;
const FACE_DEG = 360 / FACES;

interface TileProps {
  char: string;
  index: number;
  onDone: () => void;
  duration: number;
  fontSize: number;
}

function LetterTile({ char, index, onDone, duration, fontSize }: TileProps) {
  const tileW = Math.round(fontSize * 1.4);
  const tileH = Math.round(fontSize * 1.8);
  const radius = Math.round(tileH / 2);
  const perspective = tileH * 3;
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
    <div style={{ width: tileW, height: tileH, perspective }}>
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
              transform: `rotateX(${-fi * FACE_DEG}deg) translateZ(${radius}px)`,
            }}
          >
            <span style={{ fontSize, fontWeight: 800, lineHeight: 1, color: "white" }}>
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
  animType?: "slots" | "wheel" | "none";
  animDuration?: number;
  participants?: string[];
  prizeIndex?: number;
}

export function createRaffleScreen() {
  return function RaffleScreenPanel(rawProps: unknown) {
    const {
      name,
      animationKey = 0,
      background = "default",
      backgroundMedia,
      fontSize = 48,
      fontFamily = "",
      animType = "slots",
      animDuration = 1600,
      participants = [],
      prizeIndex = -1,
    } = (rawProps ?? {}) as RaffleScreenProps;

    const words = name ? name.trim().split(/\s+/) : [];

    const tiles: { word: number; char: string; idx: number }[] = [];
    let g = 0;
    words.forEach((word, wi) => {
      word.split("").forEach((char) => tiles.push({ word: wi, char, idx: g++ }));
    });

    const [doneTiles, setDoneTiles] = useState(0);
    const allDone = tiles.length > 0 && doneTiles >= tiles.length;

    const [mustSpin, setMustSpin] = useState(false);
    const [wheelDone, setWheelDone] = useState(false);

    useEffect(() => {
      setDoneTiles(0);
      setWheelDone(false);
      if (animType === "wheel" && prizeIndex >= 0 && animationKey > 0) {
        setMustSpin(true);
      }
    }, [animationKey]);

    const handleTileDone = () => setDoneTiles((n) => n + 1);

    const wheelData = participants.length >= 2
      ? participants.map((p) => ({ option: p }))
      : [{ option: "?" }, { option: "?" }];

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
            <div style={{ display: "flex", gap: Math.round(fontSize * 0.35) }}>
              {tiles
                .filter((t) => t.word === wi)
                .map((t) => (
                  animType === "none" ? (() => {
                    const tileW = Math.round(fontSize * 1.4);
                    const tileH = Math.round(fontSize * 1.8);
                    return (
                      <div
                        key={`${animationKey}-${t.idx}`}
                        style={{ width: tileW, height: tileH }}
                        className="flex items-center justify-center rounded-xl bg-[oklch(17%_0.035_265)] border border-white/[0.07]"
                        onLoad={() => handleTileDone()}
                      >
                        <span style={{ fontSize, fontWeight: 800, lineHeight: 1, color: "white" }}>
                          {t.char.toUpperCase()}
                        </span>
                      </div>
                    );
                  })() : (
                    <LetterTile
                      key={`${animationKey}-${t.idx}`}
                      char={t.char}
                      index={t.idx}
                      onDone={handleTileDone}
                      duration={animDuration}
                      fontSize={fontSize}
                    />
                  )
                ))}
            </div>
          </div>
        ))}
      </div>
    );

    if (animType === "wheel") {
      return (
        <div
          className="w-full h-full relative flex flex-col items-center justify-center gap-6"
          style={{ fontFamily: fontFamily || undefined }}
        >
          <p className="text-3xl tracking-[0.3em] uppercase text-muted-foreground mix-blend-plus-lighter">
            Current Raffle
          </p>
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeIndex >= 0 ? prizeIndex : 0}
            data={wheelData}
            onStopSpinning={() => { setMustSpin(false); setWheelDone(true); }}
            backgroundColors={["#1e1b4b", "#312e81", "#4338ca", "#6d28d9", "#7c3aed"]}
            textColors={["#ffffff"]}
            outerBorderColor="rgba(255,255,255,0.1)"
            outerBorderWidth={2}
            innerRadius={0}
            radiusLineColor="rgba(255,255,255,0.08)"
            radiusLineWidth={1}
            fontSize={Math.max(10, Math.min(26, Math.floor(220 / wheelData.length)))}
            spinDuration={0.8}
          />
          <p
            className="text-xl text-muted-foreground transition-opacity duration-400 mix-blend-plus-lighter"
            style={{ opacity: wheelDone && name ? 1 : 0 }}
          >
            🎉 {name} — Congratulations!
          </p>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center gap-8"
        style={{
          fontFamily: fontFamily || undefined,
          backgroundColor: undefined,
        }}
      >
        <p className="text-3xl tracking-[0.3em] uppercase text-muted-foreground mix-blend-plus-lighter">
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
          className="text-xl text-muted-foreground transition-opacity duration-400"
          style={{ opacity: allDone && name ? 1 : 0 }}
        >
          🎉 Congratulations!
        </p>
      </div>
    );
  };
}
