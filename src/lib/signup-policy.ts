/**
 * Cadastro público cria Organization + primeiro ADMIN.
 * Em produção deve ficar desligado (`ALLOW_PUBLIC_SIGNUP=false` ou ausente).
 */
export function isPublicSignupAllowed(): boolean {
  return process.env.ALLOW_PUBLIC_SIGNUP === "true";
}
