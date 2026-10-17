import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth";
import { LenisProvider } from "@/components/layout/lenis-provider";
import { Toaster } from "sonner";
import { CommandMenu } from "@/components/shared/command-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "Aardvark Book Club | Fresh New Fiction & Book Sharing",
    template: "%s | Aardvark Book Club",
  },
  description:
    "Discover fresh new fiction, exclusive hardcover editions, and share or borrow books near you with Aardvark Book Club.",
  icons: {
    icon: "https://cdn.prod.website-files.com/696173cb00865d1b386e4af8/698349d0398156396ca8e629_favicon-32x32.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff008c",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getSessionUser();
  return (
    <html lang="en" suppressHydrationWarning className="w-mod-js w-mod-ix">
      <head>
        <link rel="stylesheet" href="/aardvark/webflow.css" />
        <link rel="stylesheet" href="/aardvark/slater.css" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --faq-color-merch-green: #8dec7e;
                --faq-color-merch-green-soft: #CAF7C8;
              }
              [data-faq-color="merch-green"] {
                --faq-bg: var(--faq-color-merch-green);
                --faq-bg-soft: var(--faq-color-merch-green-soft);
              }
            `,
          }}
        />
      </head>
      <body data-barba="wrapper">
        <Toaster position="bottom-right" richColors theme="light" />
        <CommandMenu />
        <TooltipProvider>
          <LenisProvider>
            <AppShell
              user={
                user
                  ? {
                      id: user.id,
                      name: user.name,
                      photoUrl: user.photoUrl,
                      isAdmin: user.isAdmin,
                    }
                  : null
              }
            >
              {children}
            </AppShell>
          </LenisProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
