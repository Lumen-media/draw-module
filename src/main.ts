import css from "./styles.css?inline";
import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk";
import { setupI18n, translations } from "./i18n.js";
import { createRaffleConfigurator } from "./RaffleConfigurator.js";
import { createRaffleScreen } from "./RaffleScreen.js";

export default class RaffleModulePlugin extends LumenPlugin {
  private styleEl: HTMLStyleElement | null = null;

  async onload(host: LumenHost): Promise<void> {
    this.styleEl = document.createElement("style");
    this.styleEl.setAttribute("data-module", host.meta.id);
    this.styleEl.textContent = css;
    document.head.appendChild(this.styleEl);

    setupI18n(host.app.locale, translations);

    host.panels.add({
      id: "raffle-module.raffle-screen",
      slot: "presenter.content",
      component: createRaffleScreen(),
    });

    if (host.window === "main") {
      host.panels.add({
        id: "raffle-module.raffle-configurator",
        slot: "dialog",
        component: createRaffleConfigurator(host),
      });

      host.commands.add({
        id: "raffle-module.open",
        title: "Raffle",
        run: () => host.ui.openDialog("raffle-module.raffle-configurator"),
      });

      host.menus.addItem("tools", {
        type: "action",
        id: "raffle-module.open",
        label: "Raffle",
        onClick: () => host.ui.openDialog("raffle-module.raffle-configurator"),
      });
    }
  }

  async onunload(): Promise<void> {
    this.styleEl?.remove();
    this.styleEl = null;
  }
}
