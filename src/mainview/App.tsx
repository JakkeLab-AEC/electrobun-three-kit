import { useRef, useState } from "react";
import CompHeader from "./view/components/header/header";
import Electrobun from "electrobun";

function App() {
	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			{/* Header */}
			<div
				className="electrobun-webkit-app-region-drag"
				style={{ position: "absolute", width: "100%", zIndex: 1000 }}
			>
				<CompHeader />
			</div>
		</div>
	);
}

export default App;
