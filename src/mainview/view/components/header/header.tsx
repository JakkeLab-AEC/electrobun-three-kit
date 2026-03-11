import { APP_CONFIG } from "../../../../common/appConfig";
import { OSName } from "../../../../common/types/osNames";
import "./headerStyle.css";

interface HeaderProps {
	osName?: OSName;
	appNameString?: string;
}

const { appName, headerColor, headerHeight } = APP_CONFIG;

const DEFAULT_APP_NAME = "my-app";

export default function CompHeader({
	osName = OSName.NotSupported,
	appNameString = DEFAULT_APP_NAME,
}: HeaderProps) {
	return (
		<div
			className="titlebar electrobun-webkit-app-region-drag comp-header-no-drag"
			style={{
				width: "100%",
				background: headerColor,
				height: headerHeight,
				display: "flex",
				placeItems: "center",
				paddingLeft: osName === OSName.Mac ? 80 : 0,
				color: "#c7c7c7",
				borderBottomWidth: 1,
				borderBottomColor: "#000000",
			}}
			onDoubleClick={(e) => console.log(e)}
		>
			<div
				style={{
					fontSize: 20,
					fontWeight: 600,
					userSelect: "none",
				}}
			>
				{appName}
			</div>
		</div>
	);
}
