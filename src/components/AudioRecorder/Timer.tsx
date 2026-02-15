import { Timer as TimerIcon } from "lucide-react";

// components
import { Badge } from "@/components/ui/badge";

const pad = (n: number) => n.toString().padStart(2, "0");

interface TimerProps {
	totalTime: number;
}
export const Timer = ({ totalTime }: TimerProps) => {
	const totalSeconds = Math.floor(totalTime);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const formattedTime =
		hours > 0
			? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
			: `${pad(minutes)}:${pad(seconds)}`;

	return (
		<Badge variant="secondary">
			<TimerIcon />
			{formattedTime}
		</Badge>
	);
};
