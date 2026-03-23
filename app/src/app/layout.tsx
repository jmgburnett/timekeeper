import type { Metadata } from "next";
import "./globals.css";
import { ConvexProvider } from "./convex-provider";
import { Sidebar } from "./components/sidebar";

export const metadata: Metadata = {
	title: "Timekeeper",
	description: "Lightweight team timekeeping",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="bg-gray-50 text-gray-900 antialiased">
				<ConvexProvider>
					<div className="flex min-h-screen">
						<Sidebar />
						<main className="flex-1 p-6 lg:p-8">{children}</main>
					</div>
				</ConvexProvider>
			</body>
		</html>
	);
}
