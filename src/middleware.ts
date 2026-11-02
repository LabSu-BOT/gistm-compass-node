import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Protege tudo exceto assets estáticos do Next e favicon.
     * Rotas públicas (/login, /cadastro condicional, /api/auth) são liberadas
     * em authConfig.callbacks.authorized.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
