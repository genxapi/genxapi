import { useEffect, useState } from "react";

const PREVIEW_TOKEN = "genxapi";
export const PREVIEW_QUERY = `?preview=${PREVIEW_TOKEN}`;

export function usePreviewGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("preview");
    setEnabled(token === PREVIEW_TOKEN);
  }, []);

  return enabled;
}
