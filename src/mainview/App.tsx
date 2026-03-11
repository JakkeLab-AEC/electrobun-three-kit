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

const electrobun = new Electrobun.Electroview({ rpc });

function App() {
	const [osName, setOSName] = useState<OSName>(OSName.NotSupported);

	useEffect(() => {
		const getOSName = async () => {
			const message = await electrobun.rpc!.request.getOS({});
			setOSName(message);
		};

		getOSName();
	}, []);

	return (
		<div
			style={{
				position: "relative",
				width: "100vw",
				height: "100vh",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					zIndex: 0,
				}}
			>
				<ThreeViewPort viewName="main" />
			</div>

			<div
				className="electrobun-webkit-app-region-drag"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 1000,
					pointerEvents: "auto",
				}}
			>
				<Header osName={osName} />
			</div>
		</div>
	);
}

export default App;
