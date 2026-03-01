import Electrobun, { Electroview } from "electrobun/view";
import Header from "./view/components/header/header";
import { useEffect, useState } from "react";
import { RPCSystemTypeView } from "./rpc/rpcSystemType";
import { OSName } from "../common/types/osNames";
import ThreeViewPort from "./view/components/three/viewport";

const rpc = Electroview.defineRPC<RPCSystemTypeView>({
	maxRequestTime: 5000,
	handlers: { requests: {}, messages: {} },
});

function App() {
	const [osName, setOSName] = useState<OSName>(OSName.NotSupported);

	const electrobun = new Electrobun.Electroview({ rpc });
	const getOSName = async () => {
		const message = await electrobun.rpc!.request.getOS({});
		setOSName(message);
	};

	getOSName();

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			{/* Header */}
			<div
				className="electrobun-webkit-app-region-drag"
				style={{
					position: "absolute",
					width: "100%",
					zIndex: 1000,
					userSelect: "none",
				}}
			>
				<Header osName={osName} />
			</div>
			<div>
				<ThreeViewPort />
			</div>
		</div>
	);
}

export default App;
