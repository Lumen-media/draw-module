import { useState, useEffect } from "react";
import type { LumenHost } from "@lumen-media/module-sdk";
import { Badge, Button, Card, Label, ScrollArea, Separator, Switch, Textarea } from "@lumen-media/module-sdk/ui";

interface DrawnEntry {
  name: string;
  order: number;
}

function parseNames(text: string, removeDuplicates: boolean): string[] {
  const names = text
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  if (removeDuplicates) return [...new Set(names)];
  return names;
}

export function createDrawConfigurator(host: LumenHost) {
  return function DrawConfiguratorPanel(rawProps: unknown) {
    const { close } = (rawProps ?? {}) as { close?: () => void };

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
    };

    const handlePreview = () => {
      if (eligible.length === 0) {
        host.ui.notify({ message: "Pool is empty — no names to draw.", level: "info" });
        return;
      }
      host.ui.notify({
        title: `${eligible.length} eligible name${eligible.length !== 1 ? "s" : ""}`,
        message: eligible.join(", "),
      });
    };

    const sortedDrawn = [...alreadyDrawn].sort((a, b) => b.order - a.order);

    if (!loaded) return null;

    return (
      <div className="flex" style={{ width: 860, maxWidth: "95vw", maxHeight: "80vh" }}>

        {/* Left column */}
        <Card
          className="flex flex-col gap-5 overflow-y-auto rounded-r-none"
          style={{ flex: 1, padding: 24, minWidth: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold m-0">Draw Configurator</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={close}>✕ Close</Button>
              <Button onClick={handleDraw}>🔀 Draw</Button>
            </div>
          </div>

          {/* Toggles */}
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

          {/* Participants */}
          <div className="flex flex-col gap-2" style={{ flex: 1 }}>
            <Label className="text-muted-foreground">Participants (one per line)</Label>
            <Textarea
              value={participants}
              onChange={async (e: { target: { value: string } }) => {
                setParticipants(e.target.value);
                await host.data.json.set("participants", e.target.value);
              }}
              placeholder="One name per line..."
              style={{ minHeight: 200, resize: "vertical" }}
            />
            <p className="text-xs text-muted-foreground m-0">
              Paste or type names. Duplicates and repeats will be handled by the settings above.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Ready to draw from {eligible.length} name{eligible.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>↺ Reset</Button>
              <Button onClick={handlePreview}>👁 Preview</Button>
            </div>
          </div>
        </Card>

        <Separator orientation="vertical" />

        {/* Right column — Already Drawn */}
        <Card
          className="flex flex-col gap-3 bg-transparent rounded-l-none"
          style={{ width: 280, padding: 24 }}
        >
          <h3 className="text-base font-bold m-0">Already Drawn</h3>
          <ScrollArea style={{ flex: 1 }}>
            <div className="flex flex-col gap-2">
              {sortedDrawn.map((entry) => (
                <div
                  key={entry.order}
                  className="flex items-center justify-between bg-secondary border border-border rounded-lg"
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
