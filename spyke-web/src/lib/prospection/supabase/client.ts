"use client";

import { createBrowserClient } from "@supabase/ssr";
import { PROSPECTION_KEY, PROSPECTION_URL } from "../config";

/**
 * Le site et l'outil de prospection parlent à deux projets Supabase différents.
 * Les sessions ne se marchent pas dessus : le nom du cookie posé par Supabase
 * contient la référence du projet, qui diffère.
 */
export function createClient() {
  return createBrowserClient(PROSPECTION_URL, PROSPECTION_KEY);
}
