import Electrobun, { Electroview } from "electrobun/view";
import { OSName } from "../../common/types/osNames";
import { RPCSystemTypeView } from "../rpc/rpcSystemType";

type GlobalState = {
	osName: OSName;
};

const rpc = Electroview.defineRPC<RPCSystemTypeView>({
	maxRequestTime: 5000,
	handlers: { requests: {}, messages: {} },
});

const electrobun = new Electrobun.Electroview({ rpc });

export const globalState: GlobalState = {
	osName: await electrobun.rpc!.request.getOS({}),
};
