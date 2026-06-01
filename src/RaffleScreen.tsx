import { useEffect, useState } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const rand = () => LETTERS[Math.floor(Math.random() * 26)];

interface TileProps {
  char: string;
  index: number;
}

function LetterTile({ char, index }: TileProps) {
  const [top, setTop] = useState(rand);
  const [mid, setMid] = useState(rand);
  const [bot, setBot] = useState(rand);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const SPIN_DURATION = 1400;
    let elapsed = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const cycle = () => {
      if (elapsed >= SPIN_DURATION) {
        setMid(char.toUpperCase());
        setTop(rand());
        setBot(rand());
        setDone(true);
        return;
      }
      setTop(rand());
      setMid(rand());
      setBot(rand());
      const progress = elapsed / SPIN_DURATION;
      const interval = Math.floor(50 + progress * 180);
      elapsed += interval;
      timerId = setTimeout(cycle, interval);
    };

    timerId = setTimeout(cycle, 90 * index);
    return () => clearTimeout(timerId);
  }, [char, index]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-bold leading-none text-foreground/20">{top}</span>
      <div className={`w-16 h-20 flex items-center justify-center rounded-xl bg-card border transition-colors ${done ? "border-primary/40" : "border-foreground/5"}`}>
        <span className={`text-5xl font-extrabold leading-none transition-colors ${done ? "text-foreground" : "text-foreground/60"}`}>
          {mid}
        </span>
      </div>
      <span className="text-xs font-bold leading-none text-foreground/20">{bot}</span>
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
                <div className="flex gap-2">
                  {tiles
                    .filter((t) => t.word === wi)
                    .map((t) => (
                      <LetterTile key={`${animationKey}-${t.idx}`} char={t.char} index={t.idx} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {name && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-7xl font-bold text-primary">{name}</p>
            <p className="text-sm text-muted-foreground">Congratulations!</p>
          </div>
        )}
      </div>
    );
  };
}
