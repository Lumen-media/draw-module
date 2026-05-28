import { type LumenHost, LumenPlugin } from "@lumen/module-sdk";

export default class DrawModulePlugin extends LumenPlugin {
	async onload(host: LumenHost): Promise<void> {
		host.commands.add({
			id: "draw-module.hello",
			title: "draw-module: hello",
			run: () => host.ui.notify({ message: "Hello from draw-module!" }),
		});
	}
}
