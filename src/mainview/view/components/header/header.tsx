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
			className="titlebar"
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
