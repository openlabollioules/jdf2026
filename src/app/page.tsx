import { Kiosk } from "@/components/Kiosk";
import { getPublicConfig } from "@/lib/server/env";

// La configuration (durées, options caméra, e-mail…) est lue à chaque chargement :
// modifier le .env puis redémarrer suffit, sans reconstruire.
export const dynamic = "force-dynamic";

export default function Page() {
  return <Kiosk config={getPublicConfig()} />;
}
