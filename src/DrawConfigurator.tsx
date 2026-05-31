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

interface DrawnEntry {
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

export function createDrawConfigurator(host: LumenHost) {
  return function DrawConfiguratorPanel(rawProps: unknown) {
    const { close } = (rawProps ?? {}) as { close?: () => void };

    const editorRef = useRef<TextEditorRef | null>(null);
    const [participants, setParticipants] = useState("");
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [doNotRepeat, setDoNotRepeat] = useState(true);
    const [alreadyDrawn, setAlreadyDrawn] = useState<DrawnEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
      Promise.all([
        host.data.json.get<string>("participants", ""),
        host.data.json.get<boolean>("removeDuplicates", true),
        host.data.json.get<boolean>("doNotRepeat", true),
        host.data.json.get<DrawnEntry[]>("alreadyDrawn", []),
      ]).then(([p, rd, dnr, ad]) => {
        setParticipants(p);
        setRemoveDuplicates(rd);
        setDoNotRepeat(dnr);
        setAlreadyDrawn(ad);
        setLoaded(true);
      });
    }, []);

    const eligible = (() => {
      const names = parseNames(participants, removeDuplicates);
      if (!doNotRepeat) return names;
      const drawn = new Set(alreadyDrawn.map((d) => d.name));
      return names.filter((n) => !drawn.has(n));
    })();

    const handleDraw = async () => {
      if (eligible.length === 0) {
        host.ui.notify({ message: "No eligible names to draw!", level: "warn" });
        return;
      }
      const name = eligible[Math.floor(Math.random() * eligible.length)];
      const newEntry: DrawnEntry = { name, order: alreadyDrawn.length + 1 };
      const newDrawn = [...alreadyDrawn, newEntry];
      setAlreadyDrawn(newDrawn);
      await host.data.json.set("alreadyDrawn", newDrawn);
    };

    const handleReset = async () => {
      setAlreadyDrawn([]);
      await host.data.json.set("alreadyDrawn", []);
      editorRef.current?.setMarkdown("");
      setParticipants("");
      await host.data.json.set("participants", "");
    };

const sortedDrawn = [...alreadyDrawn].sort((a, b) => b.order - a.order);

    if (!loaded) return null;

    return (
      <div className="flex relative" style={{ width: 860, maxWidth: "95vw", maxHeight: "80vh" }}>

        {close && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={close}
            style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}
          >
            <IconX size={16} />
          </Button>
        )}

        <Card
          className="flex flex-col gap-5 p-4 overflow-y-auto border-none rounded-r-none"
          style={{ flex: 1, padding: 24, minWidth: 0 }}
        >
          <div style={{ paddingRight: 32 }}>
            <h2 className="text-lg leading-none font-bold m-0">Draw Configurator</h2>
          </div>

          <div className="flex flex-col gap-3 bg-secondary rounded-lg" style={{ padding: "14px 18px" }}>
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

          <div className="flex flex-col gap-2" style={{ flex: 1 }}>
            <Label className="text-muted-foreground">Participants (one per line)</Label>
            <TextEditor
              ref={editorRef}
              defaultValue={participants}
              placeholder="One name per line..."
              debounce={300}
              onChange={async (md: string) => {
                setParticipants(md);
                await host.data.json.set("participants", md);
              }}
              style={{ minHeight: 200 }}
              className="bg-secondary border-none rounded-lg"
            />
            <p className="text-xs text-muted-foreground m-0">
              Paste or type names. Duplicates and repeats will be handled by the settings above.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Ready to draw from {eligible.length} name{eligible.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button size="default" variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <IconRotateCcw size={16} /> Reset
              </Button>
              <Button size="default" onClick={handleDraw} className="flex items-center gap-2">
                <IconShuffle size={16} /> Draw
              </Button>
            </div>
          </div>
        </Card>

        <Separator orientation="vertical" />

        <Card
          className="flex flex-col gap-3 p-4 border-none rounded-l-none bg-secondary"
          style={{ width: 280, padding: 24 }}
        >
          <h3 className="text-base leading-none font-bold m-0">Already Drawn</h3>
          <ScrollArea style={{ flex: 1 }}>
            <div className="flex flex-col gap-2">
              {sortedDrawn.map((entry) => (
                <div
                  key={entry.order}
                  className="flex items-center justify-between bg-card rounded-lg"
                  style={{ padding: "10px 14px" }}
                >
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
