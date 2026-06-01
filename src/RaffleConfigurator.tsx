import { useState, useEffect, useRef } from "react";
import type { LumenHost } from "@lumen-media/module-sdk";
import { Badge, Button, Card, Label, ScrollArea, Separator, Switch, TextEditor } from "@lumen-media/module-sdk/ui";
import type { TextEditorRef } from "@lumen-media/module-sdk/ui";

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

function IconShuffle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 14 3 3-3 3"/><path d="m18 4 3 3-3 3"/>
      <path d="M3 7h3a5 5 0 0 1 5 5 5 5 0 0 0 5 5h4"/>
      <path d="M3 17h3a5 5 0 0 0 5-5 5 5 0 0 1 5-5h4"/>
    </svg>
  );
}

function IconRotateCcw({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  );
}

function IconPlay({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="6 3 20 12 6 21 6 3"/>
    </svg>
  );
}

interface RaffledEntry {
  name: string;
  order: number;
}

function stripMarkdownLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function parseNames(text: string, removeDuplicates: boolean): string[] {
  const names = text
    .split("\n")
    .map(stripMarkdownLine)
    .filter((n) => n.length > 0);
  if (removeDuplicates) return [...new Set(names)];
  return names;
}

function addRaffledMarker(text: string, drawnName: string): string {
  let marked = false;
  return text.split("\n").map((line) => {
    if (marked) return line;
    const stripped = stripMarkdownLine(line);
    if (!stripped.startsWith("*") && stripped === drawnName) {
      marked = true;
      return "*" + stripped;
    }
    return line;
  }).join("\n");
}

function removeRaffledMarkers(text: string): string {
  return text.split("\n").map((line) => {
    const stripped = stripMarkdownLine(line);
    return stripped.startsWith("*") ? stripped.slice(1) : line;
  }).join("\n");
}

export function createRaffleConfigurator(host: LumenHost) {
  return function RaffleConfiguratorPanel(rawProps: unknown) {
    const { close } = (rawProps ?? {}) as { close?: () => void };

    const editorRef = useRef<TextEditorRef | null>(null);
    const [participants, setParticipants] = useState("");
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [doNotRepeat, setDoNotRepeat] = useState(true);
    const [alreadyRaffled, setAlreadyRaffled] = useState<RaffledEntry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [started, setStarted] = useState(false);

    useEffect(() => {
      Promise.all([
        host.data.json.get<string>("participants", ""),
        host.data.json.get<boolean>("removeDuplicates", true),
        host.data.json.get<boolean>("doNotRepeat", true),
        host.data.json.get<RaffledEntry[]>("alreadyRaffled", []),
      ]).then(([p, rd, dnr, ad]) => {
        setParticipants(p);
        setRemoveDuplicates(rd);
        setDoNotRepeat(dnr);
        setAlreadyRaffled(ad);
        setLoaded(true);
      });
    }, []);

    const eligible = (() => {
      const all = parseNames(participants, removeDuplicates);
      if (doNotRepeat) {
        return all.filter((n) => !n.startsWith("*"));
      }
      const clean = all.map((n) => (n.startsWith("*") ? n.slice(1) : n));
      return removeDuplicates ? [...new Set(clean)] : clean;
    })();

    useEffect(() => {
      const d = host.presentation.onStateChange((state) => {
        if (state === "idle") setStarted(false);
      });
      return () => d.dispose();
    }, []);

    const handleStart = () => {
      host.presentation.project("raffle-module.raffle-screen", { name: null, animationKey: 0 });
      setStarted(true);
    };

    const handleExit = () => {
      host.presentation.clear();
      setStarted(false);
    };

    const handleRaffle = async () => {
      if (eligible.length === 0) {
        host.ui.notify({ message: "No eligible names to raffle!", level: "warn" });
        return;
      }
      const name = eligible[Math.floor(Math.random() * eligible.length)];

      if (doNotRepeat) {
        const updated = addRaffledMarker(participants, name);
        setParticipants(updated);
        await host.data.json.set("participants", updated);
        editorRef.current?.setMarkdown(updated);
      }

      const newEntry: RaffledEntry = { name, order: alreadyRaffled.length + 1 };
      const newRaffled = [...alreadyRaffled, newEntry];
      setAlreadyRaffled(newRaffled);
      await host.data.json.set("alreadyRaffled", newRaffled);
      host.presentation.project("raffle-module.raffle-screen", { name, animationKey: Date.now() });
    };

    const handleReset = async () => {
      setAlreadyRaffled([]);
      await host.data.json.set("alreadyRaffled", []);
      const cleaned = removeRaffledMarkers(participants);
      setParticipants(cleaned);
      await host.data.json.set("participants", cleaned);
      editorRef.current?.setMarkdown(cleaned);
      if (started) {
        host.presentation.clear();
        setStarted(false);
      }
    };

    const sortedRaffled = [...alreadyRaffled].sort((a, b) => b.order - a.order);

    if (!loaded) return null;

    return (
      <div className="relative flex w-[56.25rem] max-w-[95vw] max-h-[80vh]">

        {close && (
          <Button variant="ghost" size="icon-sm" onClick={close} className="absolute top-3 right-3 z-10">
            <IconX size={16} />
          </Button>
        )}

        <Card className="flex flex-1 flex-col gap-5 min-w-0 p-6 border-none rounded-r-none">
          <div className="pr-8">
            <h2 className="text-lg leading-none font-bold m-0">Raffle Configurator</h2>
          </div>

          <div className="flex flex-col gap-3 bg-secondary rounded-lg py-3.5 px-4.5">
            <Label className="flex items-center justify-between" htmlFor="remove-duplicates">Remove duplicate names
              <Switch
                id="remove-duplicates"
                checked={removeDuplicates}
                onCheckedChange={async (v: boolean) => {
                  setRemoveDuplicates(v);
                  await host.data.json.set("removeDuplicates", v);
                }}
              />
            </Label>
            <Label className="flex items-center justify-between" htmlFor="do-not-repeat">Do not repeat names
              <Switch
                id="do-not-repeat"
                checked={doNotRepeat}
                onCheckedChange={async (v: boolean) => {
                  setDoNotRepeat(v);
                  await host.data.json.set("doNotRepeat", v);
                }}
              />
            </Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Participants (one per line)</Label>
            <ScrollArea className="h-60 overflow-hidden bg-secondary rounded-xl">
              <TextEditor
                ref={editorRef}
                defaultValue={participants}
                placeholder="One name per line..."
                debounce={300}
                onChange={async (md: string) => {
                  setParticipants(md);
                  await host.data.json.set("participants", md);
                }}
              />
            </ScrollArea>
            <p className="text-xs text-muted-foreground m-0">
              Paste or type names. Duplicates and repeats will be handled by the settings above.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Ready to raffle from {eligible.length} name{eligible.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              {started ? (
                <Button variant="outline" onClick={handleExit} className="flex items-center gap-2">
                  <IconX size={16} /> Exit
                </Button>
              ) : (
                <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                  <IconRotateCcw size={16} /> Reset
                </Button>
              )}
              {started ? (
                <Button onClick={handleRaffle} className="flex items-center gap-2">
                  <IconShuffle size={16} /> Raffle
                </Button>
              ) : (
                <Button onClick={handleStart} className="flex items-center gap-2">
                  <IconPlay size={16} /> Start
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Separator orientation="vertical" />

        <Card className="flex flex-col gap-3 w-70 p-6 border-none rounded-l-none bg-secondary">
          <h3 className="text-base leading-none font-bold m-0">Already Raffled</h3>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2">
              {sortedRaffled.map((entry) => (
                <div key={entry.order} className="flex items-center justify-between bg-card rounded-lg py-2.5 px-3.5">
                  <span className="text-sm">{entry.name}</span>
                  <Badge variant="secondary">#{entry.order}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

      </div>
    );
  };
}
