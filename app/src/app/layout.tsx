import type { Metadata } from "next";
import "./globals.css";
import { ConvexProvider } from "./convex-provider";

export const metadata: Metadata = {
	title: "Timekeeper",
	description: "Team time tracking by account",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<ConvexProvider>{children}</ConvexProvider>
			</body>
		</html>
	);
}
