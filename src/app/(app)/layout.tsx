import { AppNav } from "@/components/AppNav";
import { isMockMode } from "@/lib/backend";
import { currentTheme } from "@/lib/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav theme={await currentTheme()} mock={isMockMode()} />
      <main>{children}</main>
    </>
  );
}
