/**
 * Adresse et clé publique de la base de prospection — distincte de celle du
 * site. Ni l'une ni l'autre n'est un secret : Next les livre au navigateur de
 * toute façon. Ce qui protège les données, c'est la Row Level Security de la
 * base, couverte par ses tests.
 *
 * Ce fichier ne porte volontairement aucune directive. Les mêmes constantes
 * déclarées dans un module « use client » n'arrivent pas telles quelles au
 * serveur : Next y substitue des références destinées au navigateur, et une
 * action serveur qui les lisait recevait autre chose que du texte — c'est ce
 * qui faisait échouer l'ajout d'un commercial. Neutre, le fichier est lu
 * correctement des deux côtés.
 */
export const PROSPECTION_URL = "https://omnrmdibmgttesqvexrt.supabase.co";
export const PROSPECTION_KEY = "sb_publishable_qpfmtcc2yy6iEuY0sNxVjw_JQ6EQw-d";
