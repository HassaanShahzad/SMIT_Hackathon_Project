import type { Metadata } from "next";
import { Roboto, Open_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const openSans = Open_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "Workspace Manager — Enterprise SaaS Project & Task Management",
  description:
    "Next-generation production-grade workspace, project, and task manager with client-side localStorage synchronization, Kanban, List, and Calendar views.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${openSans.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F6F7FB] dark:bg-[#090D16] text-[#1A1D26] dark:text-[#EDEDED] font-sans">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
