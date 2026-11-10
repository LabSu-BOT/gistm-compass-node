import { cookies } from "next/headers";

/**
 * Mensagem de confirmação ("toast") após uma ação.
 *
 * Server Actions gravam a mensagem num cookie curto; o layout raiz lê o
 * cookie na renderização seguinte e entrega ao <Toaster />, que mostra a
 * mensagem e apaga o cookie. Funciona com os formulários atuais (sem precisar
 * transformar cada um em componente cliente) e sobrevive a `redirect()`.
 */
export const FLASH_COOKIE = "gistm_flash";

export type FlashTone = "ok" | "info" | "warn";

export interface FlashMessage {
  id: string;
  text: string;
  tone: FlashTone;
}

export async function flash(text: string, tone: FlashTone = "ok") {
  const store = await cookies();
  const payload: FlashMessage = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, tone };
  store.set(FLASH_COOKIE, encodeURIComponent(JSON.stringify(payload)), {
    path: "/",
    maxAge: 30,
    httpOnly: false, // o cliente apaga depois de exibir
    sameSite: "lax",
  });
}

export async function readFlash(): Promise<FlashMessage | null> {
  const store = await cookies();
  const raw = store.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as FlashMessage;
    if (typeof parsed?.text !== "string" || typeof parsed?.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
