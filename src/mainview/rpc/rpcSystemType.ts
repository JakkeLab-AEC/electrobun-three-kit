import { OSName } from "../../common/types/osNames";

export type RPCSystemTypeView = {
	bun: {
		requests: {
			getOS: { params: {}; response: OSName };
		};
		messages: {};
	};
	webview: {
		requests: {};
		messages: {};
	};
};
