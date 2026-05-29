import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk";
import { createDrawConfigurator } from "./DrawConfigurator.js";

export default class DrawModulePlugin extends LumenPlugin {
	async onload(host: LumenHost): Promise<void> {
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
}
