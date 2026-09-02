/**
 * Base Supabase de l'outil de prospection — distincte de celle du site.
 *
 * Ces deux valeurs ne sont pas des secrets : Next les intègre au code envoyé au
 * navigateur, donc chaque visiteur les possède de toute façon. Ce qui protège
 * les données, c'est la Row Level Security de la base, vérifiée par 66 tests.
 * Elles sont écrites ici plutôt qu'en variables d'environnement pour que
 * l'outil se déploie sans réglage manuel.
 *
 * La clé de service, elle, est un vrai secret et reste hors du dépôt : voir
 * PROSPECTION_SUPABASE_SERVICE_ROLE_KEY dans admin.ts.
 */
export const PROSPECTION_URL = "https://omnrmdibmgttesqvexrt.supabase.co";
export const PROSPECTION_KEY = "sb_publishable_qpfmtcc2yy6iEuY0sNxVjw_JQ6EQw-d";
