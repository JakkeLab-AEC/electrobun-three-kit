import { BrowserView, RPCSchema } from "electrobun";
import os from "os";
import { OSName } from "../../common/types/osNames";

export type RPCSystemType = {
	bun: RPCSchema<{
		requests: {
			getOS: {
				params: {};
				response: OSName;
			};
		};
		messages: {
			logToBun: {
				msg: string;
			};
		};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};

function translatePlatforms(platform: NodeJS.Platform): OSName {
	switch (platform) {
		case "darwin":
			return OSName.Mac;

		case "win32":
			return OSName.Win;
		default:
			return OSName.NotSupported;
	}
}

export const rpcSystem = BrowserView.defineRPC<RPCSystemType>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			getOS: () => {
				return translatePlatforms(os.platform());
			},
		},
	},
});
