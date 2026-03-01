import { APP_CONFIG } from "../../../../common/appConfig";
import "./headerStyle.css";

interface HeaderProps {
	appNameString?: string;
}

const { appName, headerColor, headerHeight } = APP_CONFIG;

export default function CompHeader({ appNameString = appName }: HeaderProps) {
	return (
		<div
			className="comp-header-drag"
			style={{
				width: "100%",
				background: headerColor,
				height: headerHeight,
				display: "flex",
				placeItems: "center",
			}}
		>
			<div style={{ userSelect: "none" }}>{appName}</div>
		</div>
	);
}
