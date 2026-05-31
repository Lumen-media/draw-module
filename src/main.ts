import css from "./styles.css?inline";
import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk";
import { createDrawConfigurator } from "./DrawConfigurator.js";

export default class DrawModulePlugin extends LumenPlugin {
  private styleEl: HTMLStyleElement | null = null;

  async onload(host: LumenHost): Promise<void> {
    this.styleEl = document.createElement("style");
    this.styleEl.setAttribute("data-module", host.meta.id);
    this.styleEl.textContent = css;
    document.head.appendChild(this.styleEl);

    const DrawPanel = createDrawConfigurator(host);

    host.panels.add({
      id: "draw-module.configurator",
      slot: "dialog",
      component: DrawPanel,
    });

    host.menus.addItem("tools", {
      type: "action",
      id: "draw-module.open",
      label: "Draw",
      onClick: () => host.ui.openDialog("draw-module.configurator"),
    });
  }

  async onunload(): Promise<void> {
    this.styleEl?.remove();
    this.styleEl = null;
  }
}
