import { messagesMedia } from "./messages-media";
import { messagesEntities } from "./messages-entities";
import { messagesDiscovery } from "./messages-discovery";

/** Application-owned FR/EN messages. External content never enters this catalogue. */
export const messages = {
  "Diagnostic du dock PWA": { fr: "Diagnostic du dock PWA", en: "PWA dock diagnostic" },
  "Temporaire et local. Active-le, ferme complètement la PWA puis relance-la sur l'accueil. Attends de voir le dock avant de toucher. Après son déplacement, reviens ici pour figer et copier les mesures.": { fr: "Temporaire et local. Active-le, ferme complètement la PWA puis relance-la sur l'accueil. Attends de voir le dock avant de toucher. Après son déplacement, reviens ici pour figer et copier les mesures.", en: "Temporary and local. Enable it, fully close the PWA, then relaunch it on Home. Wait until you see the dock before touching. After it moves, return here to freeze and copy the measurements." },
  "Deux lancements maximum sont conservés. Aucune donnée de compte, contenu saisi ou adresse de page n'est enregistré ni envoyé.": { fr: "Deux lancements maximum sont conservés. Aucune donnée de compte, contenu saisi ou adresse de page n'est enregistré ni envoyé.", en: "Up to two launches are kept. No account data, input contents or page addresses are recorded or sent." },
  "Figer et consulter les mesures": { fr: "Figer et consulter les mesures", en: "Freeze and view measurements" },
  "Effacer les mesures": { fr: "Effacer les mesures", en: "Clear measurements" },
  "Mesures du dock": { fr: "Mesures du dock", en: "Dock measurements" },
  "Copier les mesures": { fr: "Copier les mesures", en: "Copy measurements" },
  "Mesures copiées.": { fr: "Mesures copiées.", en: "Measurements copied." },
  "Sélectionne le texte des mesures pour le copier.": { fr: "Sélectionne le texte des mesures pour le copier.", en: "Select the measurement text to copy it." },
  "Stockage local indisponible.": { fr: "Stockage local indisponible.", en: "Local storage unavailable." },
  "Aucune mesure enregistrée. Active le diagnostic puis relance la PWA.": { fr: "Aucune mesure enregistrée. Active le diagnostic puis relance la PWA.", en: "No measurements recorded. Enable the diagnostic, then relaunch the PWA." },
  "Pas maintenant": { fr: "Pas maintenant", en: "Not now" },
  "Sans autorisation, ces sources ne peuvent pas être utilisées. Leur activation ne nécessite pas de compte.": {
    fr: "Sans autorisation, ces sources ne peuvent pas être utilisées. Leur activation ne nécessite pas de compte.",
    en: "These sources cannot be used without permission. Activating them does not require an account.",
  },
  ...messagesMedia,
  ...messagesEntities,
  ...messagesDiscovery,
  "Épisode absent de cette partie": { fr: "Épisode absent de cette partie", en: "Episode not part of this entry" },
  "Vérifie la saison ou la partie sur la fiche de l'anime.": { fr: "Vérifie la saison ou la partie sur la fiche de l'anime.", en: "Check the season or part on the anime page." },
  "Ouvrir la fiche": { fr: "Ouvrir la fiche", en: "Open anime page" },
  "Informations sur l'anime": { fr: "Informations sur l'anime", en: "Anime information" },
  "Fiche de l'anime": { fr: "Fiche de l'anime", en: "Anime page" },
  "Aucune source n'est activée.": { fr: "Aucune source n'est activée.", en: "No enabled sources." },
  "Détails de lecture": { fr: "Détails de lecture", en: "Playback details" },
  "Options de la source": { fr: "Options de la source", en: "Source options" },
  "Année précédente": { "fr": "Année précédente", "en": "Previous year" },
  "Année suivante": { "fr": "Année suivante", "en": "Next year" },
  "Affichage du catalogue": { "fr": "Affichage du catalogue", "en": "Catalogue view" },
  "Code à six chiffres": { "fr": "Code à six chiffres", "en": "Six-digit code" },
  "Renvoyer le code": { "fr": "Renvoyer le code", "en": "Resend code" },
  "Changer d’adresse": { "fr": "Changer d’adresse", "en": "Change email" },
  "Ancien lien de connexion": { "fr": "Ancien lien de connexion", "en": "Legacy sign-in link" },
  "Traduction de la piste anglaise avec ton accord.": { "fr": "Traduction de la piste anglaise avec ton accord.", "en": "Translate the English track with your consent." },
  "Comptes indisponibles": { "fr": "Comptes indisponibles", "en": "Accounts unavailable" },
  "Renvoyer dans {0} s": { "fr": "Renvoyer dans {0} s", "en": "Resend in {0} s" },
  "Chargement des épisodes": {
    "fr": "Chargement des épisodes",
    "en": "Loading episodes"
  },
  "Chargement de la fiche": {
    "fr": "Chargement de la fiche",
    "en": "Loading details"
  },
  "Chargement du staff": {
    "fr": "Chargement du staff",
    "en": "Loading staff"
  },
  "Quelque chose a coincé": {
    "fr": "Quelque chose a coincé",
    "en": "Something went wrong"
  },
  "Réessayer": {
    "fr": "Réessayer",
    "en": "Try again"
  },
  "Tes données locales ne sont pas touchées. Recharge l'écran pour continuer.": {
    "fr": "Tes données locales ne sont pas touchées. Recharge l'écran pour continuer.",
    "en": "Your local data is safe. Reload the screen to continue."
  },
  "Chargement de la franchise": {
    "fr": "Chargement de la franchise",
    "en": "Loading franchise"
  },
  "Page introuvable": {
    "fr": "Page introuvable",
    "en": "Page not found"
  },
  "Retour à l'accueil": {
    "fr": "Retour à l'accueil",
    "en": "Back to home"
  },
  "Ce lien ne mène nulle part dans Maximanim.": {
    "fr": "Ce lien ne mène nulle part dans Maximanim.",
    "en": "This link does not lead anywhere in MaximAnim."
  },
  "Réglages": {
    "fr": "Réglages",
    "en": "Settings"
  },
  "Chargement du studio": {
    "fr": "Chargement du studio",
    "en": "Loading studio"
  },
  "Préparation de l'épisode": {
    "fr": "Préparation de l'épisode",
    "en": "Preparing episode"
  },
  "Chargement de l'œuvre": {
    "fr": "Chargement de l'œuvre",
    "en": "Loading work"
  },
  "Navigation principale": {
    "fr": "Navigation principale",
    "en": "Main navigation"
  },
  "MaximAnim, accueil": {
    "fr": "MaximAnim, accueil",
    "en": "MaximAnim, home"
  },
  "MaximAnim": {
    "fr": "MaximAnim",
    "en": "MaximAnim"
  },
  "Fil d'Ariane": {
    "fr": "Fil d'Ariane",
    "en": "Breadcrumb"
  },
  "›": {
    "fr": "›",
    "en": "›"
  },
  "Fermer": {
    "fr": "Fermer",
    "en": "Close"
  },
  "Chargement…": {
    "fr": "Chargement…",
    "en": "Loading…"
  },
  "Hors ligne ta bibliothèque reste disponible": {
    "fr": "Hors ligne ta bibliothèque reste disponible",
    "en": "Offline — your library is still available"
  },
  "Annuler la confirmation": {
    "fr": "Annuler",
    "en": "Cancel"
  },
  "Annuler": {
    "fr": "Annuler",
    "en": "Undo"
  },
  "Bibliothèque, suivi et lecteur d'anime — pensé pour l'iPhone.": {
    "fr": "Bibliothèque, suivi et lecteur d'anime — pensé pour l'iPhone.",
    "en": "Anime library, tracker and player — built for iPhone."
  },
  "Français (traduit)": {
    "fr": "Français (traduit)",
    "en": "French (translated)"
  },
  "à l'instant": {
    "fr": "à l'instant",
    "en": "just now"
  },
  "Synchronisé": {
    "fr": "Synchronisé",
    "en": "Synced"
  },
  "Tes données sont enregistrées sur cet appareil. Les comptes ne sont pas activés sur ce déploiement.": {
    "fr": "Tes données sont enregistrées sur cet appareil. Les comptes ne sont pas activés sur ce déploiement.",
    "en": "Your data is saved on this device. Accounts are not enabled on this deployment."
  },
  "Dernière synchronisation :": {
    "fr": "Dernière synchronisation :",
    "en": "Last sync:"
  },
  "Synchronisé {0} reçus, {1} envoyés": {
    "fr": "Synchronisé {0} reçus, {1} envoyés",
    "en": "Synced: {0} received, {1} sent"
  },
  "Synchroniser maintenant": {
    "fr": "Synchroniser maintenant",
    "en": "Sync now"
  },
  "Sauvegarde partagée": {
    "fr": "Sauvegarde partagée",
    "en": "Backup shared"
  },
  "Sauvegarde téléchargée": {
    "fr": "Sauvegarde téléchargée",
    "en": "Backup downloaded"
  },
  "L'export a échoué.": {
    "fr": "L'export a échoué.",
    "en": "Export failed."
  },
  "Exporter une sauvegarde": {
    "fr": "Exporter une sauvegarde",
    "en": "Export a backup"
  },
  "Déconnecté tes données restent sur cet appareil": {
    "fr": "Déconnecté tes données restent sur cet appareil",
    "en": "Signed out — your data stays on this device"
  },
  "Se déconnecter": {
    "fr": "Se déconnecter",
    "en": "Sign out"
  },
  "Tes données sont enregistrées sur cet appareil. Connecte-toi pour les synchroniser entre tes appareils sans mot de passe.": {
    "fr": "Tes données sont enregistrées sur cet appareil. Connecte-toi pour les synchroniser entre tes appareils sans mot de passe.",
    "en": "Your data is saved on this device. Sign in to sync it across your devices without a password."
  },
  "E-mail": {
    "fr": "E-mail",
    "en": "Email"
  },
  "Continuer sans compte": {
    "fr": "Continuer sans compte",
    "en": "Continue without an account"
  },
  "E-mail envoyé à": {
    "fr": "E-mail envoyé à",
    "en": "Email sent to"
  },
  ". Tape le code qu'il contient, ou colle le lien de connexion (appui long sur le lien → Copier), ou le code de transfert affiché si tu l'as ouvert dans Safari.": {
    "fr": ". Tape le code qu'il contient, ou colle le lien de connexion (appui long sur le lien → Copier), ou le code de transfert affiché si tu l'as ouvert dans Safari.",
    "en": ". Enter its code, paste the sign-in link (press and hold the link → Copy), or enter the transfer code shown if you opened it in Safari."
  },
  "Code ou lien de connexion": {
    "fr": "Code ou lien de connexion",
    "en": "Code or sign-in link"
  },
  "Coller": {
    "fr": "Coller",
    "en": "Paste"
  },
  "Vérification…": {
    "fr": "Vérification…",
    "en": "Verifying…"
  },
  "Renvoyer / changer d'adresse": {
    "fr": "Renvoyer / changer d'adresse",
    "en": "Resend / change address"
  },
  "Synchroniser entre tes appareils ?": {
    "fr": "Synchroniser entre tes appareils ?",
    "en": "Sync across your devices?"
  },
  "Avec un compte, ta progression et tes listes te suivent. Sans compte, tout reste sur cet appareil.": {
    "fr": "Avec un compte, ta progression et tes listes te suivent. Sans compte, tout reste sur cet appareil.",
    "en": "An account syncs your progress and lists. Without one, everything stays on this device."
  },
  "Se connecter": {
    "fr": "Se connecter",
    "en": "Sign in"
  },
  "Les comptes ne sont pas configurés sur ce déploiement.": {
    "fr": "Les comptes ne sont pas configurés sur ce déploiement.",
    "en": "Accounts are not configured on this deployment."
  },
  "Lien expiré ou déjà utilisé. Demande un nouvel e-mail depuis Réglages → Compte et synchronisation.": {
    "fr": "Lien expiré ou déjà utilisé. Demande un nouvel e-mail depuis Réglages → Compte et synchronisation.",
    "en": "Expired or already used link. Request a new email in Settings → Account and sync."
  },
  "Lien expiré ou déjà utilisé.": {
    "fr": "Lien expiré ou déjà utilisé.",
    "en": "Expired or already used link."
  },
  "Connexion…": {
    "fr": "Connexion…",
    "en": "Signing in…"
  },
  "Connexion impossible": {
    "fr": "Connexion impossible",
    "en": "Unable to sign in"
  },
  "Retour aux réglages": {
    "fr": "Retour aux réglages",
    "en": "Back to settings"
  },
  "Connecté dans ce navigateur ✓": {
    "fr": "Connecté dans ce navigateur ✓",
    "en": "Signed in on this browser ✓"
  },
  "Si tu utilises MaximAnim installée sur l'écran d'accueil, copie ce code et colle-le dans l'app : Réglages → Compte et synchronisation. Il ne sert qu'une fois.": {
    "fr": "Si tu utilises MaximAnim installée sur l'écran d'accueil, copie ce code et colle-le dans l'app : Réglages → Compte et synchronisation. Il ne sert qu'une fois.",
    "en": "If you use MaximAnim installed on your home screen, copy this code and paste it in the app: Settings → Account and sync. It works only once."
  },
  "Copié": {
    "fr": "Copié",
    "en": "Copied"
  },
  "Utiliser plutôt ce navigateur": {
    "fr": "Utiliser plutôt ce navigateur",
    "en": "Use this browser instead"
  },
  "À propos": {
    "fr": "À propos",
    "en": "About"
  },
  "Résumé": {
    "fr": "Résumé",
    "en": "Synopsis"
  },
  "Genres": {
    "fr": "Genres",
    "en": "Genres"
  },
  "Thèmes": {
    "fr": "Thèmes",
    "en": "Themes"
  },
  "Durée": {
    "fr": "Durée",
    "en": "Duration"
  },
  " / ép.": {
    "fr": " / ép.",
    "en": " / ep."
  },
  " par épisode": {
    "fr": " par épisode",
    "en": " per episode"
  },
  "Autres crédits": {
    "fr": "Autres crédits",
    "en": "Other credits"
  },
  "Autres titres": {
    "fr": "Autres titres",
    "en": "Other titles"
  },
  "Liens": {
    "fr": "Liens",
    "en": "Links"
  },
  "·": {
    "fr": "·",
    "en": "·"
  },
  "À venir": {
    "fr": "À venir",
    "en": "Upcoming"
  },
  "Contenu explicite masqué": {
    "fr": "Contenu explicite masqué",
    "en": "Explicit content hidden"
  },
  "Préférences de découverte": {
    "fr": "Préférences de découverte",
    "en": "Discovery preferences"
  },
  "Le lien est peut-être incorrect.": {
    "fr": "Le lien est peut-être incorrect.",
    "en": "The link may be incorrect."
  },
  "AniList est injoignable et cette fiche n'a pas encore été enregistrée hors ligne.": {
    "fr": "AniList est injoignable et cette fiche n'a pas encore été enregistrée hors ligne.",
    "en": "AniList is unreachable and these details have not been saved offline yet."
  },
  "Gérer les listes": {
    "fr": "Gérer les listes",
    "en": "Manage lists"
  },
  "Ajouter à une liste": {
    "fr": "Ajouter à une liste",
    "en": "Add to a list"
  },
  "copie hors ligne": {
    "fr": "copie hors ligne",
    "en": "offline copy"
  },
  "Visionnage": {
    "fr": "Visionnage",
    "en": "Watching"
  },
  "{0} épisode {1}": {
    "fr": "{0} épisode {1}",
    "en": "{0} episode {1}"
  },
  "Ép.": {
    "fr": "Ép.",
    "en": "Ep."
  },
  "Pas encore diffusé": {
    "fr": "Pas encore diffusé",
    "en": "Not aired yet"
  },
  "À jour prochain épisode à venir": {
    "fr": "À jour prochain épisode à venir",
    "en": "Up to date — next episode upcoming"
  },
  "Épisodes": {
    "fr": "Épisodes",
    "en": "Episodes"
  },
  "Informations": {
    "fr": "Informations",
    "en": "Information"
  },
  "Afficher la traduction française": {
    "fr": "Afficher la traduction française",
    "en": "Show French translation"
  },
  "Réduire": {
    "fr": "Réduire",
    "en": "Collapse"
  },
  "Équipe": {
    "fr": "Équipe",
    "en": "Staff"
  },
  "Tout le staff": {
    "fr": "Tout le staff",
    "en": "All staff"
  },
  "Terminé": {
    "fr": "Terminé",
    "en": "Completed"
  },
  "Arrêté": {
    "fr": "Arrêté",
    "en": "Stopped"
  },
  "Retour": {
    "fr": "Retour",
    "en": "Back"
  },
  "Plus récent d'abord afficher les plus anciens": {
    "fr": "Plus récent d'abord afficher les plus anciens",
    "en": "Newest first — show oldest first"
  },
  "Plus ancien d'abord afficher les plus récents": {
    "fr": "Plus ancien d'abord afficher les plus récents",
    "en": "Oldest first — show newest first"
  },
  "Affichage de la filmographie": {
    "fr": "Affichage de la filmographie",
    "en": "Filmography view"
  },
  "Liste illustrée": {
    "fr": "Liste illustrée",
    "en": "Illustrated list"
  },
  "Filtrer par statut": {
    "fr": "Filtrer par statut",
    "en": "Filter by status"
  },
  "Abandonné": {
    "fr": "Abandonné",
    "en": "Dropped"
  },
  "Progression de l'œuvre": {
    "fr": "Progression de l'œuvre",
    "en": "Work progress"
  },
  "%": {
    "fr": "%",
    "en": "%"
  },
  "à suivre": {
    "fr": "à suivre",
    "en": "to watch next"
  },
  "Épisode {0} marqué comme vu": {
    "fr": "Épisode {0} marqué comme vu",
    "en": "Episode {0} marked watched"
  },
  "Épisode {0} marqué comme non vu": {
    "fr": "Épisode {0} marqué comme non vu",
    "en": "Episode {0} marked unwatched"
  },
  "Tout marquer comme vu": {
    "fr": "Tout marquer comme vu",
    "en": "Mark all as watched"
  },
  "Tout marquer comme vu ?": {
    "fr": "Tout marquer comme vu ?",
    "en": "Mark all as watched?"
  },
  " épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.": {
    "fr": " épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.",
    "en": " available episodes of this season will be marked watched. Other seasons, history and lists are preserved."
  },
  "Épisodes marqués comme vus": {
    "fr": "Épisodes marqués comme vus",
    "en": "Episodes marked watched"
  },
  "Retour à la fiche": {
    "fr": "Retour à la fiche",
    "en": "Back to details"
  },
  "Impossible de charger les épisodes": {
    "fr": "Impossible de charger les épisodes",
    "en": "Unable to load episodes"
  },
  "AniList est injoignable pour le moment.": {
    "fr": "AniList est injoignable pour le moment.",
    "en": "AniList is currently unreachable."
  },
  "{0} épisodes marqués comme non vus": {
    "fr": "{0} épisodes marqués comme non vus",
    "en": "{0} episodes marked unwatched"
  },
  "{0} épisodes marqués comme vus": {
    "fr": "{0} épisodes marqués comme vus",
    "en": "{0} episodes marked watched"
  },
  "{0} épisodes": {
    "fr": "{0} épisodes",
    "en": "{0} episodes"
  },
  "{0} épisodes vus sur {1}": {
    "fr": "{0} épisodes vus sur {1}",
    "en": "{0} watched episodes out of {1}"
  },
  "Commencer ép. 1": {
    "fr": "Commencer ép. 1",
    "en": "Start ep. 1"
  },
  "Lire le suivant ép. {0}": {
    "fr": "Lire le suivant ép. {0}",
    "en": "Play next — ep. {0}"
  },
  "Correspondance": {
    "fr": "Correspondance",
    "en": "Match"
  },
  "Modifier": {
    "fr": "Modifier",
    "en": "Edit"
  },
  "Aucune source ne trouve cet anime pour l'instant.": {
    "fr": "Aucune source ne trouve cet anime pour l'instant.",
    "en": "No source can find this anime right now."
  },
  "Réessaie, ou cherche-le toi-même : ton choix sera retenu.": {
    "fr": "Réessaie, ou cherche-le toi-même : ton choix sera retenu.",
    "en": "Try again, or search manually: your choice will be saved."
  },
  "Chercher moi-même": {
    "fr": "Chercher moi-même",
    "en": "Search manually"
  },
  "Nombre d'épisodes inconnu": {
    "fr": "Nombre d'épisodes inconnu",
    "en": "Episode count unknown"
  },
  "Les épisodes apparaîtront ici dès leur sortie.": {
    "fr": "Les épisodes apparaîtront ici dès leur sortie.",
    "en": "Episodes will appear here when released."
  },
  "AniList ne connaît pas encore le nombre d'épisodes, et aucune source ne fournit la liste.": {
    "fr": "AniList ne connaît pas encore le nombre d'épisodes, et aucune source ne fournit la liste.",
    "en": "AniList does not know the episode count yet, and no source provides the list."
  },
  "À suivre": {
    "fr": "À suivre",
    "en": "Up next"
  },
  "Dernier": {
    "fr": "Dernier",
    "en": "Latest"
  },
  "Plus d'actions": {
    "fr": "Plus d'actions",
    "en": "More actions"
  },
  "Aller à l'épisode…": {
    "fr": "Aller à l'épisode…",
    "en": "Go to episode…"
  },
  "Marquer jusqu'à l'épisode… comme vu": {
    "fr": "Marquer jusqu'à l'épisode… comme vu",
    "en": "Mark through episode… as watched"
  },
  "Tout marquer comme non vu": {
    "fr": "Tout marquer comme non vu",
    "en": "Mark all as unwatched"
  },
  "Marquer jusqu'à l'épisode": {
    "fr": "Marquer jusqu'à l'épisode",
    "en": "Mark through episode"
  },
  "Aller à l'épisode": {
    "fr": "Aller à l'épisode",
    "en": "Go to episode"
  },
  "Marquer {0} épisodes comme non vus ?": {
    "fr": "Marquer {0} épisodes comme non vus ?",
    "en": "Mark {0} episodes as unwatched?"
  },
  "Marquer les épisodes 1 à {0} comme vus ?": {
    "fr": "Marquer les épisodes 1 à {0} comme vus ?",
    "en": "Mark episodes 1 through {0} as watched?"
  },
  "Marquer {0} épisodes comme vus ?": {
    "fr": "Marquer {0} épisodes comme vus ?",
    "en": "Mark {0} episodes as watched?"
  },
  "Les positions de lecture de ces épisodes seront oubliées. L'historique n'est pas modifié.": {
    "fr": "Les positions de lecture de ces épisodes seront oubliées. L'historique n'est pas modifié.",
    "en": "Playback positions for these episodes will be cleared. History is unchanged."
  },
  "Cela ne crée pas d'historique de visionnage. Les épisodes qui sortiront ensuite resteront à voir.": {
    "fr": "Cela ne crée pas d'historique de visionnage. Les épisodes qui sortiront ensuite resteront à voir.",
    "en": "This does not create watch history. Future episodes will stay unwatched."
  },
  "Numéro d'épisode": {
    "fr": "Numéro d'épisode",
    "en": "Episode number"
  },
  " (1 à {0})": {
    "fr": " (1 à {0})",
    "en": " (1 to {0})"
  },
  "Liste des épisodes": {
    "fr": "Liste des épisodes",
    "en": "Episode list"
  },
  ", à suivre": {
    "fr": ", à suivre",
    "en": ", up next"
  },
  "Progression": {
    "fr": "Progression",
    "en": "Progress"
  },
  "Marquer l'épisode {0} comme non vu": {
    "fr": "Marquer l'épisode {0} comme non vu",
    "en": "Mark episode {0} as unwatched"
  },
  "Marquer l'épisode {0} comme vu": {
    "fr": "Marquer l'épisode {0} comme vu",
    "en": "Mark episode {0} as watched"
  },
  "Illustration officielle de la série (pas une image de cet épisode)": {
    "fr": "Illustration officielle de la série (pas une image de cet épisode)",
    "en": "Official series illustration (not an image of this episode)"
  },
  "Affiche de l'anime (pas une image de cet épisode)": {
    "fr": "Affiche de l'anime (pas une image de cet épisode)",
    "en": "Anime poster (not an image of this episode)"
  },
  "Image masquée pour éviter les spoilers": {
    "fr": "Image masquée pour éviter les spoilers",
    "en": "Image hidden to avoid spoilers"
  },
  "Aucune illustration autorisée disponible": {
    "fr": "Aucune illustration autorisée disponible",
    "en": "No authorized artwork available"
  },
  "Sans spoiler": {
    "fr": "Sans spoiler",
    "en": "No spoilers"
  },
  "Progression de l'épisode ": {
    "fr": "Progression de l'épisode ",
    "en": "Episode progress "
  },
  "Épisodes du dernier au premier, inverser": {
    "fr": "Épisodes du dernier au premier, inverser",
    "en": "Episodes newest to oldest, reverse order"
  },
  "Épisodes du premier au dernier, inverser": {
    "fr": "Épisodes du premier au dernier, inverser",
    "en": "Episodes oldest to newest, reverse order"
  },
  "Tous les épisodes": {
    "fr": "Tous les épisodes",
    "en": "All episodes"
  },
  "Épisodes de la saison": {
    "fr": "Épisodes de la saison",
    "en": "Season episodes"
  },
  "Lire l'épisode ": {
    "fr": "Lire l'épisode ",
    "en": "Play episode "
  },
  "Épisode": {
    "fr": "Épisode",
    "en": "Episode"
  },
  "Marquer l'épisode ": {
    "fr": "Marquer l'épisode ",
    "en": "Mark episode "
  },
  "Les épisodes apparaîtront ici dès leur diffusion.": {
    "fr": "Les épisodes apparaîtront ici dès leur diffusion.",
    "en": "Episodes will appear here as soon as they air."
  },
  "La liste des épisodes n'est pas encore disponible.": {
    "fr": "La liste des épisodes n'est pas encore disponible.",
    "en": "The episode list is not available yet."
  },
  "Marquer les épisodes précédents comme vus": {
    "fr": "Marquer les épisodes précédents comme vus",
    "en": "Mark previous episodes as watched"
  },
  "Marquer les épisodes précédents ?": {
    "fr": "Marquer les épisodes précédents ?",
    "en": "Mark previous episodes?"
  },
  "{0} épisodes non vus avant l'épisode {1} seront marqués comme vus, uniquement dans cette saison.": {
    "fr": "{0} épisodes non vus avant l'épisode {1} seront marqués comme vus, uniquement dans cette saison.",
    "en": "{0} unwatched episodes before episode {1} will be marked watched in this season only."
  },
  "Épisodes précédents marqués comme vus": {
    "fr": "Épisodes précédents marqués comme vus",
    "en": "Previous episodes marked watched"
  },
  "Marquer comme vu": {
    "fr": "Marquer comme vu",
    "en": "Mark as watched"
  },
  "Des épisodes précédents de cette saison restent non vus.": {
    "fr": "Des épisodes précédents de cette saison restent non vus.",
    "en": "Previous episodes in this season are still unwatched."
  },
  "Uniquement l'épisode": {
    "fr": "Uniquement l'épisode",
    "en": "This episode only"
  },
  "Cet épisode et les précédents": {
    "fr": "Cet épisode et les précédents",
    "en": "This episode and previous ones"
  },
  "{0} entrées": {
    "fr": "{0} entrées",
    "en": "{0} entries"
  },
  "Voir les": {
    "fr": "Voir les",
    "en": "View the"
  },
  "entrées": {
    "fr": "entrées",
    "en": "entries"
  },
  "Spécial": {
    "fr": "Spécial",
    "en": "Special"
  },
  "Cette série est introuvable": {
    "fr": "Cette série est introuvable",
    "en": "Series not found"
  },
  "AniList n'a pas cette entrée.": {
    "fr": "AniList n'a pas cette entrée.",
    "en": "AniList does not have this entry."
  },
  "AniList est injoignable : les saisons n'ont pas pu être listées.": {
    "fr": "AniList est injoignable : les saisons n'ont pas pu être listées.",
    "en": "AniList is unreachable: seasons could not be listed."
  },
  "Suite annoncée": {
    "fr": "Suite annoncée",
    "en": "Sequel announced"
  },
  "Source fondatrice": {
    "fr": "Source fondatrice",
    "en": "Original source"
  },
  "Série principale": {
    "fr": "Série principale",
    "en": "Main series"
  },
  "Franchise très longue : la liste peut être incomplète.": {
    "fr": "Franchise très longue : la liste peut être incomplète.",
    "en": "Very long franchise: the list may be incomplete."
  },
  "Franchise": {
    "fr": "Franchise",
    "en": "Franchise"
  },
  "Série": {
    "fr": "Série",
    "en": "Series"
  },
  "Les autres saisons n'ont pas pu être chargées.": {
    "fr": "Les autres saisons n'ont pas pu être chargées.",
    "en": "Other seasons could not be loaded."
  },
  "Saisons": {
    "fr": "Saisons",
    "en": "Seasons"
  },
  "Choisir la saison": {
    "fr": "Choisir la saison",
    "en": "Choose season"
  },
  " {0} ép.": {
    "fr": " {0} ép.",
    "en": " {0} ep."
  },
  "Partie": {
    "fr": "Partie",
    "en": "Part"
  },
  "Autour de la série": {
    "fr": "Autour de la série",
    "en": "Related to the series"
  },
  "Historique": {
    "fr": "Historique",
    "en": "History"
  },
  "Effacer": {
    "fr": "Effacer",
    "en": "Clear"
  },
  "Rien regardé pour l'instant": {
    "fr": "Rien regardé pour l'instant",
    "en": "Nothing watched yet"
  },
  "Trouver un anime": {
    "fr": "Trouver un anime",
    "en": "Find an anime"
  },
  "Chaque épisode lancé laissera une trace ici, du plus récent au plus ancien.": {
    "fr": "Chaque épisode lancé laissera une trace ici, du plus récent au plus ancien.",
    "en": "Every episode you start leaves a record here, newest first."
  },
  "Retirer de l'historique": {
    "fr": "Retirer de l'historique",
    "en": "Remove from history"
  },
  "Retiré de l'historique progression conservée": {
    "fr": "Retiré de l'historique progression conservée",
    "en": "Removed from history — progress preserved"
  },
  "Effacer l'historique ?": {
    "fr": "Effacer l'historique ?",
    "en": "Clear history?"
  },
  "L'historique de visionnage sera vidé. Ta progression par épisode et tes listes sont conservées.": {
    "fr": "L'historique de visionnage sera vidé. Ta progression par épisode et tes listes sont conservées.",
    "en": "Watch history will be cleared. Episode progress and lists are preserved."
  },
  "Historique effacé": {
    "fr": "Historique effacé",
    "en": "History cleared"
  },
  "Retiré de Continuer progression conservée": {
    "fr": "Retiré de Continuer progression conservée",
    "en": "Removed from Continue — progress preserved"
  },
  "Rechercher un anime": {
    "fr": "Rechercher un anime",
    "en": "Search for an anime"
  },
  "Continuer": {
    "fr": "Continuer",
    "en": "Continue"
  },
  "Rien à continuer pour l'instant. Lance un épisode : il apparaîtra ici.": {
    "fr": "Rien à continuer pour l'instant. Lance un épisode : il apparaîtra ici.",
    "en": "Nothing to continue yet. Start an episode and it will appear here."
  },
  "Voir le planning": {
    "fr": "Voir le planning",
    "en": "View schedule"
  },
  "Bibliothèque et historique": {
    "fr": "Bibliothèque et historique",
    "en": "Library and history"
  },
  "Listes / Bibliothèque": {
    "fr": "Listes / Bibliothèque",
    "en": "Lists / Library"
  },
  "{0} à continuer": {
    "fr": "{0} à continuer",
    "en": "{0} to continue"
  },
  "Aucune sortie annoncée.": {
    "fr": "Aucune sortie annoncée.",
    "en": "No announced releases."
  },
  "Pas de réseau": {
    "fr": "Pas de réseau",
    "en": "No network"
  },
  "Cette page n'a pas encore été enregistrée pour une utilisation hors ligne. Ta bibliothèque, tes listes et ton historique restent disponibles.": {
    "fr": "Cette page n'a pas encore été enregistrée pour une utilisation hors ligne. Ta bibliothèque, tes listes et ton historique restent disponibles.",
    "en": "This page has not been saved for offline use yet. Your library, lists and history remain available."
  },
  "Accueil": {
    "fr": "Accueil",
    "en": "Home"
  },
  "Impossible de modifier le suivi. Réessayer.": {
    "fr": "Impossible de modifier le suivi. Réessayer.",
    "en": "Unable to update tracking. Try again."
  },
  "Ce que tu as commencé et pas terminé, ni abandonné.": {
    "fr": "Ce que tu as commencé et pas terminé, ni abandonné.",
    "en": "What you started but have not completed or dropped."
  },
  "Terminés : ceux que tu as marqués, et ceux dont tous les épisodes sont vus.": {
    "fr": "Terminés : ceux que tu as marqués, et ceux dont tous les épisodes sont vus.",
    "en": "Completed: titles you marked, and titles with every episode watched."
  },
  "Ce que tu ne veux plus suivre. Ta progression est gardée ; « Retirer du suivi » enlève un titre d'ici sans rien effacer.": {
    "fr": "Ce que tu ne veux plus suivre. Ta progression est gardée ; « Retirer du suivi » enlève un titre d'ici sans rien effacer.",
    "en": "What you no longer want to follow. Progress is kept; Remove from tracking removes a title from here without deleting anything."
  },
  "Rien à continuer": {
    "fr": "Rien à continuer",
    "en": "Nothing to continue"
  },
  "Aucun anime terminé": {
    "fr": "Aucun anime terminé",
    "en": "No completed anime"
  },
  "Un anime est terminé quand tu le marques, ou quand tous ses épisodes sont vus et qu'il est fini sur AniList.": {
    "fr": "Un anime est terminé quand tu le marques, ou quand tous ses épisodes sont vus et qu'il est fini sur AniList.",
    "en": "An anime is completed when you mark it, or when every episode is watched and AniList lists it as finished."
  },
  "Aucun anime abandonné": {
    "fr": "Aucun anime abandonné",
    "en": "No dropped anime"
  },
  "Depuis la fiche d'un anime commencé, « Abandonner » le range ici sans rien effacer.": {
    "fr": "Depuis la fiche d'un anime commencé, « Abandonner » le range ici sans rien effacer.",
    "en": "On the details of an anime you started, Drop puts it here without deleting anything."
  },
  "Retour aux listes": {
    "fr": "Retour aux listes",
    "en": "Back to lists"
  },
  "La progression est conservée": {
    "fr": "La progression est conservée",
    "en": "Progress is preserved"
  },
  "Abandonné progression conservée": {
    "fr": "Abandonné progression conservée",
    "en": "Dropped — progress preserved"
  },
  "Revient dans À continuer": {
    "fr": "Revient dans À continuer",
    "en": "Returned to Continue"
  },
  "Quitte cette liste ; progression et historique conservés": {
    "fr": "Quitte cette liste ; progression et historique conservés",
    "en": "Leaves this list; progress and history preserved"
  },
  "Retiré du suivi progression conservée": {
    "fr": "Retiré du suivi progression conservée",
    "en": "Removed from tracking — progress preserved"
  },
  "Retire le marquage « terminé »": {
    "fr": "Retire le marquage « terminé »",
    "en": "Remove the completed mark"
  },
  "Retiré de Terminés": {
    "fr": "Retiré de Terminés",
    "en": "Removed from Completed"
  },
  "Marqué comme terminé": {
    "fr": "Marqué comme terminé",
    "en": "Marked completed"
  },
  "Tous les épisodes vus": {
    "fr": "Tous les épisodes vus",
    "en": "All episodes watched"
  },
  "{0}/{1} ép.": {
    "fr": "{0}/{1} ép.",
    "en": "{0}/{1} ep."
  },
  "{0} ép. vus": {
    "fr": "{0} ép. vus",
    "en": "{0} ep. watched"
  },
  "Visionnage réinitialisé": {
    "fr": "Visionnage réinitialisé",
    "en": "Watch progress reset"
  },
  "Suivi du visionnage": {
    "fr": "Suivi du visionnage",
    "en": "Watch tracking"
  },
  "Suivi": {
    "fr": "Suivi",
    "en": "Tracking"
  },
  "Reprendre": {
    "fr": "Reprendre",
    "en": "Resume"
  },
  "Reprend là où tu t'étais arrêté": {
    "fr": "Reprend là où tu t'étais arrêté",
    "en": "Resume where you left off"
  },
  "Repris position conservée": {
    "fr": "Repris position conservée",
    "en": "Resumed — position preserved"
  },
  "Remettre en cours": {
    "fr": "Remettre en cours",
    "en": "Set to watching"
  },
  "Abandonner": {
    "fr": "Abandonner",
    "en": "Drop"
  },
  "La position de lecture est conservée": {
    "fr": "La position de lecture est conservée",
    "en": "Playback position is preserved"
  },
  "Abandonné position conservée": {
    "fr": "Abandonné position conservée",
    "en": "Dropped — position preserved"
  },
  "Marquer comme terminé": {
    "fr": "Marquer comme terminé",
    "en": "Mark as completed"
  },
  "Sans lire les épisodes restants": {
    "fr": "Sans lire les épisodes restants",
    "en": "Without watching remaining episodes"
  },
  "Les nouveaux épisodes apparaissent dans le calendrier « Suivies »": {
    "fr": "Les nouveaux épisodes apparaissent dans le calendrier « Suivies »",
    "en": "New episodes appear in the Followed calendar"
  },
  "Réinitialiser le visionnage": {
    "fr": "Réinitialiser le visionnage",
    "en": "Reset watch progress"
  },
  "Efface la progression ; tes listes sont conservées": {
    "fr": "Efface la progression ; tes listes sont conservées",
    "en": "Clears progress; lists are preserved"
  },
  "Réinitialiser le visionnage ?": {
    "fr": "Réinitialiser le visionnage ?",
    "en": "Reset watch progress?"
  },
  "Réinitialiser": {
    "fr": "Réinitialiser",
    "en": "Reset"
  },
  "Tous les épisodes redeviennent non vus, la position de lecture et l'historique de ce titre sont effacés. Tes listes ne changent pas.": {
    "fr": "Tous les épisodes redeviennent non vus, la position de lecture et l'historique de ce titre sont effacés. Tes listes ne changent pas.",
    "en": "All episodes become unwatched. Playback position and this title’s history are cleared. Your lists stay the same."
  },
  "Retiré de {0}": {
    "fr": "Retiré de {0}",
    "en": "Removed from {0}"
  },
  "Ajouté à {0}": {
    "fr": "Ajouté à {0}",
    "en": "Added to {0}"
  },
  "La liste n'a pas pu être modifiée.": {
    "fr": "La liste n'a pas pu être modifiée.",
    "en": "Unable to update the list."
  },
  "Nouvelle liste": {
    "fr": "Nouvelle liste",
    "en": "New list"
  },
  "Aucune liste. Crée la première ci-dessous.": {
    "fr": "Aucune liste. Crée la première ci-dessous.",
    "en": "No lists. Create the first one below."
  },
  "Cette liste n'existe plus": {
    "fr": "Cette liste n'existe plus",
    "en": "This list no longer exists"
  },
  "Mes listes": {
    "fr": "Mes listes",
    "en": "My lists"
  },
  "Renommer la liste": {
    "fr": "Renommer la liste",
    "en": "Rename list"
  },
  "Réorganiser ou retirer": {
    "fr": "Réorganiser ou retirer",
    "en": "Reorder or remove"
  },
  "Liste vide": {
    "fr": "Liste vide",
    "en": "Empty list"
  },
  "Chercher un anime": {
    "fr": "Chercher un anime",
    "en": "Search for an anime"
  },
  "Ouvre la fiche d'un anime et touche « Ajouter ».": {
    "fr": "Ouvre la fiche d'un anime et touche « Ajouter ».",
    "en": "Open an anime’s details and tap Add."
  },
  "{0} retiré": {
    "fr": "{0} retiré",
    "en": "{0} removed"
  },
  "Liste modifiée": {
    "fr": "Liste modifiée",
    "en": "List updated"
  },
  "{0} {1} créée": {
    "fr": "{0} {1} créée",
    "en": "{0} {1} created"
  },
  "Nom de la liste": {
    "fr": "Nom de la liste",
    "en": "List name"
  },
  "Emoji": {
    "fr": "Emoji",
    "en": "Emoji"
  },
  "Autre emoji": {
    "fr": "Autre emoji",
    "en": "Other emoji"
  },
  "🙂": {
    "fr": "🙂",
    "en": "🙂"
  },
  "Saisir un autre emoji": {
    "fr": "Saisir un autre emoji",
    "en": "Enter another emoji"
  },
  "Créer la liste": {
    "fr": "Créer la liste",
    "en": "Create list"
  },
  "Listes": {
    "fr": "Listes",
    "en": "Lists"
  },
  "Terminer": {
    "fr": "Terminer",
    "en": "Done"
  },
  "Crée ta première liste": {
    "fr": "Crée ta première liste",
    "en": "Create your first list"
  },
  "Une liste = un emoji, un nom, et les anime que tu veux y ranger.": {
    "fr": "Une liste = un emoji, un nom, et les anime que tu veux y ranger.",
    "en": "A list has an emoji, a name, and the anime you want to put in it."
  },
  "Renommer": {
    "fr": "Renommer",
    "en": "Rename"
  },
  "Réorganiser": {
    "fr": "Réorganiser",
    "en": "Reorder"
  },
  "Supprimer": {
    "fr": "Supprimer",
    "en": "Delete"
  },
  "Supprimer la liste ?": {
    "fr": "Supprimer la liste ?",
    "en": "Delete list?"
  },
  "sera supprimée. Les anime et ta progression restent intacts.": {
    "fr": "sera supprimée. Les anime et ta progression restent intacts.",
    "en": "will be deleted. Anime and progress remain intact."
  },
  "{0} supprimée": {
    "fr": "{0} supprimée",
    "en": "{0} deleted"
  },
  "Suivi automatique": {
    "fr": "Suivi automatique",
    "en": "Automatic tracking"
  },
  "Mis à jour selon ce que tu regardes": {
    "fr": "Mis à jour selon ce que tu regardes",
    "en": "Updated based on what you watch"
  },
  "Sur cet anime": {
    "fr": "Sur cet anime",
    "en": "On this anime"
  },
  "Métiers": {
    "fr": "Métiers",
    "en": "Occupations"
  },
  "AniList ne liste aucun crédit de staff pour cette personne.": {
    "fr": "AniList ne liste aucun crédit de staff pour cette personne.",
    "en": "AniList lists no staff credits for this person."
  },
  " Ses rôles de voix ne sont pas encore affichés ici.": {
    "fr": " Ses rôles de voix ne sont pas encore affichés ici.",
    "en": " Voice roles are not shown here yet."
  },
  "Filmographie": {
    "fr": "Filmographie",
    "en": "Filmography"
  },
  "Filtrer par fonction": {
    "fr": "Filtrer par fonction",
    "en": "Filter by role"
  },
  "Aucun nouveau crédit dans les pages consultées.": {
    "fr": "Aucun nouveau crédit dans les pages consultées.",
    "en": "No new credits in the pages checked."
  },
  "Afficher la suite": {
    "fr": "Afficher la suite",
    "en": "Load more"
  },
  "AniList": {
    "fr": "AniList",
    "en": "AniList"
  },
  "vu": {
    "fr": "vu",
    "en": "watched"
  },
  "Épisode {0} introuvable{1}": {
    "fr": "Épisode {0} introuvable{1}",
    "en": "Episode {0} not found{1}"
  },
  "Saisis un numéro d'épisode": {
    "fr": "Saisis un numéro d'épisode",
    "en": "Enter an episode number"
  },
  "Qualité": {
    "fr": "Qualité",
    "en": "Quality"
  },
  "/": {
    "fr": "/",
    "en": "/"
  },
  "Autoriser les sous-titres": {
    "fr": "Autoriser les sous-titres",
    "en": "Allow subtitles"
  },
  "Sous-titres indisponibles": {
    "fr": "Sous-titres indisponibles",
    "en": "Subtitles unavailable"
  },
  "Sous-titres en cours de chargement": {
    "fr": "Sous-titres en cours de chargement",
    "en": "Subtitles loading"
  },
  "Qualité : {0}": {
    "fr": "Qualité : {0}",
    "en": "Quality: {0}"
  },
  "Quitter le plein écran": {
    "fr": "Quitter le plein écran",
    "en": "Exit fullscreen"
  },
  "Plein écran": {
    "fr": "Plein écran",
    "en": "Fullscreen"
  },
  "Chargement de la vidéo": {
    "fr": "Chargement de la vidéo",
    "en": "Loading video"
  },
  "Apparence": {
    "fr": "Apparence",
    "en": "Appearance"
  },
  "Position de lecture": {
    "fr": "Position de lecture",
    "en": "Playback position"
  },
  "Auto · {0} observé": {
    "fr": "Auto · {0} observé",
    "en": "Auto · {0} observed"
  },
  "échec": {
    "fr": "échec",
    "en": "failed"
  },
  "préparé": {
    "fr": "préparé",
    "en": "prepared"
  },
  "résolu": {
    "fr": "résolu",
    "en": "resolved"
  },
  "abandonné": {
    "fr": "abandonné",
    "en": "dropped"
  },
  "Sous-titres": {
    "fr": "Sous-titres",
    "en": "Subtitles"
  },
  "Langue": {
    "fr": "Langue",
    "en": "Language"
  },
  "Synchronisation": {
    "fr": "Synchronisation",
    "en": "Sync"
  },
  "Plus tôt, {0}": {
    "fr": "Plus tôt, {0}",
    "en": "Earlier, {0}"
  },
  "Décalage actuel": {
    "fr": "Décalage actuel",
    "en": "Current offset"
  },
  "Autres sous-titres": {
    "fr": "Autres sous-titres",
    "en": "Other subtitles"
  },
  "Marqué": {
    "fr": "Marqué",
    "en": "Strong"
  },
  "Épais": {
    "fr": "Épais",
    "en": "Thick"
  },
  "Réinitialiser la taille, la position et le contour": {
    "fr": "Réinitialiser la taille, la position et le contour",
    "en": "Reset size, position and outline"
  },
  "Taille": {
    "fr": "Taille",
    "en": "Size"
  },
  "Position": {
    "fr": "Position",
    "en": "Position"
  },
  "Style": {
    "fr": "Style",
    "en": "Style"
  },
  "J'adore Maxime.": {
    "fr": "J'adore Maxime.",
    "en": "I love Maxime."
  },
  "Contour": {
    "fr": "Contour",
    "en": "Outline"
  },
  "Options avancées": {
    "fr": "Options avancées",
    "en": "Advanced options"
  },
  " traduction activée": {
    "fr": " traduction activée",
    "en": " translation enabled"
  },
  "Traduire en français si nécessaire": {
    "fr": "Traduire en français si nécessaire",
    "en": "Translate to French if needed"
  },
  "Quand seul l'anglais existe : une piste « Français (traduit) » s'ajoute, l'anglais reste.": {
    "fr": "Quand seul l'anglais existe : une piste « Français (traduit) » s'ajoute, l'anglais reste.",
    "en": "When only English exists, a French (translated) track is added and the English track stays."
  },
  "Aperçu des sous-titres": {
    "fr": "Aperçu des sous-titres",
    "en": "Subtitle preview"
  },
  "Je suis amoureux de Maxime.": {
    "fr": "Je suis amoureux de Maxime.",
    "en": "I am in love with Maxime."
  },
  "release vérifiée": {
    "fr": "release vérifiée",
    "en": "verified release"
  },
  "épisode non confirmé": {
    "fr": "épisode non confirmé",
    "en": "episode unconfirmed"
  },
  "Français · {0}": {
    "fr": "Français · {0}",
    "en": "French · {0}"
  },
  "budget épuisé": {
    "fr": "budget épuisé",
    "en": "budget exhausted"
  },
  "Cette source ne permet pas encore d'aller à cette position.": {
    "fr": "Cette source ne permet pas encore d'aller à cette position.",
    "en": "This source cannot seek to this position yet."
  },
  "La source n'a pas pu aller à cette position.": {
    "fr": "La source n'a pas pu aller à cette position.",
    "en": "The source could not seek to this position."
  },
  "Rien à autoriser pour cette lecture.": {
    "fr": "Rien à autoriser pour cette lecture.",
    "en": "Nothing to authorize for this playback."
  },
  "Traduire en français": {
    "fr": "Traduire en français",
    "en": "Translate to French"
  },
  "{0} Réessayer": {
    "fr": "{0} Réessayer",
    "en": "{0} Try again"
  },
  "Décalage {0}{1}": {
    "fr": "Décalage {0}{1}",
    "en": "Offset {0}{1}"
  },
  " (calé sur l'anglais)": {
    "fr": " (calé sur l'anglais)",
    "en": " (aligned to English)"
  },
  "{0} (plus tôt)": {
    "fr": "{0} (plus tôt)",
    "en": "{0} (earlier)"
  },
  "Désactivés": {
    "fr": "Désactivés",
    "en": "Off"
  },
  "calé sur l'anglais": {
    "fr": "calé sur l'anglais",
    "en": "aligned to English"
  },
  "Plein écran indisponible sur cet appareil": {
    "fr": "Plein écran indisponible sur cet appareil",
    "en": "Fullscreen unavailable on this device"
  },
  "{0} ms après l'attache": {
    "fr": "{0} ms après l'attache",
    "en": "{0} ms after attachment"
  },
  "échec {0}{1} {2}": {
    "fr": "échec {0}{1} {2}",
    "en": "failed {0}{1} {2}"
  },
  "s": {
    "fr": "s",
    "en": "s"
  },
  "Ça prend un peu plus de temps que prévu.": {
    "fr": "Ça prend un peu plus de temps que prévu.",
    "en": "This is taking a little longer than expected."
  },
  "Le flux ne démarre pas.": {
    "fr": "Le flux ne démarre pas.",
    "en": "The stream will not start."
  },
  "La source a renvoyé un flux incompatible avec Safari.": {
    "fr": "La source a renvoyé un flux incompatible avec Safari.",
    "en": "The source returned a stream incompatible with Safari."
  },
  "Réessaie plus tard ou choisis une autre source.": {
    "fr": "Réessaie plus tard ou choisis une autre source.",
    "en": "Try again later or choose another source."
  },
  "préparation": {
    "fr": "préparation",
    "en": "preparing"
  },
  "{0} : {1} retour à la source précédente": {
    "fr": "{0} : {1} retour à la source précédente",
    "en": "{0}: {1} returning to previous source"
  },
  "Épisode absent de cette source": {
    "fr": "Épisode absent de cette source",
    "en": "Episode missing from this source"
  },
  "épisode absent": {
    "fr": "épisode absent",
    "en": "episode missing"
  },
  "pas de français": {
    "fr": "pas de français",
    "en": "no French"
  },
  "pas de français annoncé": {
    "fr": "pas de français annoncé",
    "en": "no French announced"
  },
  "vidéo introuvable": {
    "fr": "vidéo introuvable",
    "en": "video not found"
  },
  "Épisode absent": {
    "fr": "Épisode absent",
    "en": "Episode missing"
  },
  "résolution": {
    "fr": "résolution",
    "en": "resolution"
  },
  "démarrage": {
    "fr": "démarrage",
    "en": "startup"
  },
  "Timeout au démarrage": {
    "fr": "Timeout au démarrage",
    "en": "Startup timeout"
  },
  "Épisode {0}": {
    "fr": "Épisode {0}",
    "en": "Episode {0}"
  },
  "n'a pas démarré": {
    "fr": "n'a pas démarré",
    "en": "did not start"
  },
  "Préparation du film…": {
    "fr": "Préparation du film…",
    "en": "Preparing film…"
  },
  "Préparation de l'épisode {0}…": {
    "fr": "Préparation de l'épisode {0}…",
    "en": "Preparing episode {0}…"
  },
  "Résolution observée": {
    "fr": "Résolution observée",
    "en": "Observed resolution"
  },
  "Recherche du français": {
    "fr": "Recherche du français",
    "en": "Searching for French"
  },
  "Sous-titres bloqués": {
    "fr": "Sous-titres bloqués",
    "en": "Subtitles blocked"
  },
  "fournit des sous-titres, à autoriser.": {
    "fr": "fournit des sous-titres, à autoriser.",
    "en": "provides subtitles, awaiting permission."
  },
  "Autoriser": {
    "fr": "Autoriser",
    "en": "Allow"
  },
  "Anime introuvable": {
    "fr": "Anime introuvable",
    "en": "Anime not found"
  },
  "AniList ne répond pas et cette fiche n'est pas enregistrée.": {
    "fr": "AniList ne répond pas et cette fiche n'est pas enregistrée.",
    "en": "AniList is not responding and these details are not saved."
  },
  "Aucune source de lecture disponible": {
    "fr": "Aucune source de lecture disponible",
    "en": "No playback source available"
  },
  "MaximAnim ne contient pas de vidéos : il lit les épisodes depuis une source que tu actives dans Réglages → Sources.": {
    "fr": "MaximAnim ne contient pas de vidéos : il lit les épisodes depuis une source que tu actives dans Réglages → Sources.",
    "en": "MaximAnim does not contain videos: it plays episodes from a source you enable in Settings → Sources."
  },
  "Cette source ne trouve pas cet anime": {
    "fr": "Cette source ne trouve pas cet anime",
    "en": "This source cannot find this anime"
  },
  "Cherche-le dans ses résultats : ton choix sera retenu.": {
    "fr": "Cherche-le dans ses résultats : ton choix sera retenu.",
    "en": "Search its results: your choice will be saved."
  },
  "Rechercher dans cette source": {
    "fr": "Rechercher dans cette source",
    "en": "Search this source"
  },
  "L'entrée retenue n'a pas cet épisode : ce n'est peut-être pas la bonne.": {
    "fr": "L'entrée retenue n'a pas cet épisode : ce n'est peut-être pas la bonne.",
    "en": "The selected entry does not have this episode: it may be the wrong match."
  },
  "Cet épisode n'est pas disponible avec cette source.": {
    "fr": "Cet épisode n'est pas disponible avec cette source.",
    "en": "This episode is unavailable from this source."
  },
  "Vérifier la correspondance": {
    "fr": "Vérifier la correspondance",
    "en": "Check match"
  },
  "Aucun flux de cette source ne démarre": {
    "fr": "Aucun flux de cette source ne démarre",
    "en": "No stream from this source will start"
  },
  "Réessaie, ou choisis une autre source.": {
    "fr": "Réessaie, ou choisis une autre source.",
    "en": "Try again or choose another source."
  },
  "Navigation des épisodes": {
    "fr": "Navigation des épisodes",
    "en": "Episode navigation"
  },
  "Épisode précédent": {
    "fr": "Épisode précédent",
    "en": "Previous episode"
  },
  "Précédent": {
    "fr": "Précédent",
    "en": "Previous"
  },
  "Épisode suivant : {0}": {
    "fr": "Épisode suivant : {0}",
    "en": "Next episode: {0}"
  },
  "Épisode suivant": {
    "fr": "Épisode suivant",
    "en": "Next episode"
  },
  "Suivant": {
    "fr": "Suivant",
    "en": "Next"
  },
  "dans": {
    "fr": "dans",
    "en": "in"
  },
  "Recherche du français…": {
    "fr": "Recherche du français…",
    "en": "Searching for French…"
  },
  "Crédits": {
    "fr": "Crédits",
    "en": "Credits"
  },
  "Studio": {
    "fr": "Studio",
    "en": "Studio"
  },
  "Source": {
    "fr": "Source",
    "en": "Source"
  },
  "Crédits de l’épisode": {
    "fr": "Crédits de l’épisode",
    "en": "Episode credits"
  },
  "Nom en japonais": {
    "fr": "Nom en japonais",
    "en": "Japanese name"
  },
  "Crédits de la série": {
    "fr": "Crédits de la série",
    "en": "Series credits"
  },
  "épisodes": {
    "fr": "épisodes",
    "en": "episodes"
  },
  "vidéo": {
    "fr": "vidéo",
    "en": "video"
  },
  "Préparation de l'épisode…": {
    "fr": "Préparation de l'épisode…",
    "en": "Preparing episode…"
  },
  "Voir les sources": {
    "fr": "Voir les sources",
    "en": "View sources"
  },
  "Planning": {
    "fr": "Planning",
    "en": "Schedule"
  },
  "Gérer les suivis": {
    "fr": "Gérer les suivis",
    "en": "Manage follows"
  },
  "Sorties suivies": {
    "fr": "Sorties suivies",
    "en": "Followed releases"
  },
  "Vue du planning": {
    "fr": "Vue du planning",
    "en": "Schedule view"
  },
  "Diffusions": {
    "fr": "Diffusions",
    "en": "Airings"
  },
  "Aujourd’hui": {
    "fr": "Aujourd’hui",
    "en": "Today"
  },
  "Semaine précédente": {
    "fr": "Semaine précédente",
    "en": "Previous week"
  },
  "au": {
    "fr": "au",
    "en": "to"
  },
  "Semaine suivante": {
    "fr": "Semaine suivante",
    "en": "Next week"
  },
  "Jours de la semaine": {
    "fr": "Jours de la semaine",
    "en": "Weekdays"
  },
  " chargées": {
    "fr": " chargées",
    "en": " loaded"
  },
  "Heure locale": {
    "fr": "Heure locale",
    "en": "Local time"
  },
  "Chargement du planning": {
    "fr": "Chargement du planning",
    "en": "Loading schedule"
  },
  "Aucun anime en diffusion suivi": {
    "fr": "Aucun anime en diffusion suivi",
    "en": "No airing anime followed"
  },
  "Touche la cloche sur une fiche pour suivre ses sorties.": {
    "fr": "Touche la cloche sur une fiche pour suivre ses sorties.",
    "en": "Tap the bell on an anime’s details to follow its releases."
  },
  "Aucune sortie chargée pour ce jour.": {
    "fr": "Aucune sortie chargée pour ce jour.",
    "en": "No releases loaded for this day."
  },
  "Rien de prévu cette semaine.": {
    "fr": "Rien de prévu cette semaine.",
    "en": "Nothing scheduled this week."
  },
  "Diffusé": {
    "fr": "Diffusé",
    "en": "Aired"
  },
  "Horaire passé": {
    "fr": "Horaire passé",
    "en": "Time has passed"
  },
  "Calendrier partiel, d’autres sorties restent à charger.": {
    "fr": "Calendrier partiel, d’autres sorties restent à charger.",
    "en": "Partial calendar — more releases remain to load."
  },
  "Suivis sans diffusion cette semaine": {
    "fr": "Suivis sans diffusion cette semaine",
    "en": "Followed titles without a release this week"
  },
  "Suivis hors de cette semaine": {
    "fr": "Suivis hors de cette semaine",
    "en": "Followed titles outside this week"
  },
  "Aucun suivi. Sur la fiche d'un anime en diffusion, « Suivre les sorties » l'ajoute au planning ; regarder un épisode ou l'ajouter à une liste ne suffit pas.": {
    "fr": "Aucun suivi. Sur la fiche d'un anime en diffusion, « Suivre les sorties » l'ajoute au planning ; regarder un épisode ou l'ajouter à une liste ne suffit pas.",
    "en": "No followed titles. On an airing anime’s details, Follow releases adds it to the schedule; watching an episode or adding it to a list does not."
  },
  "Ne plus suivre": {
    "fr": "Ne plus suivre",
    "en": "Unfollow"
  },
  "Catalogue saisonnier": {
    "fr": "Catalogue saisonnier",
    "en": "Seasonal catalogue"
  },
  "Saison précédente": {
    "fr": "Saison précédente",
    "en": "Previous season"
  },
  "Saison": {
    "fr": "Saison",
    "en": "Season"
  },
  "Année": {
    "fr": "Année",
    "en": "Year"
  },
  "Saison suivante": {
    "fr": "Saison suivante",
    "en": "Next season"
  },
  "Origine": {
    "fr": "Origine",
    "en": "Source material"
  },
  "Toutes": {
    "fr": "Toutes",
    "en": "All"
  },
  "Chargement de la saison…": {
    "fr": "Chargement de la saison…",
    "en": "Loading season…"
  },
  "Catalogue indisponible pour l’instant.": {
    "fr": "Catalogue indisponible pour l’instant.",
    "en": "Catalogue currently unavailable."
  },
  "Aucun anime annoncé pour cette saison.": {
    "fr": "Aucun anime annoncé pour cette saison.",
    "en": "No anime announced for this season."
  },
  "Date non annoncée": {
    "fr": "Date non annoncée",
    "en": "Date not announced"
  },
  "Charger la suite": {
    "fr": "Charger la suite",
    "en": "Load more"
  },
  "Été": {
    "fr": "Été",
    "en": "Summer"
  },
  "Popularité": {
    "fr": "Popularité",
    "en": "Popularity"
  },
  "Récent": {
    "fr": "Récent",
    "en": "Newest"
  },
  "Recherche": {
    "fr": "Recherche",
    "en": "Search"
  },
  "Recherche en cours": {
    "fr": "Recherche en cours",
    "en": "Searching"
  },
  "Effacer la recherche": {
    "fr": "Effacer la recherche",
    "en": "Clear search"
  },
  "filtre": {
    "fr": "filtre",
    "en": "filter"
  },
  "actif": {
    "fr": "actif",
    "en": "active"
  },
  "Découvrir": {
    "fr": "Découvrir",
    "en": "Discover"
  },
  "Récents": {
    "fr": "Récents",
    "en": "Recently opened"
  },
  "Pas de connexion": {
    "fr": "Pas de connexion",
    "en": "No connection"
  },
  "La recherche a besoin d'internet. Tes listes restent accessibles depuis l'accueil.": {
    "fr": "La recherche a besoin d'internet. Tes listes restent accessibles depuis l'accueil.",
    "en": "Search needs an internet connection. Your lists remain accessible from Home."
  },
  "AniList ne répond pas": {
    "fr": "AniList ne répond pas",
    "en": "AniList is not responding"
  },
  "Tape un titre, ou réessaie dans un instant.": {
    "fr": "Tape un titre, ou réessaie dans un instant.",
    "en": "Enter a title, or try again in a moment."
  },
  "Aucun anime avec ces filtres": {
    "fr": "Aucun anime avec ces filtres",
    "en": "No anime with these filters"
  },
  "Élargis un filtre : une autre année, un autre format…": {
    "fr": "Élargis un filtre : une autre année, un autre format…",
    "en": "Broaden a filter: another year, another format…"
  },
  "Trop de recherches d'un coup. Réessaie dans quelques secondes.": {
    "fr": "Trop de recherches d'un coup. Réessaie dans quelques secondes.",
    "en": "Too many searches at once. Try again in a few seconds."
  },
  "Vérifie ta connexion, puis réessaie.": {
    "fr": "Vérifie ta connexion, puis réessaie.",
    "en": "Check your connection, then try again."
  },
  "Aucun anime trouvé": {
    "fr": "Aucun anime trouvé",
    "en": "No anime found"
  },
  "Rien pour «": {
    "fr": "Rien pour «",
    "en": "No results for “"
  },
  "». Essaie le titre romaji ou japonais.": {
    "fr": "». Essaie le titre romaji ou japonais.",
    "en": "”. Try the romaji or Japanese title."
  },
  "Résultats approchants pour «": {
    "fr": "Résultats approchants pour «",
    "en": "Similar results for “"
  },
  "»": {
    "fr": "»",
    "en": "”"
  },
  "Filtres": {
    "fr": "Filtres",
    "en": "Filters"
  },
  "Afficher": {
    "fr": "Afficher",
    "en": "Show"
  },
  "Format": {
    "fr": "Format",
    "en": "Format"
  },
  "Tous": {
    "fr": "Tous",
    "en": "All"
  },
  "Statut": {
    "fr": "Statut",
    "en": "Status"
  },
  "Genre": {
    "fr": "Genre",
    "en": "Genre"
  },
  "Trier par": {
    "fr": "Trier par",
    "en": "Sort by"
  },
  "TMDB": {
    "fr": "TMDB",
    "en": "TMDB"
  },
  "This product uses the TMDB API but is not endorsed or certified by TMDB.": {
    "fr": "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    "en": "This product uses the TMDB API but is not endorsed or certified by TMDB."
  },
  "Images du catalogue TMDB, parfois ajoutées par ses utilisateurs. Droits réservés à leurs titulaires. Utilisation non commerciale.": {
    "fr": "Images du catalogue TMDB, parfois ajoutées par ses utilisateurs. Droits réservés à leurs titulaires. Utilisation non commerciale.",
    "en": "TMDB catalogue images may be added by its users. Rights belong to their holders. Noncommercial use."
  },
  "Correspondances d’épisodes :": {
    "fr": "Correspondances d’épisodes :",
    "en": "Episode mappings:"
  },
  "AniBridge": {
    "fr": "AniBridge",
    "en": "AniBridge"
  },
  "· © 2026 AniBridge · MIT.": {
    "fr": "· © 2026 AniBridge · MIT.",
    "en": "· © 2026 AniBridge · MIT."
  },
  "Sauvegarde restaurée": {
    "fr": "Sauvegarde restaurée",
    "en": "Backup restored"
  },
  "La restauration a échoué rien n'a été modifié.": {
    "fr": "La restauration a échoué rien n'a été modifié.",
    "en": "Restore failed — nothing was changed."
  },
  "Tout est stocké sur cet appareil. Exporte régulièrement une sauvegarde : si les données du navigateur sont effacées, elle permet de tout retrouver.": {
    "fr": "Tout est stocké sur cet appareil. Exporte régulièrement une sauvegarde : si les données du navigateur sont effacées, elle permet de tout retrouver.",
    "en": "Everything is stored on this device. Export a backup regularly: it lets you recover everything if browser data is cleared."
  },
  "Exporter": {
    "fr": "Exporter",
    "en": "Export"
  },
  "Importer": {
    "fr": "Importer",
    "en": "Import"
  },
  "Choisir un fichier de sauvegarde": {
    "fr": "Choisir un fichier de sauvegarde",
    "en": "Choose a backup file"
  },
  "Restaurer cette sauvegarde ?": {
    "fr": "Restaurer cette sauvegarde ?",
    "en": "Restore this backup?"
  },
  "Remplacer mes données": {
    "fr": "Remplacer mes données",
    "en": "Replace my data"
  },
  "Sauvegarde du": {
    "fr": "Sauvegarde du",
    "en": "Backup from"
  },
  "listes": {
    "fr": "listes",
    "en": "lists"
  },
  "anime": {
    "fr": "anime",
    "en": "anime"
  },
  "épisodes vus": {
    "fr": "épisodes vus",
    "en": "watched episodes"
  },
  "entrées d'historique": {
    "fr": "entrées d'historique",
    "en": "history entries"
  },
  "dépôts": {
    "fr": "dépôts",
    "en": "repositories"
  },
  "Les données actuelles de cet appareil seront entièrement remplacées.": {
    "fr": "Les données actuelles de cet appareil seront entièrement remplacées.",
    "en": "Current data on this device will be entirely replaced."
  },
  "détail": {
    "fr": "détail",
    "en": "details"
  },
  "vidéos": {
    "fr": "vidéos",
    "en": "videos"
  },
  "en attente : aucun résultat du lecteur (ouvre l'épisode pour relancer)": {
    "fr": "en attente : aucun résultat du lecteur (ouvre l'épisode pour relancer)",
    "en": "pending: no player result (open the episode to retry)"
  },
  "Bac à sable": {
    "fr": "Bac à sable",
    "en": "Sandbox"
  },
  "Détail épisodes": {
    "fr": "Détail épisodes",
    "en": "Episode details"
  },
  "Résolution vidéo": {
    "fr": "Résolution vidéo",
    "en": "Video resolution"
  },
  "Relais réseau (extension)": {
    "fr": "Relais réseau (extension)",
    "en": "Network relay (extension)"
  },
  "requêtes de l'extension via le serveur": {
    "fr": "requêtes de l'extension via le serveur",
    "en": "extension requests through the server"
  },
  "pas nécessaire": {
    "fr": "pas nécessaire",
    "en": "not needed"
  },
  "Préparation du flux": {
    "fr": "Préparation du flux",
    "en": "Stream preparation"
  },
  "pas nécessaire / pas encore": {
    "fr": "pas nécessaire / pas encore",
    "en": "not needed / not yet"
  },
  "réussi": {
    "fr": "réussi",
    "en": "succeeded"
  },
  "Première image": {
    "fr": "Première image",
    "en": "First frame"
  },
  "Temps de démarrage": {
    "fr": "Temps de démarrage",
    "en": "Startup time"
  },
  "Dernier démarrage": {
    "fr": "Dernier démarrage",
    "en": "Last startup"
  },
  "ép.": {
    "fr": "ép.",
    "en": "ep."
  },
  "Temps jusqu'à la première image": {
    "fr": "Temps jusqu'à la première image",
    "en": "Time to first frame"
  },
  "Qualité déclarée": {
    "fr": "Qualité déclarée",
    "en": "Reported quality"
  },
  "Qualité réelle": {
    "fr": "Qualité réelle",
    "en": "Actual quality"
  },
  "pas encore mesurée": {
    "fr": "pas encore mesurée",
    "en": "not measured yet"
  },
  "Maximum observé": {
    "fr": "Maximum observé",
    "en": "Maximum observed"
  },
  "Précédents :": {
    "fr": "Précédents :",
    "en": "Previous:"
  },
  "ép. {0} {1}": {
    "fr": "ép. {0} {1}",
    "en": "ep. {0} {1}"
  },
  "métadonnées vidéo": {
    "fr": "métadonnées vidéo",
    "en": "video metadata"
  },
  "première image": {
    "fr": "première image",
    "en": "first frame"
  },
  "recherche du français": {
    "fr": "recherche du français",
    "en": "searching for French"
  },
  "voie française": {
    "fr": "voie française",
    "en": "French lane"
  },
  "préparation d'avance": {
    "fr": "préparation d'avance",
    "en": "advance preparation"
  },
  "Chronologie": {
    "fr": "Chronologie",
    "en": "Timeline"
  },
  "Chronologie de cette session": {
    "fr": "Chronologie de cette session",
    "en": "Timeline of this session"
  },
  "+": {
    "fr": "+",
    "en": "+"
  },
  "ms": {
    "fr": "ms",
    "en": "ms"
  },
  "Diagnostic": {
    "fr": "Diagnostic",
    "en": "Diagnostics"
  },
  "Appels aux extensions de cette session. Aucune adresse complète, aucun en-tête ni jeton n'est conservé.": {
    "fr": "Appels aux extensions de cette session. Aucune adresse complète, aucun en-tête ni jeton n'est conservé.",
    "en": "Extension calls in this session. No full address, header or token is retained."
  },
  "Exporter diagnostic": {
    "fr": "Exporter diagnostic",
    "en": "Export diagnostics"
  },
  "Vider": {
    "fr": "Vider",
    "en": "Clear"
  },
  "Rien pour l'instant": {
    "fr": "Rien pour l'instant",
    "en": "Nothing yet"
  },
  "Ouvre un anime avec une source d'extension : chaque appel apparaîtra ici.": {
    "fr": "Ouvre un anime avec une source d'extension : chaque appel apparaîtra ici.",
    "en": "Open an anime with an extension source: each call will appear here."
  },
  "appels": {
    "fr": "appels",
    "en": "calls"
  },
  "requête": {
    "fr": "requête",
    "en": "request"
  },
  "non pris en charge :": {
    "fr": "non pris en charge :",
    "en": "unsupported:"
  },
  "Compte et synchronisation": {
    "fr": "Compte et synchronisation",
    "en": "Account and sync"
  },
  "Couleur d'accent": {
    "fr": "Couleur d'accent",
    "en": "Accent color"
  },
  "Titres": {
    "fr": "Titres",
    "en": "Titles"
  },
  "Langue des titres": {
    "fr": "Langue des titres",
    "en": "Title language"
  },
  "Découverte": {
    "fr": "Découverte",
    "en": "Discovery"
  },
  "Afficher les anime explicites (18+)": {
    "fr": "Afficher les anime explicites (18+)",
    "en": "Show explicit anime (18+)"
  },
  "Lecture": {
    "fr": "Lecture",
    "en": "Playback"
  },
  "Épisode considéré comme vu à": {
    "fr": "Épisode considéré comme vu à",
    "en": "Episode considered watched at"
  },
  "Pour ne pas avoir à regarder le générique de fin.": {
    "fr": "Pour ne pas avoir à regarder le générique de fin.",
    "en": "So you do not have to watch the end credits."
  },
  "Sans piste française, traduit la piste anglaise (« Français (traduit) »). Désactivé : rien n'est envoyé au service de traduction sans ton action.": {
    "fr": "Sans piste française, traduit la piste anglaise (« Français (traduit) »). Désactivé : rien n'est envoyé au service de traduction sans ton action.",
    "en": "Without a French track, translates the English track (French (translated)). When off, nothing is sent to the translation service without your action."
  },
  "Indisponible : aucun service de traduction n'est configuré pour le moment.": {
    "fr": "Indisponible : aucun service de traduction n'est configuré pour le moment.",
    "en": "Unavailable: no translation service is currently configured."
  },
  "Sources de lecture et dépôts": {
    "fr": "Sources de lecture et dépôts",
    "en": "Playback sources and repositories"
  },
  "Sources": {
    "fr": "Sources",
    "en": "Sources"
  },
  "Sauvegarde": {
    "fr": "Sauvegarde",
    "en": "Backup"
  },
  "Développeur": {
    "fr": "Développeur",
    "en": "Developer"
  },
  "Mode développeur": {
    "fr": "Mode développeur",
    "en": "Developer mode"
  },
  "Source de démonstration, diagnostic, détails techniques.": {
    "fr": "Source de démonstration, diagnostic, détails techniques.",
    "en": "Demo source, diagnostics and technical details."
  },
  "Diagnostic des extensions": {
    "fr": "Diagnostic des extensions",
    "en": "Extension diagnostics"
  },
  "Données": {
    "fr": "Données",
    "en": "Data"
  },
  "Effacer l'historique": {
    "fr": "Effacer l'historique",
    "en": "Clear history"
  },
  "Réinitialiser toutes les données": {
    "fr": "Réinitialiser toutes les données",
    "en": "Reset all data"
  },
  "MaximAnim métadonnées AniList": {
    "fr": "MaximAnim métadonnées AniList",
    "en": "MaximAnim — AniList metadata"
  },
  "Version": {
    "fr": "Version",
    "en": "Version"
  },
  "Build": {
    "fr": "Build",
    "en": "Build"
  },
  "Nouvelle version disponible": {
    "fr": "Nouvelle version disponible",
    "en": "New version available"
  },
  "Mise à jour…": {
    "fr": "Mise à jour…",
    "en": "Updating…"
  },
  "Mettre à jour maintenant": {
    "fr": "Mettre à jour maintenant",
    "en": "Update now"
  },
  "Seul le code de l'app change : listes, progression, historique, sources et compte sont conservés.": {
    "fr": "Seul le code de l'app change : listes, progression, historique, sources et compte sont conservés.",
    "en": "Only the app code changes: lists, progress, history, sources and account are preserved."
  },
  "Tu as la dernière version.": {
    "fr": "Tu as la dernière version.",
    "en": "You have the latest version."
  },
  "Vérification impossible (hors ligne ?).": {
    "fr": "Vérification impossible (hors ligne ?).",
    "en": "Unable to check (offline?)."
  },
  "Vérifier les mises à jour": {
    "fr": "Vérifier les mises à jour",
    "en": "Check for updates"
  },
  "Tout réinitialiser ?": {
    "fr": "Tout réinitialiser ?",
    "en": "Reset everything?"
  },
  "Supprimer définitivement": {
    "fr": "Supprimer définitivement",
    "en": "Delete permanently"
  },
  "Listes, progression, historique et réglages seront supprimés de cet appareil. C'est irréversible.": {
    "fr": "Listes, progression, historique et réglages seront supprimés de cet appareil. C'est irréversible.",
    "en": "Lists, progress, history and settings will be deleted from this device. This cannot be undone."
  },
  "Si tu es connecté, tu seras déconnecté : les données de ton compte restent en ligne.": {
    "fr": "Si tu es connecté, tu seras déconnecté : les données de ton compte restent en ligne.",
    "en": "If signed in, you will be signed out: your account data stays online."
  },
  "Pense à exporter une sauvegarde avant.": {
    "fr": "Pense à exporter une sauvegarde avant.",
    "en": "Consider exporting a backup first."
  },
  "Tape": {
    "fr": "Tape",
    "en": "Type"
  },
  "pour confirmer": {
    "fr": "pour confirmer",
    "en": "to confirm"
  },
  "Test annulé": {
    "fr": "Test annulé",
    "en": "Test cancelled"
  },
  "Benchmark des lectures": {
    "fr": "Benchmark des lectures",
    "en": "Playback benchmark"
  },
  " pause après ce test": {
    "fr": " pause après ce test",
    "en": " pause after this test"
  },
  " son coupé, rien n'est enregistré": {
    "fr": " son coupé, rien n'est enregistré",
    "en": " muted, nothing is saved"
  },
  "Pause": {
    "fr": "Pause",
    "en": "Pause"
  },
  "Arrêter": {
    "fr": "Arrêter",
    "en": "Stop"
  },
  "Benchmark en pause": {
    "fr": "Benchmark en pause",
    "en": "Benchmark paused"
  },
  "Disponible une fois qu'une source a trouvé cet épisode.": {
    "fr": "Disponible une fois qu'une source a trouvé cet épisode.",
    "en": "Available once a source has found this episode."
  },
  "Lit chaque source qui a l'épisode, une seule à la fois, son coupé : première image, résolution réelle, sous-titres. Rien n'est ajouté à ta progression.": {
    "fr": "Lit chaque source qui a l'épisode, une seule à la fois, son coupé : première image, résolution réelle, sous-titres. Rien n'est ajouté à ta progression.",
    "en": "Plays each source with this episode, one at a time and muted: first frame, actual resolution, subtitles. Nothing is added to your progress."
  },
  "Quelle entrée de": {
    "fr": "Quelle entrée de",
    "en": "Which entry in"
  },
  "est cet anime ? Ton choix est retenu pour cette source.": {
    "fr": "est cet anime ? Ton choix est retenu pour cette source.",
    "en": "is this anime? Your choice is saved for this source."
  },
  "Chercher dans la source": {
    "fr": "Chercher dans la source",
    "en": "Search the source"
  },
  "recherche dans": {
    "fr": "recherche dans",
    "en": "searching in"
  },
  "…": {
    "fr": "…",
    "en": "…"
  },
  "Aucun résultat dans cette source. Essaie un autre titre.": {
    "fr": "Aucun résultat dans cette source. Essaie un autre titre.",
    "en": "No results in this source. Try another title."
  },
  "Plus de résultats «": {
    "fr": "Plus de résultats «",
    "en": "More results “"
  },
  "Non préparées : {0}.": {
    "fr": "Non préparées : {0}.",
    "en": "Not prepared: {0}."
  },
  "Sources recommandées": {
    "fr": "Sources recommandées",
    "en": "Recommended sources"
  },
  "Activer les sources recommandées": {
    "fr": "Activer les sources recommandées",
    "en": "Enable recommended sources"
  },
  "Autorise les domaines de ces sources pour les essayer depuis le lecteur. Toute nouvelle adresse te sera demandée ici.": {
    "fr": "Autorise les domaines de ces sources pour les essayer depuis le lecteur. Toute nouvelle adresse te sera demandée ici.",
    "en": "Allow these sources’ domains to try them in the player. Any new address will be requested here."
  },
  "Ces extensions demandent accès à :": {
    "fr": "Ces extensions demandent accès à :",
    "en": "These extensions request access to:"
  },
  "Autoriser automatiquement les domaines exacts utilisés uniquement pour les sous-titres par ces sources": {
    "fr": "Autoriser automatiquement les domaines exacts utilisés uniquement pour les sous-titres par ces sources",
    "en": "Automatically allow the exact domains used only for subtitles by these sources"
  },
  "Seulement les adresses de sous-titres qu'une source déjà autorisée renvoie, une par une. Ni vidéo, ni joker. Modifiable source par source.": {
    "fr": "Seulement les adresses de sous-titres qu'une source déjà autorisée renvoie, une par une. Ni vidéo, ni joker. Modifiable source par source.",
    "en": "Only subtitle addresses returned by an already approved source, one at a time. No video or wildcard. Editable per source."
  },
  "Chaque extension ne pourra joindre que les adresses listées sous son nom. Code épinglé par empreinte SHA-256, exécuté isolé, sans accès à tes données. Toute nouvelle adresse te sera demandée.": {
    "fr": "Chaque extension ne pourra joindre que les adresses listées sous son nom. Code épinglé par empreinte SHA-256, exécuté isolé, sans accès à tes données. Toute nouvelle adresse te sera demandée.",
    "en": "Each extension can contact only the addresses listed under its name. Code is SHA-256 pinned and runs in isolation without access to your data. Any new address requires permission."
  },
  "Sources recommandées activées": {
    "fr": "Sources recommandées activées",
    "en": "Recommended sources enabled"
  },
  "{0} activée": {
    "fr": "{0} activée",
    "en": "{0} enabled"
  },
  "Une autorisation est nécessaire": {
    "fr": "Une autorisation est nécessaire",
    "en": "Permission is required"
  },
  "Aucune source ne peut lire cet épisode sans accès réseau supplémentaire.": {
    "fr": "Aucune source ne peut lire cet épisode sans accès réseau supplémentaire.",
    "en": "No source can play this episode without additional network access."
  },
  ": une seule confirmation.": {
    "fr": ": une seule confirmation.",
    "en": ": one confirmation."
  },
  "Examiner": {
    "fr": "Examiner",
    "en": "Review"
  },
  "Autoriser des sources de secours": {
    "fr": "Autoriser des sources de secours",
    "en": "Allow backup sources"
  },
  "Ces sources n'ont pas pu être essayées sans accès à :": {
    "fr": "Ces sources n'ont pas pu être essayées sans accès à :",
    "en": "These sources could not be tried without access to:"
  },
  "La lecture en cours n'est pas touchée : ces sources seront utilisées à partir du prochain épisode. ": {
    "fr": "La lecture en cours n'est pas touchée : ces sources seront utilisées à partir du prochain épisode. ",
    "en": "Current playback is unchanged: these sources will be used from the next episode. "
  },
  "Chaque source ne reçoit que les adresses listées sous son nom, code épinglé et isolé. Rien n'est autorisé sans ton accord.": {
    "fr": "Chaque source ne reçoit que les adresses listées sous son nom, code épinglé et isolé. Rien n'est autorisé sans ton accord.",
    "en": "Each source receives only the addresses under its name, with pinned and isolated code. Nothing is authorized without your consent."
  },
  "Sources autorisées": {
    "fr": "Sources autorisées",
    "en": "Sources authorized"
  },
  "{0} autorisée": {
    "fr": "{0} autorisée",
    "en": "{0} authorized"
  },
  "Accès réseau à autoriser": {
    "fr": "Accès réseau à autoriser",
    "en": "Network access needs permission"
  },
  "{0} ne répond pas": {
    "fr": "{0} ne répond pas",
    "en": "{0} is not responding"
  },
  "Plusieurs entrées de {0} pourraient être « {1} ».": {
    "fr": "Plusieurs entrées de {0} pourraient être « {1} ».",
    "en": "Several entries from {0} could be “{1}”."
  },
  "Le relais de cette version de {0} ne prend pas en charge la lecture invitée. Tu peux essayer une autre source compatible ou te connecter pour utiliser ce relais. Le suivi et les listes restent locaux sans compte.": {
    "fr": "Le relais de cette version de {0} ne prend pas en charge la lecture invitée. Tu peux essayer une autre source compatible ou te connecter pour utiliser ce relais. Le suivi et les listes restent locaux sans compte.",
    "en": "This version of {0} does not support guest relay playback. Try another compatible source or sign in to use its relay. Tracking and lists remain local without an account."
  },
  "voir le diagnostic": {
    "fr": "voir le diagnostic",
    "en": "view diagnostics"
  },
  "Choisir la correspondance": {
    "fr": "Choisir la correspondance",
    "en": "Choose match"
  },
  "Changer de source": {
    "fr": "Changer de source",
    "en": "Change source"
  },
  "À tester": {
    "fr": "À tester",
    "en": "Untested"
  },
  "Déjà actives": {
    "fr": "Déjà actives",
    "en": "Already enabled"
  },
  "Désactivé": {
    "fr": "Désactivé",
    "en": "Disabled"
  },
  "Non installée": {
    "fr": "Non installée",
    "en": "Not installed"
  },
  "Réglages de {0}": {
    "fr": "Réglages de {0}",
    "en": "Settings for {0}"
  },
  "Désactiver {0}": {
    "fr": "Désactiver {0}",
    "en": "Disable {0}"
  },
  "Désactiver": {
    "fr": "Désactiver",
    "en": "Disable"
  },
  "Préparation…": {
    "fr": "Préparation…",
    "en": "Preparing…"
  },
  "Installer les sources recommandées": {
    "fr": "Installer les sources recommandées",
    "en": "Install recommended sources"
  },
  "Nettoyer vers les sources recommandées": {
    "fr": "Nettoyer vers les sources recommandées",
    "en": "Switch to recommended sources"
  },
  "Désactiver les autres": {
    "fr": "Désactiver les autres",
    "en": "Disable others"
  },
  "Conservées": {
    "fr": "Conservées",
    "en": "Preserved"
  },
  "Désactivées": {
    "fr": "Désactivées",
    "en": "Disabled"
  },
  "Rien n'est supprimé : dépôts, correspondances, sources choisies par anime, statistiques et historique du benchmark restent. Tu peux réactiver n'importe quelle source plus tard.": {
    "fr": "Rien n'est supprimé : dépôts, correspondances, sources choisies par anime, statistiques et historique du benchmark restent. Tu peux réactiver n'importe quelle source plus tard.",
    "en": "Nothing is deleted: repositories, matches, anime source choices, statistics and benchmark history remain. You can re-enable any source later."
  },
  "{0} source{1} désactivée{2}": {
    "fr": "{0} source{1} désactivée{2}",
    "en": "{0} sources disabled"
  },
  "Le lien de code déclaré par ce module est indisponible. MaximAnim a utilisé le script fourni avec ce dépôt.": {
    "fr": "Le lien de code déclaré par ce module est indisponible. MaximAnim a utilisé le script fourni avec ce dépôt.",
    "en": "This module’s declared code link is unavailable. MaximAnim used the script provided with this repository."
  },
  "Adresse de sous-titres invalide : rien n'a été autorisé.": {
    "fr": "Adresse de sous-titres invalide : rien n'a été autorisé.",
    "en": "Invalid subtitle address: nothing was authorized."
  },
  "Cette source n'est plus installée.": {
    "fr": "Cette source n'est plus installée.",
    "en": "This source is no longer installed."
  },
  "Autorisation enregistrée sur cet appareil, mais la synchronisation a échoué. Vérifie ta connexion puis réessaie.": {
    "fr": "Autorisation enregistrée sur cet appareil, mais la synchronisation a échoué. Vérifie ta connexion puis réessaie.",
    "en": "Permission saved on this device, but sync failed. Check your connection, then try again."
  },
  "Changer la source de lecture": {
    "fr": "Changer la source de lecture",
    "en": "Change playback source"
  },
  "Source imposée : {0}": {
    "fr": "Source imposée : {0}",
    "en": "Source override: {0}"
  },
  "Revenir au réglage général": {
    "fr": "Revenir au réglage général",
    "en": "Use general preference"
  },
  "Correspondance réinitialisée": {
    "fr": "Correspondance réinitialisée",
    "en": "Match reset"
  },
  "Tester les sources": {
    "fr": "Tester les sources",
    "en": "Test sources"
  },
  "Lecture réussie": {
    "fr": "Lecture réussie",
    "en": "Playback succeeded"
  },
  "Français": {
    "fr": "Français",
    "en": "French"
  },
  "Échecs": {
    "fr": "Échecs",
    "en": "Failures"
  },
  "Installation et autorisations": {
    "fr": "Installation et autorisations",
    "en": "Installation and permissions"
  },
  "installées ·": {
    "fr": "installées ·",
    "en": "installed ·"
  },
  "activées ·": {
    "fr": "activées ·",
    "en": "enabled ·"
  },
  "utilisables par le moteur": {
    "fr": "utilisables par le moteur",
    "en": "usable by the runtime"
  },
  "activée": {
    "fr": "activée",
    "en": "enabled"
  },
  "désactivée": {
    "fr": "désactivée",
    "en": "disabled"
  },
  "{0} hôtes autorisés": {
    "fr": "{0} hôtes autorisés",
    "en": "{0} approved hosts"
  },
  "code épinglé": {
    "fr": "code épinglé",
    "en": "pinned code"
  },
  "code non activé": {
    "fr": "code non activé",
    "en": "code not activated"
  },
  "Une autorisation porte sur des hôtes précis. Une correspondance et un épisode disponible ne prouvent pas la lecture : seule une première image la confirme pour cet épisode.": {
    "fr": "Une autorisation porte sur des hôtes précis. Une correspondance et un épisode disponible ne prouvent pas la lecture : seule une première image la confirme pour cet épisode.",
    "en": "Permission covers specific hosts. A match and an available episode do not prove playback: only a first frame confirms it for that episode."
  },
  "Recherche et liste d'épisodes seulement : aucune vidéo n'est chargée.": {
    "fr": "Recherche et liste d'épisodes seulement : aucune vidéo n'est chargée.",
    "en": "Search and episode list only: no video is loaded."
  },
  "Épisode à vérifier": {
    "fr": "Épisode à vérifier",
    "en": "Episode to verify"
  },
  "Aucune source activée. Active-en une dans Réglages → Sources.": {
    "fr": "Aucune source activée. Active-en une dans Réglages → Sources.",
    "en": "No enabled sources. Enable one in Settings → Sources."
  },
  "Benchmark terminé": {
    "fr": "Benchmark terminé",
    "en": "Benchmark finished"
  },
  "lectures réussies": {
    "fr": "lectures réussies",
    "en": "successful playbacks"
  },
  "Filtrer les sources": {
    "fr": "Filtrer les sources",
    "en": "Filter sources"
  },
  "Aucune source dans ce filtre.": {
    "fr": "Aucune source dans ce filtre.",
    "en": "No sources in this filter."
  },
  "« Compatible » veut seulement dire que MaximAnim sait exécuter le module : le site, la présence de l'anime et la qualité se vérifient ici. Rien n'est désactivé automatiquement.": {
    "fr": "« Compatible » veut seulement dire que MaximAnim sait exécuter le module : le site, la présence de l'anime et la qualité se vérifient ici. Rien n'est désactivé automatiquement.",
    "en": "Compatible only means MaximAnim can run the module: the site, anime availability and quality are verified here. Nothing is disabled automatically."
  },
  "Anime trouvé épisode {0}": {
    "fr": "Anime trouvé épisode {0}",
    "en": "Anime found — episode {0}"
  },
  "test…": {
    "fr": "test…",
    "en": "testing…"
  },
  "Pas encore testée pour cet épisode.": {
    "fr": "Pas encore testée pour cet épisode.",
    "en": "Not tested for this episode yet."
  },
  "Test de lecture annulé": {
    "fr": "Test de lecture annulé",
    "en": "Playback test cancelled"
  },
  "Tester la lecture": {
    "fr": "Tester la lecture",
    "en": "Test playback"
  },
  "Utilisée pour cet anime": {
    "fr": "Utilisée pour cet anime",
    "en": "Used for this anime"
  },
  "Détails": {
    "fr": "Détails",
    "en": "Details"
  },
  "Désactiver {0} ?": {
    "fr": "Désactiver {0} ?",
    "en": "Disable {0}?"
  },
  "Elle ne sera plus proposée ni essayée par Auto. Tu pourras la réactiver dans Réglages → Sources ; ses réglages et correspondances sont gardés.": {
    "fr": "Elle ne sera plus proposée ni essayée par Auto. Tu pourras la réactiver dans Réglages → Sources ; ses réglages et correspondances sont gardés.",
    "en": "It will no longer be offered or tried by Auto. You can re-enable it in Settings → Sources; settings and matches are kept."
  },
  "{0} désactivée": {
    "fr": "{0} désactivée",
    "en": "{0} disabled"
  },
  "{0} proposé{1}{2}": {
    "fr": "{0} proposé{1}{2}",
    "en": "{0} offered{1}{2}"
  },
  "Version vidéo": {
    "fr": "Version vidéo",
    "en": "Video version"
  },
  "non indiquée": {
    "fr": "non indiquée",
    "en": "not specified"
  },
  "Pistes CC séparées": {
    "fr": "Pistes CC séparées",
    "en": "Separate CC tracks"
  },
  "aucune piste séparée": {
    "fr": "aucune piste séparée",
    "en": "no separate tracks"
  },
  "{0} observé{1}{2}": {
    "fr": "{0} observé{1}{2}",
    "en": "{0} observed{1}{2}"
  },
  " {0} annoncé": {
    "fr": " {0} annoncé",
    "en": " {0} reported"
  },
  "{0} annoncé, non mesuré": {
    "fr": "{0} annoncé, non mesuré",
    "en": "{0} reported, not measured"
  },
  "épisodes {0}": {
    "fr": "épisodes {0}",
    "en": "episodes {0}"
  },
  "Refaire le test de lecture": {
    "fr": "Refaire le test de lecture",
    "en": "Repeat playback test"
  },
  "Désactiver cette source": {
    "fr": "Désactiver cette source",
    "en": "Disable this source"
  },
  "{0} aucune piste CC séparée": {
    "fr": "{0} aucune piste CC séparée",
    "en": "{0} no separate CC track"
  },
  "Épisode trouvé": {
    "fr": "Épisode trouvé",
    "en": "Episode found"
  },
  "Flux proposés": {
    "fr": "Flux proposés",
    "en": "Streams offered"
  },
  "Résolution décodée": {
    "fr": "Résolution décodée",
    "en": "Decoded resolution"
  },
  "Test de lecture": {
    "fr": "Test de lecture",
    "en": "Playback test"
  },
  "En cours… le résultat s'affiche dès la première image.": {
    "fr": "En cours… le résultat s'affiche dès la première image.",
    "en": "In progress… result appears on the first frame."
  },
  "Lecture impossible": {
    "fr": "Lecture impossible",
    "en": "Unable to play"
  },
  "Sous-titres : pas encore de résultat": {
    "fr": "Sous-titres : pas encore de résultat",
    "en": "Subtitles: no result yet"
  },
  "Pistes de sous-titres": {
    "fr": "Pistes de sous-titres",
    "en": "Subtitle tracks"
  },
  "Annoncé": {
    "fr": "Annoncé",
    "en": "Reported"
  },
  ", décodé": {
    "fr": ", décodé",
    "en": ", decoded"
  },
  ".": {
    "fr": ".",
    "en": "."
  },
  "Retour au test des sources": {
    "fr": "Retour au test des sources",
    "en": "Back to source tests"
  },
  "Réglages {0}": {
    "fr": "Réglages {0}",
    "en": "Settings {0}"
  },
  "chargement de l'extension…": {
    "fr": "chargement de l'extension…",
    "en": "loading extension…"
  },
  "Cette extension n'a pas de réglages.": {
    "fr": "Cette extension n'a pas de réglages.",
    "en": "This extension has no settings."
  },
  "Autoriser les hôtes de sous-titres": {
    "fr": "Autoriser les hôtes de sous-titres",
    "en": "Allow subtitle hosts"
  },
  "Chaque adresse de sous-titres renvoyée par": {
    "fr": "Chaque adresse de sous-titres renvoyée par",
    "en": "Every subtitle address returned by"
  },
  "est approuvée telle quelle, sans redemander. Ni vidéo, ni catalogue, ni autre source.": {
    "fr": "est approuvée telle quelle, sans redemander. Ni vidéo, ni catalogue, ni autre source.",
    "en": "is approved as given, without asking again. No video, catalogue or other source."
  },
  "Autoriser automatiquement les hôtes de sous-titres de {0}": {
    "fr": "Autoriser automatiquement les hôtes de sous-titres de {0}",
    "en": "Automatically allow subtitle hosts for {0}"
  },
  "Réglage impossible": {
    "fr": "Réglage impossible",
    "en": "Unable to change setting"
  },
  "Sur cet appareil": {
    "fr": "Sur cet appareil",
    "en": "On this device"
  },
  "Jamais testée": {
    "fr": "Jamais testée",
    "en": "Never tested"
  },
  "Statistiques de {0} réinitialisées": {
    "fr": "Statistiques de {0} réinitialisées",
    "en": "Statistics for {0} reset"
  },
  "Réinitialiser les statistiques": {
    "fr": "Réinitialiser les statistiques",
    "en": "Reset statistics"
  },
  "Cette extension demande accès à :": {
    "fr": "Cette extension demande accès à :",
    "en": "This extension requests access to:"
  },
  "Cette extension ne déclare aucun accès réseau.": {
    "fr": "Cette extension ne déclare aucun accès réseau.",
    "en": "This extension declares no network access."
  },
  "Aucun accès réseau déclaré": {
    "fr": "Aucun accès réseau déclaré",
    "en": "No network access declared"
  },
  "Son code s'exécute isolé, sans accès à tes données. Il ne pourra joindre que ces adresses ; toute nouvelle adresse te sera demandée.": {
    "fr": "Son code s'exécute isolé, sans accès à tes données. Il ne pourra joindre que ces adresses ; toute nouvelle adresse te sera demandée.",
    "en": "Its code runs in isolation, without access to your data. It can contact only these addresses; any new address requires permission."
  },
  "Par défaut": {
    "fr": "Par défaut",
    "en": "Default"
  },
  "Préférence de source": {
    "fr": "Préférence de source",
    "en": "Source preference"
  },
  "Dépannage": {
    "fr": "Dépannage",
    "en": "Troubleshooting"
  },
  "Source de lecture": {
    "fr": "Source de lecture",
    "en": "Playback source"
  },
  "Quand plusieurs sources existent, laquelle MaximAnim essaie en premier. La source qui lit déjà ne change pas en cours d'épisode.": {
    "fr": "Quand plusieurs sources existent, laquelle MaximAnim essaie en premier. La source qui lit déjà ne change pas en cours d'épisode.",
    "en": "Which source MaximAnim tries first when several exist. A playing source does not change during an episode."
  },
  "Français préféré": {
    "fr": "Français préféré",
    "en": "French preferred"
  },
  "Anglais préféré": {
    "fr": "Anglais préféré",
    "en": "English preferred"
  },
  "Qualité d'abord": {
    "fr": "Qualité d'abord",
    "en": "Quality first"
  },
  "Lecture actuelle": {
    "fr": "Lecture actuelle",
    "en": "Current playback"
  },
  "Autres sources": {
    "fr": "Autres sources",
    "en": "Other sources"
  },
  "Autres sources · Avancé": {
    "fr": "Autres sources · Avancé",
    "en": "Other sources · Advanced"
  },
  "Écartée": {
    "fr": "Écartée",
    "en": "Excluded"
  },
  "Réessayer {0}": {
    "fr": "Réessayer {0}",
    "en": "Retry {0}"
  },
  "Autorisation requise": {
    "fr": "Autorisation requise",
    "en": "Permission required"
  },
  "Activée · lecture à vérifier": {
    "fr": "Activée · lecture à vérifier",
    "en": "Enabled · playback to verify"
  },
  "Aucune autre source n'est activée.": {
    "fr": "Aucune autre source n'est activée.",
    "en": "No other source is enabled."
  },
  "Revenir au choix automatique": {
    "fr": "Revenir au choix automatique",
    "en": "Return to automatic choice"
  },
  "Préférence": {
    "fr": "Préférence",
    "en": "Preference"
  },
  "Détails du choix": {
    "fr": "Détails du choix",
    "en": "Choice details"
  },
  "Flux": {
    "fr": "Flux",
    "en": "Stream"
  },
  "Correspondance dans": {
    "fr": "Correspondance dans",
    "en": "Match in"
  },
  "Tester les sources (Source Lab)": {
    "fr": "Tester les sources (Source Lab)",
    "en": "Test sources (Source Lab)"
  },
  "Gérer les sources": {
    "fr": "Gérer les sources",
    "en": "Manage sources"
  },
  "Activer les sources de lecture": {
    "fr": "Activer les sources de lecture",
    "en": "Enable playback sources"
  },
  "La lecture utilise des sources externes. Autorise leurs domaines ici, une fois sur cet appareil. Toute nouvelle adresse sera demandée séparément.": {
    "fr": "La lecture utilise des sources externes. Autorise leurs domaines ici, une fois sur cet appareil. Toute nouvelle adresse sera demandée séparément.",
    "en": "Playback uses external sources. Allow their domains here once on this device. Every new address requires separate permission."
  },
  "Comment MaximAnim choisit où lire, et les sources qu'il utilise.": {
    "fr": "Comment MaximAnim choisit où lire, et les sources qu'il utilise.",
    "en": "How MaximAnim chooses where to play and which sources it uses."
  },
  "Avancé": {
    "fr": "Avancé",
    "en": "Advanced"
  },
  "{0} autres {1} dépôt{2}": {
    "fr": "{0} autres {1} dépôt{2}",
    "en": "{0} others {1} repositories"
  },
  "Dépôts / import manuel": {
    "fr": "Dépôts / import manuel",
    "en": "Repositories / manual import"
  },
  "Ajouter un dépôt": {
    "fr": "Ajouter un dépôt",
    "en": "Add repository"
  },
  "Un français fiable et lisible passe devant un anglais un peu meilleur, jamais devant une source qui échoue.": {
    "fr": "Un français fiable et lisible passe devant un anglais un peu meilleur, jamais devant une source qui échoue.",
    "en": "Reliable, readable French ranks above slightly better English, never above a failing source."
  },
  "Un anglais fiable et lisible passe devant un français un peu meilleur, jamais devant une source qui échoue.": {
    "fr": "Un anglais fiable et lisible passe devant un français un peu meilleur, jamais devant une source qui échoue.",
    "en": "Reliable, readable English ranks above slightly better French, never above a failing source."
  },
  "La langue est ignorée : fiabilité, qualité décodée et vitesse, mesurées sur cet appareil.": {
    "fr": "La langue est ignorée : fiabilité, qualité décodée et vitesse, mesurées sur cet appareil.",
    "en": "Language is ignored: reliability, decoded quality and speed measured on this device."
  },
  "Lecture automatique": {
    "fr": "Lecture automatique",
    "en": "Automatic playback"
  },
  "Aucune source de lecture disponible. Active une source compatible ci-dessous.": {
    "fr": "Aucune source de lecture disponible. Active une source compatible ci-dessous.",
    "en": "No playback source available. Enable a compatible source below."
  },
  "Une source précise se choisit par anime, avec « Autre source… ».": {
    "fr": "Une source précise se choisit par anime, avec « Autre source… ».",
    "en": "Choose a specific source per anime with Other source…"
  },
  "source": {
    "fr": "source",
    "en": "source"
  },
  "Retirer ce dépôt ?": {
    "fr": "Retirer ce dépôt ?",
    "en": "Remove this repository?"
  },
  "{0} et ses {1} sources seront retirés. Ta progression n'est pas touchée.": {
    "fr": "{0} et ses {1} sources seront retirés. Ta progression n'est pas touchée.",
    "en": "{0} and its {1} sources will be removed. Your progress is preserved."
  },
  "Sources importées": {
    "fr": "Sources importées",
    "en": "Imported sources"
  },
  "actives /": {
    "fr": "actives /",
    "en": "enabled /"
  },
  "utilisables": {
    "fr": "utilisables",
    "en": "usable"
  },
  "Aucune source": {
    "fr": "Aucune source",
    "en": "No source"
  },
  "Ajoute un dépôt : ses sources d'anime apparaîtront ici.": {
    "fr": "Ajoute un dépôt : ses sources d'anime apparaîtront ici.",
    "en": "Add a repository: its anime sources will appear here."
  },
  "Filtrer par nom ou langue": {
    "fr": "Filtrer par nom ou langue",
    "en": "Filter by name or language"
  },
  "Ces extensions sont faites pour des apps natives (Dart, APK, CloudStream) : la version Web ne peut pas les exécuter.": {
    "fr": "Ces extensions sont faites pour des apps natives (Dart, APK, CloudStream) : la version Web ne peut pas les exécuter.",
    "en": "These extensions are built for native apps (Dart, APK, CloudStream): the Web version cannot run them."
  },
  "Dépôt": {
    "fr": "Dépôt",
    "en": "Repository"
  },
  "Autres sources du dépôt": {
    "fr": "Autres sources du dépôt",
    "en": "Other sources in the repository"
  },
  "Cette source a besoin du relais sécurisé.": {
    "fr": "Cette source a besoin du relais sécurisé.",
    "en": "This source needs the secure relay."
  },
  "Capacité non supportée": {
    "fr": "Capacité non supportée",
    "en": "Unsupported capability"
  },
  "Prête": {
    "fr": "Prête",
    "en": "Ready"
  },
  "18+": {
    "fr": "18+",
    "en": "18+"
  },
  "mis à jour": {
    "fr": "mis à jour",
    "en": "updated"
  },
  "Source FR à essayer annonce": {
    "fr": "Source FR à essayer annonce",
    "en": "French source to try — reports"
  },
  "accès": {
    "fr": "accès",
    "en": "access"
  },
  "Mise à jour v": {
    "fr": "Mise à jour v",
    "en": "Update v"
  },
  ": nouvel accès réseau demandé": {
    "fr": ": nouvel accès réseau demandé",
    "en": ": new network access requested"
  },
  "Autoriser la mise à jour": {
    "fr": "Autoriser la mise à jour",
    "en": "Allow update"
  },
  "{0} mise à jour": {
    "fr": "{0} mise à jour",
    "en": "{0} updated"
  },
  "Dépôts recommandés": {
    "fr": "Dépôts recommandés",
    "en": "Recommended repositories"
  },
  "Sources FR à essayer": {
    "fr": "Sources FR à essayer",
    "en": "French sources to try"
  },
  "Modules Sora d'anime en français, à tester : aucun n'est garanti. La qualité indiquée est celle qu'ils annoncent ; le classement ne retient que ce qui a vraiment été lu ici. Sur une fiche d'anime, « Tester les sources » dit lesquels la trouvent.": {
    "fr": "Modules Sora d'anime en français, à tester : aucun n'est garanti. La qualité indiquée est celle qu'ils annoncent ; le classement ne retient que ce qui a vraiment été lu ici. Sur une fiche d'anime, « Tester les sources » dit lesquels la trouvent.",
    "en": "French anime Sora modules to test: none is guaranteed. Reported quality comes from the source; ranking uses only playback actually observed here. Test sources on an anime’s details shows which sources find it."
  },
  "Adresse copiée": {
    "fr": "Adresse copiée",
    "en": "Address copied"
  },
  "Copier": {
    "fr": "Copier",
    "en": "Copy"
  },
  "Ajouté": {
    "fr": "Ajouté",
    "en": "Added"
  },
  "Adresse du dépôt": {
    "fr": "Adresse du dépôt",
    "en": "Repository address"
  },
  "• Un dépôt GitHub : github.com/propriétaire/dépôt": {
    "fr": "• Un dépôt GitHub : github.com/propriétaire/dépôt",
    "en": "• A GitHub repository: github.com/owner/repository"
  },
  "• Un catalogue direct : …/anime_index.json, un index Sora modules.json ou un module Sora .json (raw.githubusercontent.com, github.io, pages.dev)": {
    "fr": "• Un catalogue direct : …/anime_index.json, un index Sora modules.json ou un module Sora .json (raw.githubusercontent.com, github.io, pages.dev)",
    "en": "• A direct catalogue: …/anime_index.json, a Sora modules.json index or Sora .json module (raw.githubusercontent.com, github.io, pages.dev)"
  },
  "• Seules les sources d'anime sont importées ; manga et novels sont ignorés. Aucun code n'est exécuté à l'import.": {
    "fr": "• Seules les sources d'anime sont importées ; manga et novels sont ignorés. Aucun code n'est exécuté à l'import.",
    "en": "• Only anime sources are imported; manga and novels are ignored. No code runs during import."
  },
  "française": {
    "fr": "française",
    "en": "French"
  },
  "Sous-titres bloqués : adresse non autorisée": {
    "fr": "Sous-titres bloqués : adresse non autorisée",
    "en": "Subtitles blocked: address not approved"
  },
  "Sous-titres disponibles": {
    "fr": "Sous-titres disponibles",
    "en": "Subtitles available"
  },
  "fournit": {
    "fr": "fournit",
    "en": "provides"
  },
  ", à autoriser.": {
    "fr": ", à autoriser.",
    "en": ", awaiting permission."
  },
  ", mais": {
    "fr": ", mais",
    "en": ", but"
  },
  "elles sont hébergées": {
    "fr": "elles sont hébergées",
    "en": "they are hosted"
  },
  "elle est hébergée": {
    "fr": "elle est hébergée",
    "en": "it is hosted"
  },
  "sur une adresse que cette source n'est pas encore autorisée à utiliser.": {
    "fr": "sur une adresse que cette source n'est pas encore autorisée à utiliser.",
    "en": "at an address this source is not authorized to use yet."
  },
  "Toujours autoriser les hôtes de sous-titres de": {
    "fr": "Toujours autoriser les hôtes de sous-titres de",
    "en": "Always allow subtitle hosts for"
  },
  "Uniquement les adresses de sous-titres que": {
    "fr": "Uniquement les adresses de sous-titres que",
    "en": "Only subtitle addresses that"
  },
  "renvoie, une par une. Modifiable dans les réglages de la source.": {
    "fr": "renvoie, une par une. Modifiable dans les réglages de la source.",
    "en": "returns, one at a time. Editable in the source’s settings."
  },
  "Toujours autoriser les hôtes de sous-titres de {0}": {
    "fr": "Toujours autoriser les hôtes de sous-titres de {0}",
    "en": "Always allow subtitle hosts for {0}"
  },
  "Ces adresses seront ajoutées telles quelles.": {
    "fr": "Ces adresses seront ajoutées telles quelles.",
    "en": "These addresses will be added exactly as given."
  },
  "Seule cette adresse est ajoutée, pour ": {
    "fr": "Seule cette adresse est ajoutée, pour ",
    "en": "Only this address is added, for "
  },
  "La vidéo continue pendant ce temps.": {
    "fr": "La vidéo continue pendant ce temps.",
    "en": "Video keeps playing meanwhile."
  },
  "AniList ne liste aucun crédit pour cet anime.": {
    "fr": "AniList ne liste aucun crédit pour cet anime.",
    "en": "AniList lists no credits for this anime."
  },
  "Personne n'est crédité sur ce critère parmi le staff chargé.": {
    "fr": "Personne n'est crédité sur ce critère parmi le staff chargé.",
    "en": "No loaded staff member matches this filter."
  },
  "Afficher la suite du staff": {
    "fr": "Afficher la suite du staff",
    "en": "Load more staff"
  },
  "Fonction non précisée par AniList.": {
    "fr": "Fonction non précisée par AniList.",
    "en": "Role not specified by AniList."
  },
  "Société de production": {
    "fr": "Société de production",
    "en": "Production company"
  },
  "Logo officiel MADHOUSE": {
    "fr": "Logo officiel MADHOUSE",
    "en": "Official MADHOUSE logo"
  },
  "Crédits principaux": {
    "fr": "Crédits principaux",
    "en": "Main credits"
  },
  "Autres participations": {
    "fr": "Autres participations",
    "en": "Other contributions"
  },
  "Studio secondaire.": {
    "fr": "Studio secondaire.",
    "en": "Secondary studio."
  },
  "Aucune participation secondaire répertoriée.": {
    "fr": "Aucune participation secondaire répertoriée.",
    "en": "No secondary contribution listed."
  },
  "AniList ne répond pas.": {
    "fr": "AniList ne répond pas.",
    "en": "AniList is not responding."
  },
  "Aucune œuvre ne correspond à ce filtre parmi celles chargées.": {
    "fr": "Aucune œuvre ne correspond à ce filtre parmi celles chargées.",
    "en": "No loaded work matches this filter."
  },
  "Aucune nouvelle œuvre dans les pages consultées.": {
    "fr": "Aucune nouvelle œuvre dans les pages consultées.",
    "en": "No new works in the pages checked."
  },
  "Fonction non précisée par AniList": {
    "fr": "Fonction non précisée par AniList",
    "en": "Role not specified by AniList"
  },
  "Cette œuvre": {
    "fr": "Cette œuvre",
    "en": "This work"
  },
  "Type": {
    "fr": "Type",
    "en": "Type"
  },
  "Pays": {
    "fr": "Pays",
    "en": "Country"
  },
  "Publication": {
    "fr": "Publication",
    "en": "Publication"
  },
  "Volumes": {
    "fr": "Volumes",
    "en": "Volumes"
  },
  "Non renseigné": {
    "fr": "Non renseigné",
    "en": "Not specified"
  },
  "Chapitres": {
    "fr": "Chapitres",
    "en": "Chapters"
  },
  "Adaptations animées": {
    "fr": "Adaptations animées",
    "en": "Anime adaptations"
  },
  "Prévision AniList ép. {0} {1} à confirmer": {
    "fr": "Prévision AniList ép. {0} {1} à confirmer",
    "en": "AniList forecast — ep. {0} {1}, to confirm"
  },
  "En pause, reprise non annoncée": {
    "fr": "En pause, reprise non annoncée",
    "en": "On hiatus — return not announced"
  },
  "Prochaine diffusion non annoncée": {
    "fr": "Prochaine diffusion non annoncée",
    "en": "Next airing not announced"
  },
  "AniList limite temporairement les requêtes.": {
    "fr": "AniList limite temporairement les requêtes.",
    "en": "AniList is temporarily limiting requests."
  },
  "Réponse AniList illisible.": {
    "fr": "Réponse AniList illisible.",
    "en": "Unreadable AniList response."
  },
  "Réponse AniList inattendue.": {
    "fr": "Réponse AniList inattendue.",
    "en": "Unexpected AniList response."
  },
  "Données AniList inattendues.": {
    "fr": "Données AniList inattendues.",
    "en": "Unexpected AniList data."
  },
  "Épisode 23β · branche alternative": {
    "fr": "Épisode 23β · branche alternative",
    "en": "Episode 23β · alternative branch"
  },
  "Préquelle": {
    "fr": "Préquelle",
    "en": "Prequel"
  },
  "Histoire parallèle": {
    "fr": "Histoire parallèle",
    "en": "Side story"
  },
  "Œuvre liée": {
    "fr": "Œuvre liée",
    "en": "Related work"
  },
  "Comédie": {
    "fr": "Comédie",
    "en": "Comedy"
  },
  "Mystère": {
    "fr": "Mystère",
    "en": "Mystery"
  },
  "École": {
    "fr": "École",
    "en": "School"
  },
  "Héroïne": {
    "fr": "Héroïne",
    "en": "Female protagonist"
  },
  "Héros": {
    "fr": "Héros",
    "en": "Male protagonist"
  },
  "Surtout des personnages féminins": {
    "fr": "Surtout des personnages féminins",
    "en": "Primarily female cast"
  },
  "Passage à l'âge adulte": {
    "fr": "Passage à l'âge adulte",
    "en": "Coming of age"
  },
  "Antihéros": {
    "fr": "Antihéros",
    "en": "Antihero"
  },
  "Combats à l'épée": {
    "fr": "Combats à l'épée",
    "en": "Sword fighting"
  },
  "Réincarnation": {
    "fr": "Réincarnation",
    "en": "Reincarnation"
  },
  "Tragédie": {
    "fr": "Tragédie",
    "en": "Tragedy"
  },
  "Enquête": {
    "fr": "Enquête",
    "en": "Investigation"
  },
  "Super-héros": {
    "fr": "Super-héros",
    "en": "Superhero"
  },
  "Démons": {
    "fr": "Démons",
    "en": "Demons"
  },
  "Médecine": {
    "fr": "Médecine",
    "en": "Medicine"
  },
  "Samouraïs": {
    "fr": "Samouraïs",
    "en": "Samurai"
  },
  "Wikipédia": {
    "fr": "Wikipédia",
    "en": "Wikipedia"
  },
  "ép. {0}": {
    "fr": "ép. {0}",
    "en": "ep. {0}"
  },
  "à partir de l'ép. {0}": {
    "fr": "à partir de l'ép. {0}",
    "en": "from ep. {0}"
  },
  " (liste incomplète chez AniList)": {
    "fr": " (liste incomplète chez AniList)",
    "en": " (incomplete AniList list)"
  },
  "Réalisation": {
    "fr": "Réalisation",
    "en": "Direction"
  },
  "Réalisation en chef": {
    "fr": "Réalisation en chef",
    "en": "Chief direction"
  },
  "Réalisation de la série": {
    "fr": "Réalisation de la série",
    "en": "Series direction"
  },
  "Assistant réalisateur": {
    "fr": "Assistant réalisateur",
    "en": "Assistant director"
  },
  "Réalisation d'épisode": {
    "fr": "Réalisation d'épisode",
    "en": "Episode direction"
  },
  "Assistant réalisation d'épisode": {
    "fr": "Assistant réalisation d'épisode",
    "en": "Assistant episode direction"
  },
  "Réalisation d'unité": {
    "fr": "Réalisation d'unité",
    "en": "Unit direction"
  },
  "Réalisation des scènes d'action": {
    "fr": "Réalisation des scènes d'action",
    "en": "Action direction"
  },
  "Composition de la série": {
    "fr": "Composition de la série",
    "en": "Series composition"
  },
  "Scénario": {
    "fr": "Scénario",
    "en": "Script"
  },
  "Création originale": {
    "fr": "Création originale",
    "en": "Original creator"
  },
  "Animation clé": {
    "fr": "Animation clé",
    "en": "Key animation"
  },
  "Animation clé (2nd)": {
    "fr": "Animation clé (2nd)",
    "en": "2nd key animation"
  },
  "Design mécanique": {
    "fr": "Design mécanique",
    "en": "Mechanical design"
  },
  "Direction de l'animation mécanique": {
    "fr": "Direction de l'animation mécanique",
    "en": "Mechanical animation direction"
  },
  "Design des créatures": {
    "fr": "Design des créatures",
    "en": "Creature design"
  },
  "Design des décors": {
    "fr": "Design des décors",
    "en": "Setting design"
  },
  "Décors": {
    "fr": "Décors",
    "en": "Background art"
  },
  "Couleurs clés": {
    "fr": "Couleurs clés",
    "en": "Color key artist"
  },
  "Interprète du générique": {
    "fr": "Interprète du générique",
    "en": "Theme song performance"
  },
  "Composition du générique": {
    "fr": "Composition du générique",
    "en": "Theme song composition"
  },
  "Arrangement du générique": {
    "fr": "Arrangement du générique",
    "en": "Theme song arrangement"
  },
  "Paroles du générique": {
    "fr": "Paroles du générique",
    "en": "Theme song lyrics"
  },
  "Interprète d'une chanson d'insertion": {
    "fr": "Interprète d'une chanson d'insertion",
    "en": "Insert song performance"
  },
  "Producteur exécutif": {
    "fr": "Producteur exécutif",
    "en": "Executive producer"
  },
  "Producteur associé": {
    "fr": "Producteur associé",
    "en": "Associate producer"
  },
  "Réalisateur": {
    "fr": "Réalisateur",
    "en": "Director"
  },
  "Scénariste": {
    "fr": "Scénariste",
    "en": "Screenwriter"
  },
  "Scénario et dessin": {
    "fr": "Scénario et dessin",
    "en": "Story and art"
  },
  "à partir du {0} {1}": {
    "fr": "à partir du {0} {1}",
    "en": "from {0} {1}"
  },
  "Storyboard / réalisation": {
    "fr": "Storyboard / réalisation",
    "en": "Storyboard / direction"
  },
  "Cette sauvegarde vient d'une version plus récente de l'app.": {
    "fr": "Cette sauvegarde vient d'une version plus récente de l'app.",
    "en": "This backup was created by a newer version of the app."
  },
  "Sauvegarde invalide (source sans dépôt).": {
    "fr": "Sauvegarde invalide (source sans dépôt).",
    "en": "Invalid backup (source without repository)."
  },
  "Participation · fonction non précisée": {
    "fr": "Participation · fonction non précisée",
    "en": "Contribution · role unspecified"
  },
  "Plus récent": {
    "fr": "Plus récent",
    "en": "Newest"
  },
  "Trop de demandes : réessaie dans quelques minutes.": {
    "fr": "Trop de demandes : réessaie dans quelques minutes.",
    "en": "Too many requests: try again in a few minutes."
  },
  "Cette adresse ne peut pas recevoir d'e-mail de connexion sur ce déploiement.": {
    "fr": "Cette adresse ne peut pas recevoir d'e-mail de connexion sur ce déploiement.",
    "en": "This address cannot receive a sign-in email on this deployment."
  },
  "Colle le lien reçu par e-mail, ou tape le code.": {
    "fr": "Colle le lien reçu par e-mail, ou tape le code.",
    "en": "Paste the emailed link, or enter the code."
  },
  "Code invalide ou expiré.": {
    "fr": "Code invalide ou expiré.",
    "en": "Invalid or expired code."
  },
  "Lien ou code expiré ou déjà utilisé : demande un nouvel e-mail.": {
    "fr": "Lien ou code expiré ou déjà utilisé : demande un nouvel e-mail.",
    "en": "Expired or already used link or code: request a new email."
  },
  "Donne un nom à la liste.": {
    "fr": "Donne un nom à la liste.",
    "en": "Give the list a name."
  },
  "{0} caractères maximum.": {
    "fr": "{0} caractères maximum.",
    "en": "{0} characters maximum."
  },
  "Redirection du code vers un hôte non autorisé.": {
    "fr": "Redirection du code vers un hôte non autorisé.",
    "en": "Code redirected to an unapproved host."
  },
  "Code hébergé sur un hôte non pris en charge : {0}": {
    "fr": "Code hébergé sur un hôte non pris en charge : {0}",
    "en": "Code hosted on an unsupported host: {0}"
  },
  "Cette source n'a pas encore été activée.": {
    "fr": "Cette source n'a pas encore été activée.",
    "en": "This source has not been enabled yet."
  },
  "terminé": {
    "fr": "terminé",
    "en": "completed"
  },
  "Cette source demande l'accès à : {0}": {
    "fr": "Cette source demande l'accès à : {0}",
    "en": "This source requests access to: {0}"
  },
  "Cette source doit passer par le relais réseau de Maximanim : connecte-toi pour l'utiliser.": {
    "fr": "Cette source doit passer par le relais réseau de Maximanim : connecte-toi pour l'utiliser.",
    "en": "This source needs MaximAnim’s network relay: sign in to use it."
  },
  "La source met trop de temps à répondre.": {
    "fr": "La source met trop de temps à répondre.",
    "en": "The source is taking too long to respond."
  },
  "L'extension a planté.": {
    "fr": "L'extension a planté.",
    "en": "The extension crashed."
  },
  "La source a renvoyé un flux incompatible avec ce navigateur.": {
    "fr": "La source a renvoyé un flux incompatible avec ce navigateur.",
    "en": "The source returned a stream incompatible with this browser."
  },
  "Le code de l'extension n'a pas pu être récupéré.": {
    "fr": "Le code de l'extension n'a pas pu être récupéré.",
    "en": "Unable to retrieve the extension code."
  },
  "La source a renvoyé une réponse inutilisable.": {
    "fr": "La source a renvoyé une réponse inutilisable.",
    "en": "The source returned an unusable response."
  },
  "La source ne répond pas.": {
    "fr": "La source ne répond pas.",
    "en": "The source is not responding."
  },
  "Réponse trop volumineuse.": {
    "fr": "Réponse trop volumineuse.",
    "en": "Response too large."
  },
  "Redirection vers {0} non autorisée.": {
    "fr": "Redirection vers {0} non autorisée.",
    "en": "Redirect to {0} not authorized."
  },
  "Cette source ne prend pas en charge le relais invité. Une connexion MaximAnim est requise pour son relais.": {
    "fr": "Cette source ne prend pas en charge le relais invité. Une connexion MaximAnim est requise pour son relais.",
    "en": "This source does not support guest relay playback. A MaximAnim account is required for its relay."
  },
  "Réponse du relais invalide.": {
    "fr": "Réponse du relais invalide.",
    "en": "Invalid relay response."
  },
  "Accès à {0} non autorisé.": {
    "fr": "Accès à {0} non autorisé.",
    "en": "Access to {0} not authorized."
  },
  "Session expirée : reconnecte-toi.": {
    "fr": "Session expirée : reconnecte-toi.",
    "en": "Session expired: sign in again."
  },
  "Le relais réseau n'est pas configuré sur ce serveur.": {
    "fr": "Le relais réseau n'est pas configuré sur ce serveur.",
    "en": "The network relay is not configured on this server."
  },
  "Trop de requêtes pour une seule action.": {
    "fr": "Trop de requêtes pour une seule action.",
    "en": "Too many requests for a single action."
  },
  "Méthode refusée : {0}": {
    "fr": "Méthode refusée : {0}",
    "en": "Method refused: {0}"
  },
  "Corps de requête trop volumineux.": {
    "fr": "Corps de requête trop volumineux.",
    "en": "Request body too large."
  },
  "{0} refuse les requêtes du navigateur.": {
    "fr": "{0} refuse les requêtes du navigateur.",
    "en": "{0} refuses browser requests."
  },
  "Bac à sable fermé.": {
    "fr": "Bac à sable fermé.",
    "en": "Sandbox closed."
  },
  "L'extension n'a pas répondu en {0} s.": {
    "fr": "L'extension n'a pas répondu en {0} s.",
    "en": "The extension did not respond within {0} s."
  },
  "Le bac à sable n'a pas démarré.": {
    "fr": "Le bac à sable n'a pas démarré.",
    "en": "The sandbox did not start."
  },
  "Format d'extension non exécutable dans la version Web.": {
    "fr": "Format d'extension non exécutable dans la version Web.",
    "en": "Extension format cannot run in the Web version."
  },
  "Cette source n'est pas activée.": {
    "fr": "Cette source n'est pas activée.",
    "en": "This source is not enabled."
  },
  "exact vérifié": {
    "fr": "exact vérifié",
    "en": "exact match verified"
  },
  "vérifié (épisodes)": {
    "fr": "vérifié (épisodes)",
    "en": "verified (episodes)"
  },
  "Résultat de recherche": {
    "fr": "Résultat de recherche",
    "en": "Search result"
  },
  "Liste d'épisodes": {
    "fr": "Liste d'épisodes",
    "en": "Episode list"
  },
  "Liste de vidéos": {
    "fr": "Liste de vidéos",
    "en": "Video list"
  },
  "{0} non sécurisé": {
    "fr": "{0} non sécurisé",
    "en": "{0} insecure"
  },
  "pistes audio séparées": {
    "fr": "pistes audio séparées",
    "en": "separate audio tracks"
  },
  "appel sans les en-têtes demandés (relais requis)": {
    "fr": "appel sans les en-têtes demandés (relais requis)",
    "en": "call without required headers (relay needed)"
  },
  "entrées doublées ignorées : {0}": {
    "fr": "entrées doublées ignorées : {0}",
    "en": "duplicate entries ignored: {0}"
  },
  "Flux proposés non lisibles ici ({0}).": {
    "fr": "Flux proposés non lisibles ici ({0}).",
    "en": "Offered streams cannot play here ({0})."
  },
  "flux écartés : {0}": {
    "fr": "flux écartés : {0}",
    "en": "streams excluded: {0}"
  },
  "{0} recherche{1}{2}, {3} résultats, vérifiés : {4}": {
    "fr": "{0} recherche{1}{2}, {3} résultats, vérifiés : {4}",
    "en": "{0} search{1}{2}, {3} results, verified: {4}"
  },
  "{0} ép.": {
    "fr": "{0} ép.",
    "en": "{0} ep."
  },
  "correspondance corrigée : « {0} » ({1} ép.) → « {2} »": {
    "fr": "correspondance corrigée : « {0} » ({1} ép.) → « {2} »",
    "en": "match corrected: “{0}” ({1} ep.) → “{2}”"
  },
  "Aucune entrée correspondante": {
    "fr": "Aucune entrée correspondante",
    "en": "No matching entry"
  },
  "relais des sous-titres : {0}/{1} acceptés": {
    "fr": "relais des sous-titres : {0}/{1} acceptés",
    "en": "subtitle relay: {0}/{1} accepted"
  },
  "Source non activée.": {
    "fr": "Source non activée.",
    "en": "Source not enabled."
  },
  "Session expirée.": {
    "fr": "Session expirée.",
    "en": "Session expired."
  },
  "Aucune extension chargée.": {
    "fr": "Aucune extension chargée.",
    "en": "No extension loaded."
  },
  "Une extension est déjà chargée dans ce bac à sable.": {
    "fr": "Une extension est déjà chargée dans ce bac à sable.",
    "en": "An extension is already loaded in this sandbox."
  },
  "{0} n'est pas disponible dans le bac à sable : passe par Client/fetchv2.": {
    "fr": "{0} n'est pas disponible dans le bac à sable : passe par Client/fetchv2.",
    "en": "{0} is unavailable in the sandbox: use Client/fetchv2."
  },
  "L'extension n'a pas défini DefaultExtension.": {
    "fr": "L'extension n'a pas défini DefaultExtension.",
    "en": "The extension did not define DefaultExtension."
  },
  "Le module n'a pas trouvé les épisodes.": {
    "fr": "Le module n'a pas trouvé les épisodes.",
    "en": "The module did not find the episodes."
  },
  "Fonctionnalité non prise en charge par la version Web : {0}": {
    "fr": "Fonctionnalité non prise en charge par la version Web : {0}",
    "en": "Feature unsupported by the Web version: {0}"
  },
  "Série continue": {
    "fr": "Série continue",
    "en": "Continuous series"
  },
  "{0} séries": {
    "fr": "{0} séries",
    "en": "{0} series"
  },
  "{0} à aujourd'hui": {
    "fr": "{0} à aujourd'hui",
    "en": "{0} to today"
  },
  "{0} à {1}": {
    "fr": "{0} à {1}",
    "en": "{0} to {1}"
  },
  "Prévue en {0}": {
    "fr": "Prévue en {0}",
    "en": "Expected in {0}"
  },
  "Terminée": {
    "fr": "Terminée",
    "en": "Finished"
  },
  "Spéciaux et OVA": {
    "fr": "Spéciaux et OVA",
    "en": "Specials and OVAs"
  },
  "Histoires parallèles": {
    "fr": "Histoires parallèles",
    "en": "Side stories"
  },
  "À continuer": {
    "fr": "À continuer",
    "en": "Continue watching"
  },
  "Terminés": {
    "fr": "Terminés",
    "en": "Completed"
  },
  "Abandonnés": {
    "fr": "Abandonnés",
    "en": "Dropped"
  },
  "Protocole refusé : {0}": {
    "fr": "Protocole refusé : {0}",
    "en": "Protocol refused: {0}"
  },
  "Identifiants dans l'adresse refusés.": {
    "fr": "Identifiants dans l'adresse refusés.",
    "en": "Credentials in the address refused."
  },
  "Port non standard refusé.": {
    "fr": "Port non standard refusé.",
    "en": "Nonstandard port refused."
  },
  "Hôte local ou privé refusé : {0}": {
    "fr": "Hôte local ou privé refusé : {0}",
    "en": "Local or private host refused: {0}"
  },
  "Hôte non autorisé : {0}": {
    "fr": "Hôte non autorisé : {0}",
    "en": "Host not authorized: {0}"
  },
  "Démo locale": {
    "fr": "Démo locale",
    "en": "Local demo"
  },
  "Réponse de la source invalide.": {
    "fr": "Réponse de la source invalide.",
    "en": "Invalid source response."
  },
  "{0} mise{1} à jour": {
    "fr": "{0} mise{1} à jour",
    "en": "{0} updated"
  },
  "{0} retirée{1}": {
    "fr": "{0} retirée{1}",
    "en": "{0} removed"
  },
  "Déjà à jour": {
    "fr": "Déjà à jour",
    "en": "Already up to date"
  },
  "Indonésien": {
    "fr": "Indonésien",
    "en": "Indonesian"
  },
  "Coréen": {
    "fr": "Coréen",
    "en": "Korean"
  },
  "français": {
    "fr": "français",
    "en": "French"
  },
  "Colle l'adresse d'un dépôt.": {
    "fr": "Colle l'adresse d'un dépôt.",
    "en": "Paste a repository address."
  },
  "Seules les adresses https sont acceptées.": {
    "fr": "Seules les adresses https sont acceptées.",
    "en": "Only HTTPS addresses are accepted."
  },
  "Adresse GitHub incomplète : il faut github.com/propriétaire/dépôt.": {
    "fr": "Adresse GitHub incomplète : il faut github.com/propriétaire/dépôt.",
    "en": "Incomplete GitHub address: github.com/owner/repository is required."
  },
  "Hébergeur non pris en charge : utilise un lien github.com, raw.githubusercontent.com, github.io ou pages.dev.": {
    "fr": "Hébergeur non pris en charge : utilise un lien github.com, raw.githubusercontent.com, github.io ou pages.dev.",
    "en": "Unsupported host: use github.com, raw.githubusercontent.com, github.io or pages.dev."
  },
  "Principale · 1080p observé · sous-titres séparés (FR selon l'épisode)": {
    "fr": "Principale · 1080p observé · sous-titres séparés (FR selon l'épisode)",
    "en": "Primary · observed 1080p · separate subtitles (French varies by episode)"
  },
  "Anglais · premières images observées (Girls' Last Tour, Sonny Boy) · pas de sous-titres séparés observés": {
    "fr": "Anglais · premières images observées (Girls' Last Tour, Sonny Boy) · pas de sous-titres séparés observés",
    "en": "English · first frames observed (Girls' Last Tour, Sonny Boy) · no separate subtitles observed"
  },
  "Anglais · 720p observé · pas de sous-titres séparés": {
    "fr": "Anglais · 720p observé · pas de sous-titres séparés",
    "en": "English · observed 720p · no separate subtitles observed"
  },
  "Français VOSTFR · 720p observé · démarrage plus lent": {
    "fr": "Français VOSTFR · 720p observé · démarrage plus lent",
    "en": "French soft/hard-sub version · observed 720p · slower startup"
  },
  "Français VOSTFR · 720p observé · catalogue large, parfois instable": {
    "fr": "Français VOSTFR · 720p observé · catalogue large, parfois instable",
    "en": "French soft/hard-sub version · observed 720p · broad catalogue, sometimes unstable"
  },
  "Plus listée par le dépôt d'origine.": {
    "fr": "Plus listée par le dépôt d'origine.",
    "en": "No longer listed in its original repository."
  },
  "anime, séries, films · HLS · 1080p": {
    "fr": "anime, séries, films · HLS · 1080p",
    "en": "anime, series, films · HLS · 1080p"
  },
  "anime, séries, films · HLS/MP4 · 1080p": {
    "fr": "anime, séries, films · HLS/MP4 · 1080p",
    "en": "anime, series, films · HLS/MP4 · 1080p"
  },
  "Compatibilité réelle à tester": {
    "fr": "Compatibilité réelle à tester",
    "en": "Actual compatibility to test"
  },
  "GitHub limite temporairement les requêtes. Réessaie dans quelques minutes.": {
    "fr": "GitHub limite temporairement les requêtes. Réessaie dans quelques minutes.",
    "en": "GitHub is temporarily limiting requests. Try again in a few minutes."
  },
  "Le dépôt a répondu {0}.": {
    "fr": "Le dépôt a répondu {0}.",
    "en": "Repository returned {0}."
  },
  "Ce navigateur n'a pas pu lire le dépôt, et Maximanim est injoignable. Vérifie ta connexion.": {
    "fr": "Ce navigateur n'a pas pu lire le dépôt, et Maximanim est injoignable. Vérifie ta connexion.",
    "en": "This browser could not read the repository, and MaximAnim is unreachable. Check your connection."
  },
  "Hôte non autorisé.": {
    "fr": "Hôte non autorisé.",
    "en": "Host not authorized."
  },
  "Le dépôt a répondu une erreur.": {
    "fr": "Le dépôt a répondu une erreur.",
    "en": "The repository returned an error."
  },
  "Le dépôt est injoignable.": {
    "fr": "Le dépôt est injoignable.",
    "en": "Repository unreachable."
  },
  "Redirection vers un hôte non autorisé.": {
    "fr": "Redirection vers un hôte non autorisé.",
    "en": "Redirect to an unapproved host."
  },
  "Dépôt GitHub introuvable (ou privé).": {
    "fr": "Dépôt GitHub introuvable (ou privé).",
    "en": "GitHub repository not found (or private)."
  },
  "Aucun catalogue d'anime trouvé dans ce dépôt (anime_index.json).": {
    "fr": "Aucun catalogue d'anime trouvé dans ce dépôt (anime_index.json).",
    "en": "No anime catalogue found in this repository (anime_index.json)."
  },
  "Aucun catalogue d'anime trouvé à cette adresse.": {
    "fr": "Aucun catalogue d'anime trouvé à cette adresse.",
    "en": "No anime catalogue found at this address."
  },
  "Aucun module de cet index n'a pu être lu.": {
    "fr": "Aucun module de cet index n'a pu être lu.",
    "en": "No module from this index could be read."
  },
  "« {0} » est déjà ajouté.": {
    "fr": "« {0} » est déjà ajouté.",
    "en": "“{0}” is already added."
  },
  "Dépôt introuvable.": {
    "fr": "Dépôt introuvable.",
    "en": "Repository not found."
  },
  "Le catalogue n'existe plus à cette adresse.": {
    "fr": "Le catalogue n'existe plus à cette adresse.",
    "en": "The catalogue no longer exists at this address."
  },
  "Impossible d'importer ce dépôt.": {
    "fr": "Impossible d'importer ce dépôt.",
    "en": "Unable to import this repository."
  },
  "Extension Dart compilée pour l'app native AnymeX/Mangayomi.": {
    "fr": "Extension Dart compilée pour l'app native AnymeX/Mangayomi.",
    "en": "Dart extension compiled for the native AnymeX/Mangayomi app."
  },
  "Site protégé par Cloudflare : la version Web ne résout pas ces vérifications, la source peut échouer.": {
    "fr": "Site protégé par Cloudflare : la version Web ne résout pas ces vérifications, la source peut échouer.",
    "en": "Cloudflare-protected site: the Web version does not solve these checks; the source may fail."
  },
  "Expérimental": {
    "fr": "Expérimental",
    "en": "Experimental"
  },
  "Module déclaré pour Luna uniquement : il peut s'appuyer sur des fonctions que la version Web n'a pas.": {
    "fr": "Module déclaré pour Luna uniquement : il peut s'appuyer sur des fonctions que la version Web n'a pas.",
    "en": "Module declared for Luna only: it may rely on features the Web version does not have."
  },
  "Le module déclare ne pas prendre en charge Sora.": {
    "fr": "Le module déclare ne pas prendre en charge Sora.",
    "en": "The module reports no Sora support."
  },
  "Exécutée par {0} (expérimental).": {
    "fr": "Exécutée par {0} (expérimental).",
    "en": "Run by {0} (experimental)."
  },
  "alternative {0} écartée après un échec récent": {
    "fr": "alternative {0} écartée après un échec récent",
    "en": "alternative {0} excluded after a recent failure"
  },
  "alternative {0} non testée : {1}": {
    "fr": "alternative {0} non testée : {1}",
    "en": "alternative {0} not tested: {1}"
  },
  "EN incrusté": {
    "fr": "EN incrusté",
    "en": "Burned-in English"
  },
  "{0} non confirmé": {
    "fr": "{0} non confirmé",
    "en": "{0} unconfirmed"
  },
  "{0} observé": {
    "fr": "{0} observé",
    "en": "{0} observed"
  },
  "Choisi pour fiabilité": {
    "fr": "Choisi pour fiabilité",
    "en": "Chosen for reliability"
  },
  "Choisi pour la qualité mesurée": {
    "fr": "Choisi pour la qualité mesurée",
    "en": "Chosen for measured quality"
  },
  "correspondance à choisir": {
    "fr": "correspondance à choisir",
    "en": "match to choose"
  },
  "ne répond pas": {
    "fr": "ne répond pas",
    "en": "not responding"
  },
  "Recherche du français · {0}": {
    "fr": "Recherche du français · {0}",
    "en": "Searching for French · {0}"
  },
  "Recherche d'une version française…": {
    "fr": "Recherche d'une version française…",
    "en": "Searching for a French version…"
  },
  "Aucun français disponible pour cet épisode": {
    "fr": "Aucun français disponible pour cet épisode",
    "en": "No French available for this episode"
  },
  "Aucun français trouvé dans le délai disponible": {
    "fr": "Aucun français trouvé dans le délai disponible",
    "en": "No French found within the time limit"
  },
  "Anglais incrusté dans la vidéo : aucun français sans anglais trouvé": {
    "fr": "Anglais incrusté dans la vidéo : aucun français sans anglais trouvé",
    "en": "English burned into the video: no French without English found"
  },
  "1 lecture réussie": {
    "fr": "1 lecture réussie",
    "en": "1 successful playback"
  },
  "{0} lectures réussies": {
    "fr": "{0} lectures réussies",
    "en": "{0} successful playbacks"
  },
  "Aucune lecture réussie": {
    "fr": "Aucune lecture réussie",
    "en": "No successful playback"
  },
  "1 échec": {
    "fr": "1 échec",
    "en": "1 failure"
  },
  "{0} échecs": {
    "fr": "{0} échecs",
    "en": "{0} failures"
  },
  "{0} max observé": {
    "fr": "{0} max observé",
    "en": "{0} max observed"
  },
  "{0} première image": {
    "fr": "{0} première image",
    "en": "{0} first frame"
  },
  "{0} % de réussite": {
    "fr": "{0} % de réussite",
    "en": "{0} % success"
  },
  "Timeout à la recherche du flux": {
    "fr": "Timeout à la recherche du flux",
    "en": "Timeout finding stream"
  },
  "Aucun flux pour cet épisode": {
    "fr": "Aucun flux pour cet épisode",
    "en": "No stream for this episode"
  },
  "Épisode introuvable": {
    "fr": "Épisode introuvable",
    "en": "Episode not found"
  },
  "{0} annoncé": {
    "fr": "{0} annoncé",
    "en": "{0} reported"
  },
  "Pas encore testée pour cet épisode": {
    "fr": "Pas encore testée pour cet épisode",
    "en": "Not tested for this episode yet"
  },
  "Épisode {0} absent{1}": {
    "fr": "Épisode {0} absent{1}",
    "en": "Episode {0} missing{1}"
  },
  "Plusieurs correspondances : à choisir": {
    "fr": "Plusieurs correspondances : à choisir",
    "en": "Several matches: choose one"
  },
  "Fonction non supportée": {
    "fr": "Fonction non supportée",
    "en": "Unsupported feature"
  },
  "Anime trouvé · épisode {0}": {
    "fr": "Anime trouvé · épisode {0}",
    "en": "Anime found · episode {0}"
  },
  "test de lecture annulé": {
    "fr": "test de lecture annulé",
    "en": "playback test cancelled"
  },
  "Lecture · CC bloqué par permission": {
    "fr": "Lecture · CC bloqué par permission",
    "en": "Playback · CC blocked by permission"
  },
  "Épisode disponible": {
    "fr": "Épisode disponible",
    "en": "Episode available"
  },
  "La source n'a pas répondu à temps.": {
    "fr": "La source n'a pas répondu à temps.",
    "en": "The source did not respond in time."
  },
  "{0} entrées possibles : à choisir.": {
    "fr": "{0} entrées possibles : à choisir.",
    "en": "{0} possible entries: choose one."
  },
  "qualité inconnue": {
    "fr": "qualité inconnue",
    "en": "quality unknown"
  },
  "VF québécoise": {
    "fr": "VF québécoise",
    "en": "Québécois French dub"
  },
  "VOSTFR incrusté": {
    "fr": "VOSTFR incrusté",
    "en": "Burned-in French subtitles"
  },
  "VOSTEN incrusté": {
    "fr": "VOSTEN incrusté",
    "en": "Burned-in English subtitles"
  },
  "refusé (CORS ou réseau)": {
    "fr": "refusé (CORS ou réseau)",
    "en": "refused (CORS or network)"
  },
  "hôte non approuvé": {
    "fr": "hôte non approuvé",
    "en": "host not approved"
  },
  "source non activée": {
    "fr": "source non activée",
    "en": "source not enabled"
  },
  "attachée": {
    "fr": "attachée",
    "en": "attached"
  },
  "lecture directe refusée": {
    "fr": "lecture directe refusée",
    "en": "direct playback refused"
  },
  "relais refusé": {
    "fr": "relais refusé",
    "en": "relay refused"
  },
  "refusée par le lecteur": {
    "fr": "refusée par le lecteur",
    "en": "refused by the player"
  },
  "attachée : {0}": {
    "fr": "attachée : {0}",
    "en": "attached: {0}"
  },
  "affichée : {0}": {
    "fr": "affichée : {0}",
    "en": "shown: {0}"
  },
  " · {0} en échec ({1})": {
    "fr": " · {0} en échec ({1})",
    "en": " · {0} failed ({1})"
  },
  "Sous-titres affichés · {0}{1}": {
    "fr": "Sous-titres affichés · {0}{1}",
    "en": "Subtitles shown · {0}{1}"
  },
  "Sous-titres attachés mais non affichés · {0}{1}": {
    "fr": "Sous-titres attachés mais non affichés · {0}{1}",
    "en": "Subtitles attached but not shown · {0}{1}"
  },
  "Sous-titres attachés · {0}{1}": {
    "fr": "Sous-titres attachés · {0}{1}",
    "en": "Subtitles attached · {0}{1}"
  },
  "Cinéma": {
    "fr": "Cinéma",
    "en": "Cinema"
  },
  "La synchronisation a échoué. Tes données restent sur cet appareil.": {
    "fr": "La synchronisation a échoué. Tes données restent sur cet appareil.",
    "en": "Sync failed. Your data stays on this device."
  },
  "Aucune réplique à traduire.": {
    "fr": "Aucune réplique à traduire.",
    "en": "No dialogue to translate."
  },
  "Répliques précédentes : {0}": {
    "fr": "Répliques précédentes : {0}",
    "en": "Previous dialogue: {0}"
  },
  "Répliques suivantes : {0}": {
    "fr": "Répliques suivantes : {0}",
    "en": "Next dialogue: {0}"
  },
  "Traduction non configurée": {
    "fr": "Traduction non configurée",
    "en": "Translation not configured"
  },
  "Traduction momentanément saturée": {
    "fr": "Traduction momentanément saturée",
    "en": "Translation temporarily busy"
  },
  "Traduction refusée": {
    "fr": "Traduction refusée",
    "en": "Translation refused"
  },
  "Traduction incohérente, ignorée": {
    "fr": "Traduction incohérente, ignorée",
    "en": "Inconsistent translation ignored"
  },
  "Sous-titres trop longs à traduire": {
    "fr": "Sous-titres trop longs à traduire",
    "en": "Subtitles too long to translate"
  },
  "févr.": {
    "fr": "févr.",
    "en": "Feb"
  },
  "août": {
    "fr": "août",
    "en": "Aug"
  },
  "déc.": {
    "fr": "déc.",
    "en": "Dec"
  },
  "prévu {0}": {
    "fr": "prévu {0}",
    "en": "expected {0}"
  },
  "prévu en {0}": {
    "fr": "prévu en {0}",
    "en": "expected in {0}"
  },
  "Annulée": {
    "fr": "Annulée",
    "en": "Cancelled"
  },
  "Annulé": {
    "fr": "Annulé",
    "en": "Cancelled"
  },
  "épisode": {
    "fr": "épisode",
    "en": "episode"
  },
  "{0} diffusé{1}": {
    "fr": "{0} diffusé{1}",
    "en": "{0} aired"
  },
  "Série courte": {
    "fr": "Série courte",
    "en": "Short series"
  },
  "Auteur de l'œuvre originale": {
    "fr": "Auteur de l'œuvre originale",
    "en": "Original work author"
  },
  "Jeu vidéo": {
    "fr": "Jeu vidéo",
    "en": "Video game"
  },
  "Film ou série live": {
    "fr": "Film ou série live",
    "en": "Live-action film or series"
  },
  "Projet multimédia": {
    "fr": "Projet multimédia",
    "en": "Multimedia project"
  },
  "Livre illustré": {
    "fr": "Livre illustré",
    "en": "Picture book"
  },
  "prévu le {0}": {
    "fr": "prévu le {0}",
    "en": "expected on {0}"
  },
  "{0} min / ép.": {
    "fr": "{0} min / ép.",
    "en": "{0} min / ep."
  },
  "{0} épisode{1}": {
    "fr": "{0} épisode{1}",
    "en": "{0} episode{1}"
  },
  "Anglais": {
    "fr": "Anglais",
    "en": "English"
  },
  "Japonais": {
    "fr": "Japonais",
    "en": "Japanese"
  },
  "Compact": {
    "fr": "Compact",
    "en": "Compact"
  },
  "Liste": {
    "fr": "Liste",
    "en": "List"
  },
  "Grille": {
    "fr": "Grille",
    "en": "Grid"
  },
  "Sans date": {
    "fr": "Sans date",
    "en": "Undated"
  },
  "Semaine": {
    "fr": "Semaine",
    "en": "Week"
  },
  "Suivies": {
    "fr": "Suivies",
    "en": "Followed"
  },
  "Hiver": {
    "fr": "Hiver",
    "en": "Winter"
  },
  "Printemps": {
    "fr": "Printemps",
    "en": "Spring"
  },
  "Automne": {
    "fr": "Automne",
    "en": "Autumn"
  },
  "Roman": {
    "fr": "Roman",
    "en": "Novel"
  },
  "Œuvre originale": {
    "fr": "Œuvre originale",
    "en": "Original work"
  },
  "Original": {
    "fr": "Original",
    "en": "Original"
  },
  "Jeu": {
    "fr": "Jeu",
    "en": "Game"
  },
  "Inconnu": {
    "fr": "Inconnu",
    "en": "Unknown"
  },
  "Inconnue": {
    "fr": "Inconnue",
    "en": "Unknown"
  },
  "Ajouter": {
    "fr": "Ajouter",
    "en": "Add"
  },
  "En diffusion": {
    "fr": "En diffusion",
    "en": "Airing"
  },
  "En pause": {
    "fr": "En pause",
    "en": "On hiatus"
  },
  "Diffusion": {
    "fr": "Diffusion",
    "en": "Airing"
  },
  "Studio d'animation": {
    "fr": "Studio d'animation",
    "en": "Animation studio"
  },
  "Œuvres principales": {
    "fr": "Œuvres principales",
    "en": "Main works"
  },
  "AniList ne liste aucune production principale pour ce studio.": {
    "fr": "AniList ne liste aucune production principale pour ce studio.",
    "en": "AniList lists no main production for this studio."
  },
  "Ce studio": {
    "fr": "Ce studio",
    "en": "This studio"
  },
  "Cette personne": {
    "fr": "Cette personne",
    "en": "This person"
  },
  "Impossible de charger cet anime": {
    "fr": "Impossible de charger cet anime",
    "en": "Unable to load this anime"
  },
  "Cet anime n'existe pas sur AniList": {
    "fr": "Cet anime n'existe pas sur AniList",
    "en": "This anime does not exist on AniList"
  },
  "Participation": {
    "fr": "Participation",
    "en": "Contribution"
  },
  "Composition du storyboard": {
    "fr": "Composition du storyboard",
    "en": "Storyboard composition"
  },
  "Histoire originale": {
    "fr": "Histoire originale",
    "en": "Original story"
  },
  "Design des personnages originaux": {
    "fr": "Design des personnages originaux",
    "en": "Original character design"
  },
  "Direction de l'animation en chef": {
    "fr": "Direction de l'animation en chef",
    "en": "Chief animation direction"
  },
  "Direction de l'animation": {
    "fr": "Direction de l'animation",
    "en": "Animation direction"
  },
  "Assistant direction de l'animation": {
    "fr": "Assistant direction de l'animation",
    "en": "Assistant animation direction"
  },
  "Direction de l'animation (action)": {
    "fr": "Direction de l'animation (action)",
    "en": "Action animation direction"
  },
  "Supervision de l'animation": {
    "fr": "Supervision de l'animation",
    "en": "Animation supervision"
  },
  "Animateur principal": {
    "fr": "Animateur principal",
    "en": "Main animator"
  },
  "Production de l'animation": {
    "fr": "Production de l'animation",
    "en": "Animation production"
  },
  "Intervalles": {
    "fr": "Intervalles",
    "en": "In-between animation"
  },
  "Design des accessoires": {
    "fr": "Design des accessoires",
    "en": "Prop design"
  },
  "Supervision du layout": {
    "fr": "Supervision du layout",
    "en": "Layout supervision"
  },
  "Direction artistique": {
    "fr": "Direction artistique",
    "en": "Art direction"
  },
  "Direction des couleurs": {
    "fr": "Direction des couleurs",
    "en": "Color design"
  },
  "Direction de la photographie": {
    "fr": "Direction de la photographie",
    "en": "Photography direction"
  },
  "Direction CG": {
    "fr": "Direction CG",
    "en": "CG direction"
  },
  "Direction 3D": {
    "fr": "Direction 3D",
    "en": "3D direction"
  },
  "Montage": {
    "fr": "Montage",
    "en": "Editing"
  },
  "Montage en ligne": {
    "fr": "Montage en ligne",
    "en": "Online editing"
  },
  "Enregistrement": {
    "fr": "Enregistrement",
    "en": "Recording"
  },
  "Direction du son": {
    "fr": "Direction du son",
    "en": "Sound direction"
  },
  "Effets sonores": {
    "fr": "Effets sonores",
    "en": "Sound effects"
  },
  "Production sonore": {
    "fr": "Production sonore",
    "en": "Sound production"
  },
  "Musique": {
    "fr": "Musique",
    "en": "Music"
  },
  "Production musicale": {
    "fr": "Production musicale",
    "en": "Music production"
  },
  "Composition d'une chanson d'insertion": {
    "fr": "Composition d'une chanson d'insertion",
    "en": "Insert song composition"
  },
  "Logo du titre": {
    "fr": "Logo du titre",
    "en": "Title logo"
  },
  "Production": {
    "fr": "Production",
    "en": "Production"
  },
  "Production en chef": {
    "fr": "Production en chef",
    "en": "Chief production"
  },
  "Original manga": {
    "fr": "Original manga",
    "en": "Original manga"
  },
  "Animation": {
    "fr": "Animation",
    "en": "Animation"
  },
  "Direction artistique & design": {
    "fr": "Direction artistique & design",
    "en": "Art direction & design"
  },
  "Son & musique": {
    "fr": "Son & musique",
    "en": "Sound & music"
  },
  "Autre": {
    "fr": "Autre",
    "en": "Other"
  },
  "Autres": {
    "fr": "Autres",
    "en": "Others"
  },
  "Plus ancien": {
    "fr": "Plus ancien",
    "en": "Oldest"
  },
  "Diffusés": {
    "fr": "Diffusés",
    "en": "Aired"
  },
  "Compatibles": {
    "fr": "Compatibles",
    "en": "Compatible"
  },
  "Activées": {
    "fr": "Activées",
    "en": "Enabled"
  },
  "Non testées": {
    "fr": "Non testées",
    "en": "Untested"
  },
  "Toutes les sources": {
    "fr": "Toutes les sources",
    "en": "All sources"
  },
  "Recommandées": {
    "fr": "Recommandées",
    "en": "Recommended"
  },
  "Masquer": {
    "fr": "Masquer",
    "en": "Hide"
  },
  "Aucun": {
    "fr": "Aucun",
    "en": "None"
  },
  "Aucune": {
    "fr": "Aucune",
    "en": "None"
  },
  "Indisponible": {
    "fr": "Indisponible",
    "en": "Unavailable"
  },
  "Lisible": {
    "fr": "Lisible",
    "en": "Readable"
  },
  "Contraste": {
    "fr": "Contraste",
    "en": "Contrast"
  },
  "Standard": {
    "fr": "Standard",
    "en": "Standard"
  },
  "Discret": {
    "fr": "Discret",
    "en": "Subtle"
  },
  "Français (natif)": {
    "fr": "Français (natif)",
    "en": "French (native)"
  },
  "Anglais (natif)": {
    "fr": "Anglais (natif)",
    "en": "English (native)"
  },
  "Lun": {
    "fr": "Lun",
    "en": "Mon"
  },
  "Mar": {
    "fr": "Mar",
    "en": "Tue"
  },
  "Mer": {
    "fr": "Mer",
    "en": "Wed"
  },
  "Jeu.": {
    "fr": "Jeu.",
    "en": "Thu."
  },
  "Ven": {
    "fr": "Ven",
    "en": "Fri"
  },
  "Sam": {
    "fr": "Sam",
    "en": "Sat"
  },
  "Dim": {
    "fr": "Dim",
    "en": "Sun"
  },
  "Aujourd'hui": {
    "fr": "Aujourd'hui",
    "en": "Today"
  },
  "Hier": {
    "fr": "Hier",
    "en": "Yesterday"
  },
  "Vide": {
    "fr": "Vide",
    "en": "Empty"
  },
  "Rose": {
    "fr": "Rose",
    "en": "Pink"
  },
  "Bleu": {
    "fr": "Bleu",
    "en": "Blue"
  },
  "Violet": {
    "fr": "Violet",
    "en": "Purple"
  },
  "Rouge": {
    "fr": "Rouge",
    "en": "Red"
  },
  "Crème": {
    "fr": "Crème",
    "en": "Cream"
  },
  "Vert": {
    "fr": "Vert",
    "en": "Green"
  },
  "Gris": {
    "fr": "Gris",
    "en": "Gray"
  },
  "Titre": {
    "fr": "Titre",
    "en": "Title"
  },
  "État": {
    "fr": "État",
    "en": "State"
  },
  "Ouvrir": {
    "fr": "Ouvrir",
    "en": "Open"
  },
  "Rechercher": {
    "fr": "Rechercher",
    "en": "Search"
  },
  "Choisir": {
    "fr": "Choisir",
    "en": "Choose"
  },
  "Tout": {
    "fr": "Tout",
    "en": "All"
  },
  "Oui": {
    "fr": "Oui",
    "en": "Yes"
  },
  "Non": {
    "fr": "Non",
    "en": "No"
  },
  "Titres anglais": {
    "fr": "Titres anglais",
    "en": "English titles"
  },
  "Titres japonais": {
    "fr": "Titres japonais",
    "en": "Japanese titles"
  },
  "Source principale": {
    "fr": "Source principale",
    "en": "Main source"
  },
  "Source secondaire": {
    "fr": "Source secondaire",
    "en": "Secondary source"
  },
  "Incrustés": {
    "fr": "Incrustés",
    "en": "Burned in"
  },
  "En cours": {
    "fr": "En cours",
    "en": "Watching"
  },
  "Épisode en cours": {
    "fr": "Épisode en cours",
    "en": "Episode in progress"
  },
  "Résumé original": {
    "fr": "Résumé original",
    "en": "Original synopsis"
  },
  "Traduction française": {
    "fr": "Traduction française",
    "en": "French translation"
  },
  "Échec": {
    "fr": "Échec",
    "en": "Failure"
  },
  "Erreur": {
    "fr": "Erreur",
    "en": "Error"
  },
  "Succès": {
    "fr": "Succès",
    "en": "Success"
  },
  "Activer": {
    "fr": "Activer",
    "en": "Enable"
  },
  "Lecture à vérifier": {
    "fr": "Lecture à vérifier",
    "en": "Playback to verify"
  },
  "Compte": {
    "fr": "Compte",
    "en": "Account"
  },
  "Fin": {
    "fr": "Fin",
    "en": "End"
  },
  "Suivre les sorties": {
    "fr": "Suivre les sorties",
    "en": "Follow releases"
  },
  "Source officielle": {
    "fr": "Source officielle",
    "en": "Official source"
  },
  "Site officiel": {
    "fr": "Site officiel",
    "en": "Official website"
  },
  "Scénario et dessin du manga": {
    "fr": "Scénario et dessin du manga",
    "en": "Manga story and art"
  },
  "En attente": {
    "fr": "En attente",
    "en": "Pending"
  },
  "Langue de l’interface": {
    "fr": "Langue de l’interface",
    "en": "Interface language"
  },
  "Lire": {
    "fr": "Lire",
    "en": "Play"
  },
  "Film": {
    "fr": "Film",
    "en": "Film"
  },
  "Clip": {
    "fr": "Clip",
    "en": "Music video"
  },
  "Compositeur": {
    "fr": "Compositeur",
    "en": "Composer"
  },
  "Chant": {
    "fr": "Chant",
    "en": "Vocals"
  },
  "Paroles": {
    "fr": "Paroles",
    "en": "Lyrics"
  },
  "Groupe": {
    "fr": "Groupe",
    "en": "Band"
  },
  "Animateur": {
    "fr": "Animateur",
    "en": "Animator"
  },
  "Illustrateur": {
    "fr": "Illustrateur",
    "en": "Illustrator"
  },
  "Producteur": {
    "fr": "Producteur",
    "en": "Producer"
  },
  "Organisation": {
    "fr": "Organisation",
    "en": "Organisation"
  },
  "Principale": {
    "fr": "Principale",
    "en": "Primary"
  },
  "Secours": {
    "fr": "Secours",
    "en": "Fallback"
  },
  "Actif": {
    "fr": "Actif",
    "en": "Active"
  },
  "Utilisables": {
    "fr": "Utilisables",
    "en": "Usable"
  },
  "oui": {
    "fr": "oui",
    "en": "yes"
  },
  "non": {
    "fr": "non",
    "en": "no"
  },
  "aucune": {
    "fr": "aucune",
    "en": "none"
  },
  "anglaise": {
    "fr": "anglaise",
    "en": "English"
  },
  "japonaise": {
    "fr": "japonaise",
    "en": "Japanese"
  },
  "espagnole": {
    "fr": "espagnole",
    "en": "Spanish"
  },
  "allemande": {
    "fr": "allemande",
    "en": "German"
  },
  "italienne": {
    "fr": "italienne",
    "en": "Italian"
  },
  "portugaise": {
    "fr": "portugaise",
    "en": "Portuguese"
  },
  "uniquement.": {
    "fr": "uniquement.",
    "en": "only."
  },
  "Calendrier": {
    "fr": "Calendrier",
    "en": "Calendar"
  },
  "Vue": {
    "fr": "Vue",
    "en": "View"
  },
  "chargement": {
    "fr": "chargement",
    "en": "loading"
  },
  "Indisponibles": {
    "fr": "Indisponibles",
    "en": "Unavailable"
  },
  "{0} sorties": {
    "fr": "{0} sorties",
    "en": "{0} releases"
  },
  "{0} pistes de sous-titres": {
    "fr": "{0} pistes de sous-titres",
    "en": "{0} subtitle tracks"
  },
  "{0} sources de secours attendent ton autorisation": {
    "fr": "{0} sources de secours attendent ton autorisation",
    "en": "{0} fallback sources need your permission"
  },
  "{0} sources le demandent": {
    "fr": "{0} sources le demandent",
    "en": "{0} sources need this"
  },
  "{0} min restante{1}": {
    "fr": "{0} min restante{1}",
    "en": "{0} min remaining"
  },
  "{0} titre{1}": {
    "fr": "{0} titre{1}",
    "en": "{0} title{1}"
  },
  "Agrandir : {0}": {
    "fr": "Agrandir : {0}",
    "en": "Enlarge: {0}"
  },
  "il y a {0} min": {
    "fr": "il y a {0} min",
    "en": "{0} min ago"
  },
  "Hors ligne": {
    "fr": "Hors ligne",
    "en": "Offline"
  },
  "Impossible d'envoyer l'e-mail.": {
    "fr": "Impossible d'envoyer l'e-mail.",
    "en": "Couldn't send the email."
  },
  "Code invalide.": {
    "fr": "Code invalide.",
    "en": "Invalid code."
  },
  "Recevoir un code": {
    "fr": "Recevoir un code",
    "en": "Receive a code"
  },
  "Colle le lien dans le champ (appui long → Coller).": {
    "fr": "Colle le lien dans le champ (appui long → Coller).",
    "en": "Paste the link into the field (press and hold → Paste)."
  },
  "Copier le code": {
    "fr": "Copier le code",
    "en": "Copy the code"
  },
  "par épisode": {
    "fr": "par épisode",
    "en": "per episode"
  },
  "Progression de {0}": {
    "fr": "Progression de {0}",
    "en": "Progress for {0}"
  },
  "Retirer {0} de Continuer": {
    "fr": "Retirer {0} de Continuer",
    "en": "Remove {0} from Continue"
  },
  "Fiche de {0}": {
    "fr": "Fiche de {0}",
    "en": "Details for {0}"
  },
  "Affiche de {0}": {
    "fr": "Affiche de {0}",
    "en": "Poster for {0}"
  },
  "Traduction automatique · Voir l'original": {
    "fr": "Traduction automatique · Voir l'original",
    "en": "Automatic translation · View original"
  },
  "Lire la suite": {
    "fr": "Lire la suite",
    "en": "Read more"
  },
  "Impossible de charger {0}": {
    "fr": "Impossible de charger {0}",
    "en": "Couldn't load {0}"
  },
  "AniList n'a pas cette fiche.": {
    "fr": "AniList n'a pas cette fiche.",
    "en": "AniList has no page for this entry."
  },
  "épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.": {
    "fr": "épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.",
    "en": "available episodes of this season will be marked as watched. Other seasons, history and lists are kept."
  },
  "Impossible de modifier le suivi": {
    "fr": "Impossible de modifier le suivi",
    "en": "Couldn't update tracking"
  },
  "Fiche de l'anime : {0}": {
    "fr": "Fiche de l'anime : {0}",
    "en": "Anime details: {0}"
  },
  "Marquer non vus": {
    "fr": "Marquer non vus",
    "en": "Mark unwatched"
  },
  "Marquer vus": {
    "fr": "Marquer vus",
    "en": "Mark watched"
  },
  ", vu": {
    "fr": ", vu",
    "en": ", watched"
  },
  ", en cours": {
    "fr": ", en cours",
    "en": ", in progress"
  },
  "Pas encore disponible": {
    "fr": "Pas encore disponible",
    "en": "Not available yet"
  },
  "Disponible le {0}": {
    "fr": "Disponible le {0}",
    "en": "Available on {0}"
  },
  "Triés par popularité": {
    "fr": "Triés par popularité",
    "en": "Sorted by popularity"
  },
  "Progression de l'épisode": {
    "fr": "Progression de l'épisode",
    "en": "Episode progress"
  },
  "Lire l'épisode": {
    "fr": "Lire l'épisode",
    "en": "Play episode"
  },
  "Marquer l'épisode": {
    "fr": "Marquer l'épisode",
    "en": "Mark episode"
  },
  "non vu": {
    "fr": "non vu",
    "en": "unwatched"
  },
  "Impossible de modifier le visionnage": {
    "fr": "Impossible de modifier le visionnage",
    "en": "Couldn't update viewing progress"
  },
  "Impossible de charger la franchise": {
    "fr": "Impossible de charger la franchise",
    "en": "Couldn't load the franchise"
  },
  "Afficher les {0} autres": {
    "fr": "Afficher les {0} autres",
    "en": "Show the other {0}"
  },
  "Saison {0}{1}": {
    "fr": "Saison {0}{1}",
    "en": "Season {0}{1}"
  },
  "(cette fiche)": {
    "fr": "(cette fiche)",
    "en": "(this entry)"
  },
  "Partie de la saison {0}": {
    "fr": "Partie de la saison {0}",
    "en": "Part of season {0}"
  },
  "Aucun anime suivi.": {
    "fr": "Aucun anime suivi.",
    "en": "No anime followed."
  },
  "Sorties non suivies": {
    "fr": "Sorties non suivies",
    "en": "Releases not followed"
  },
  "Ne plus suivre les sorties": {
    "fr": "Ne plus suivre les sorties",
    "en": "Stop following releases"
  },
  "Les anime que tu commences apparaissent ici.": {
    "fr": "Les anime que tu commences apparaissent ici.",
    "en": "Anime you start watching appear here."
  },
  "Retirer du suivi": {
    "fr": "Retirer du suivi",
    "en": "Remove from tracking"
  },
  "Actions pour {0}": {
    "fr": "Actions pour {0}",
    "en": "Actions for {0}"
  },
  "Ne plus suivre les sorties dans le calendrier": {
    "fr": "Ne plus suivre les sorties dans le calendrier",
    "en": "Stop following releases in the calendar"
  },
  "Suivre les sorties dans le calendrier": {
    "fr": "Suivre les sorties dans le calendrier",
    "en": "Follow releases in the calendar"
  },
  "Suivi du visionnage{0}": {
    "fr": "Suivi du visionnage{0}",
    "en": "Viewing progress{0}"
  },
  "Remis en cours": {
    "fr": "Remis en cours",
    "en": "Back in progress"
  },
  "Touche pour ne plus les suivre": {
    "fr": "Touche pour ne plus les suivre",
    "en": "Tap to stop following"
  },
  "Monter {0}": {
    "fr": "Monter {0}",
    "en": "Move {0} up"
  },
  "Descendre {0}": {
    "fr": "Descendre {0}",
    "en": "Move {0} down"
  },
  "Retirer {0}": {
    "fr": "Retirer {0}",
    "en": "Remove {0}"
  },
  "Modifier la liste": {
    "fr": "Modifier la liste",
    "en": "Edit list"
  },
  "Impossible d'enregistrer la liste.": {
    "fr": "Impossible d'enregistrer la liste.",
    "en": "Couldn't save the list."
  },
  "Plus d'actions pour {0}": {
    "fr": "Plus d'actions pour {0}",
    "en": "More actions for {0}"
  },
  "Ses rôles de voix ne sont pas encore affichés ici.": {
    "fr": "Ses rôles de voix ne sont pas encore affichés ici.",
    "en": "Their voice acting roles are not shown here yet."
  },
  "en cours": {
    "fr": "en cours",
    "en": "in progress"
  },
  "Sous-titres : {0}": {
    "fr": "Sous-titres : {0}",
    "en": "Subtitles: {0}"
  },
  "Reculer de {0} secondes": {
    "fr": "Reculer de {0} secondes",
    "en": "Skip back {0} seconds"
  },
  "Avancer de {0} secondes": {
    "fr": "Avancer de {0} secondes",
    "en": "Skip forward {0} seconds"
  },
  "lecture directe · {0}": {
    "fr": "lecture directe · {0}",
    "en": "direct playback · {0}"
  },
  "via le relais de lecture": {
    "fr": "via le relais de lecture",
    "en": "via the playback relay"
  },
  "lecture directe": {
    "fr": "lecture directe",
    "en": "direct playback"
  },
  "relais de lecture": {
    "fr": "relais de lecture",
    "en": "playback relay"
  },
  "Plus tard, {0}": {
    "fr": "Plus tard, {0}",
    "en": "Later, {0}"
  },
  "Fond opaque": {
    "fr": "Fond opaque",
    "en": "Opaque background"
  },
  "traduction automatique": {
    "fr": "traduction automatique",
    "en": "automatic translation"
  },
  "Autres sous-titres…": {
    "fr": "Autres sous-titres…",
    "en": "Other subtitles…"
  },
  "HLS natif": {
    "fr": "HLS natif",
    "en": "Native HLS"
  },
  "Ce flux n'est pas lisible sur cet appareil.": {
    "fr": "Ce flux n'est pas lisible sur cet appareil.",
    "en": "This stream cannot play on this device."
  },
  "Le flux ne se charge pas.": {
    "fr": "Le flux ne se charge pas.",
    "en": "The stream isn't loading."
  },
  "Essaie un autre serveur de cette source.": {
    "fr": "Essaie un autre serveur de cette source.",
    "en": "Try another server from this source."
  },
  "Serveur indisponible essai de « {0} »": {
    "fr": "Serveur indisponible essai de « {0} »",
    "en": "Server unavailable; trying “{0}”"
  },
  "un autre": {
    "fr": "un autre",
    "en": "another one"
  },
  "bascule vers {0} ({1})": {
    "fr": "bascule vers {0} ({1})",
    "en": "switching to {0} ({1})"
  },
  "anime introuvable": {
    "fr": "anime introuvable",
    "en": "anime not found"
  },
  "Aucune correspondance": {
    "fr": "Aucune correspondance",
    "en": "No match"
  },
  "Flux indisponible ({0}) essai de « {1} »": {
    "fr": "Flux indisponible ({0}) essai de « {1} »",
    "en": "Stream unavailable ({0}); trying “{1}”"
  },
  "lecture impossible": {
    "fr": "lecture impossible",
    "en": "playback failed"
  },
  "Ouvrir la fiche de {0}": {
    "fr": "Ouvrir la fiche de {0}",
    "en": "Open details for {0}"
  },
  "Ouvrir la fiche de l'anime": {
    "fr": "Ouvrir la fiche de l'anime",
    "en": "Open anime details"
  },
  "Manga d'origine": {
    "fr": "Manga d'origine",
    "en": "Original manga"
  },
  "Light novel d'origine": {
    "fr": "Light novel d'origine",
    "en": "Original light novel"
  },
  "Roman d'origine": {
    "fr": "Roman d'origine",
    "en": "Original novel"
  },
  "Œuvre d'origine": {
    "fr": "Œuvre d'origine",
    "en": "Original work"
  },
  "du manga": {
    "fr": "du manga",
    "en": "from the manga"
  },
  "Calendrier indisponible pour l’instant.": {
    "fr": "Calendrier indisponible pour l’instant.",
    "en": "Calendar unavailable for now."
  },
  "Hors connexion. Calendrier indisponible.": {
    "fr": "Hors connexion. Calendrier indisponible.",
    "en": "Offline. Calendar unavailable."
  },
  "Aucune sortie ce jour.": {
    "fr": "Aucune sortie ce jour.",
    "en": "No releases today."
  },
  "Suivi {0}": {
    "fr": "Suivi {0}",
    "en": "Following · {0}"
  },
  "Diffusion cette semaine": {
    "fr": "Diffusion cette semaine",
    "en": "Airing this week"
  },
  "Cette saison": {
    "fr": "Cette saison",
    "en": "This season"
  },
  "Films anime": {
    "fr": "Films anime",
    "en": "Anime films"
  },
  "Filtres, {0} actif{1}": {
    "fr": "Filtres, {0} actif{1}",
    "en": "Filters, {0} active{1}"
  },
  "AniList demande une pause": {
    "fr": "AniList demande une pause",
    "en": "AniList needs a pause"
  },
  "Sauvegarde MaximAnim": {
    "fr": "Sauvegarde MaximAnim",
    "en": "MaximAnim backup"
  },
  "Fichier trop volumineux pour une sauvegarde.": {
    "fr": "Fichier trop volumineux pour une sauvegarde.",
    "en": "File too large for a backup."
  },
  "Code de l'extension": {
    "fr": "Code de l'extension",
    "en": "Extension code"
  },
  "Relais de lecture": {
    "fr": "Relais de lecture",
    "en": "Playback relay"
  },
  "HLS natif (Safari)": {
    "fr": "HLS natif (Safari)",
    "en": "Native HLS (Safari)"
  },
  "choix de la source": {
    "fr": "choix de la source",
    "en": "source selection"
  },
  "sous-titres (source)": {
    "fr": "sous-titres (source)",
    "en": "subtitles (source)"
  },
  "sous-titres (externes)": {
    "fr": "sous-titres (externes)",
    "en": "subtitles (external)"
  },
  "en ce moment {0}": {
    "fr": "en ce moment {0}",
    "en": "currently {0}"
  },
  "Autoriser et activer ({0})": {
    "fr": "Autoriser et activer ({0})",
    "en": "Allow and enable ({0})"
  },
  "Autoriser et activer {0}": {
    "fr": "Autoriser et activer {0}",
    "en": "Allow and enable {0}"
  },
  "1 source de secours attend ton autorisation": {
    "fr": "1 source de secours attend ton autorisation",
    "en": "1 fallback source needs your permission"
  },
  "Une source le demande": {
    "fr": "Une source le demande",
    "en": "One source needs this"
  },
  "Examiner et autoriser": {
    "fr": "Examiner et autoriser",
    "en": "Review and allow"
  },
  "Autoriser ({0})": {
    "fr": "Autoriser ({0})",
    "en": "Allow ({0})"
  },
  "Autoriser {0}": {
    "fr": "Autoriser {0}",
    "en": "Allow {0}"
  },
  "Indisponible avec cette source": {
    "fr": "Indisponible avec cette source",
    "en": "Unavailable from this source"
  },
  "Relais de {0} : connexion requise": {
    "fr": "Relais de {0} : connexion requise",
    "en": "{0} relay: sign-in required"
  },
  "Activer {0}": {
    "fr": "Activer {0}",
    "en": "Enable {0}"
  },
  "Aucune pour l'instant": {
    "fr": "Aucune pour l'instant",
    "en": "None yet"
  },
  "Source introuvable.": {
    "fr": "Source introuvable.",
    "en": "Source not found."
  },
  "Script indisponible.": {
    "fr": "Script indisponible.",
    "en": "Script unavailable."
  },
  "Choisie pour cet anime": {
    "fr": "Choisie pour cet anime",
    "en": "Chosen for this anime"
  },
  "Source : {0}. Changer": {
    "fr": "Source : {0}. Changer",
    "en": "Source: {0}. Change"
  },
  "(flux de test)": {
    "fr": "(flux de test)",
    "en": "(test stream)"
  },
  "Pour cet anime : {0}": {
    "fr": "Pour cet anime : {0}",
    "en": "For this anime: {0}"
  },
  "aucune (recherche automatique)": {
    "fr": "aucune (recherche automatique)",
    "en": "none (automatic search)"
  },
  "Modifier la correspondance": {
    "fr": "Modifier la correspondance",
    "en": "Edit match"
  },
  "autorisation requise": {
    "fr": "autorisation requise",
    "en": "permission required"
  },
  "Test en cours {0}/{1}": {
    "fr": "Test en cours {0}/{1}",
    "en": "Testing {0}/{1}"
  },
  "Relancer le test": {
    "fr": "Relancer le test",
    "en": "Run test again"
  },
  "Tester {0} source{1}": {
    "fr": "Tester {0} source{1}",
    "en": "Test {0} source{1}"
  },
  "Utiliser pour cet anime": {
    "fr": "Utiliser pour cet anime",
    "en": "Use for this anime"
  },
  "recherche {0}": {
    "fr": "recherche {0}",
    "en": "search {0}"
  },
  "CC en attente d'autorisation : {0}": {
    "fr": "CC en attente d'autorisation : {0}",
    "en": "CC needs permission: {0}"
  },
  "marqueur de version : {0}": {
    "fr": "marqueur de version : {0}",
    "en": "version marker: {0}"
  },
  "Serveur / option": {
    "fr": "Serveur / option",
    "en": "Server / option"
  },
  "Langues CC utilisables": {
    "fr": "Langues CC utilisables",
    "en": "Usable CC languages"
  },
  "Impossible d'activer la source.": {
    "fr": "Impossible d'activer la source.",
    "en": "Couldn't enable the source."
  },
  "Pour cet anime": {
    "fr": "Pour cet anime",
    "en": "For this anime"
  },
  "flux de test": {
    "fr": "flux de test",
    "en": "test stream"
  },
  "Autre source": {
    "fr": "Autre source",
    "en": "Other source"
  },
  "Non compatibles": {
    "fr": "Non compatibles",
    "en": "Unsupported"
  },
  "il y a {0} h": {
    "fr": "il y a {0} h",
    "en": "{0} h ago"
  },
  "il y a {0} j": {
    "fr": "il y a {0} j",
    "en": "{0} d ago"
  },
  "Connexion requise": {
    "fr": "Connexion requise",
    "en": "Sign-in required"
  },
  "Autoriser et activer": {
    "fr": "Autoriser et activer",
    "en": "Allow and enable"
  },
  "annonce {0}": {
    "fr": "annonce {0}",
    "en": "advertises {0}"
  },
  "Copier l'adresse de {0}": {
    "fr": "Copier l'adresse de {0}",
    "en": "Copy the URL of {0}"
  },
  "Ajouter {0}": {
    "fr": "Ajouter {0}",
    "en": "Add {0}"
  },
  "Lecture du catalogue…": {
    "fr": "Lecture du catalogue…",
    "en": "Reading catalogue…"
  },
  "une piste {0}": {
    "fr": "une piste {0}",
    "en": "one {0} track"
  },
  "une piste de sous-titres": {
    "fr": "une piste de sous-titres",
    "en": "one subtitle track"
  },
  "Seule cette adresse est ajoutée, pour": {
    "fr": "Seule cette adresse est ajoutée, pour",
    "en": "Only this address is added, for"
  },
  "Autoriser pour {0}": {
    "fr": "Autoriser pour {0}",
    "en": "Allow for {0}"
  },
  "Participations en studio secondaire": {
    "fr": "Participations en studio secondaire",
    "en": "Supporting studio credits"
  },
  "depuis {0}": {
    "fr": "depuis {0}",
    "en": "since {0}"
  },
  "Couverture de {0}": {
    "fr": "Couverture de {0}",
    "en": "Cover for {0}"
  },
  "… et {0} autres": {
    "fr": "… et {0} autres",
    "en": "… and {0} others"
  },
  "Voix (VO)": {
    "fr": "Voix (VO)",
    "en": "Voice (original)"
  },
  "Doublage (hors version originale)": {
    "fr": "Doublage (hors version originale)",
    "en": "Dubbing (outside original audio)"
  },
  "Rose original": {
    "fr": "Rose original",
    "en": "Original pink"
  },
  "depuis le {0}": {
    "fr": "depuis le {0}",
    "en": "since {0}"
  },
  "Commencer": {
    "fr": "Commencer",
    "en": "Start"
  },
  "Revoir": {
    "fr": "Revoir",
    "en": "Watch again"
  },
  "Dessin": {
    "fr": "Dessin",
    "en": "Art"
  },
  "Auteur": {
    "fr": "Auteur",
    "en": "Author"
  },
  "{0} sortie{1}": {
    "fr": "{0} sortie{1}",
    "en": "{0} release{1}"
  },
  "{0} introuvable": {
    "fr": "{0} introuvable",
    "en": "{0} not found"
  },
  "Le staff": {
    "fr": "Le staff",
    "en": "The staff"
  },
  "Vu": {
    "fr": "Vu",
    "en": "Watched"
  },
  "Les": {
    "fr": "Les",
    "en": "The"
  },
  "Aller": {
    "fr": "Aller",
    "en": "Go"
  },
  "Nouveau": {
    "fr": "Nouveau",
    "en": "New"
  },
  "Repris": {
    "fr": "Repris",
    "en": "Resumed"
  },
  "Enregistrer": {
    "fr": "Enregistrer",
    "en": "Save"
  },
  "Moyen": {
    "fr": "Moyen",
    "en": "Medium"
  },
  "Bas": {
    "fr": "Bas",
    "en": "Low"
  },
  "Haut": {
    "fr": "Haut",
    "en": "High"
  },
  "Automatique": {
    "fr": "Automatique",
    "en": "Automatic"
  },
  "Chargement": {
    "fr": "Chargement",
    "en": "Loading"
  },
  "Pertinence": {
    "fr": "Pertinence",
    "en": "Relevance"
  },
  "Note": {
    "fr": "Note",
    "en": "Score"
  },
  "Tendances": {
    "fr": "Tendances",
    "en": "Trending"
  },
  "Populaires": {
    "fr": "Populaires",
    "en": "Popular"
  },
  "Lecteur": {
    "fr": "Lecteur",
    "en": "Player"
  },
  "Mode": {
    "fr": "Mode",
    "en": "Mode"
  },
  "Actualiser": {
    "fr": "Actualiser",
    "en": "Refresh"
  },
  "Auteurs": {
    "fr": "Auteurs",
    "en": "Authors"
  },
  "Personne introuvable.": {
    "fr": "Personne introuvable.",
    "en": "Person not found."
  },
  "Studio introuvable.": {
    "fr": "Studio introuvable.",
    "en": "Studio not found."
  },
  "Titre inconnu": {
    "fr": "Titre inconnu",
    "en": "Unknown title"
  },
  "AniList est injoignable.": {
    "fr": "AniList est injoignable.",
    "en": "AniList is unreachable."
  },
  "Anime introuvable.": {
    "fr": "Anime introuvable.",
    "en": "Anime not found."
  },
  "Suite alternative": {
    "fr": "Suite alternative",
    "en": "Alternative sequel"
  },
  "Suite": {
    "fr": "Suite",
    "en": "Sequel"
  },
  "Version alternative": {
    "fr": "Version alternative",
    "en": "Alternative version"
  },
  "Aventure": {
    "fr": "Aventure",
    "en": "Adventure"
  },
  "Drame": {
    "fr": "Drame",
    "en": "Drama"
  },
  "Horreur": {
    "fr": "Horreur",
    "en": "Horror"
  },
  "Psychologique": {
    "fr": "Psychologique",
    "en": "Psychological"
  },
  "Tranche de vie": {
    "fr": "Tranche de vie",
    "en": "Slice of life"
  },
  "Surnaturel": {
    "fr": "Surnaturel",
    "en": "Supernatural"
  },
  "Club scolaire": {
    "fr": "Club scolaire",
    "en": "School club"
  },
  "Distribution chorale": {
    "fr": "Distribution chorale",
    "en": "Ensemble cast"
  },
  "Surtout des personnages masculins": {
    "fr": "Surtout des personnages masculins",
    "en": "Mostly male characters"
  },
  "Personnages adultes": {
    "fr": "Personnages adultes",
    "en": "Adult characters"
  },
  "Militaire": {
    "fr": "Militaire",
    "en": "Military"
  },
  "Magie": {
    "fr": "Magie",
    "en": "Magic"
  },
  "Super-pouvoirs": {
    "fr": "Super-pouvoirs",
    "en": "Superpowers"
  },
  "Espace": {
    "fr": "Espace",
    "en": "Space"
  },
  "Post-apocalyptique": {
    "fr": "Post-apocalyptique",
    "en": "Post-apocalyptic"
  },
  "Manipulation du temps": {
    "fr": "Manipulation du temps",
    "en": "Time manipulation"
  },
  "Survie": {
    "fr": "Survie",
    "en": "Survival"
  },
  "Guerre": {
    "fr": "Guerre",
    "en": "War"
  },
  "Dieux": {
    "fr": "Dieux",
    "en": "Gods"
  },
  "Idoles": {
    "fr": "Idoles",
    "en": "Idols"
  },
  "Cuisine": {
    "fr": "Cuisine",
    "en": "Cooking"
  },
  "Politique": {
    "fr": "Politique",
    "en": "Politics"
  },
  "Affaires royales": {
    "fr": "Affaires royales",
    "en": "Royal affairs"
  },
  "Monde du travail": {
    "fr": "Monde du travail",
    "en": "Workplace"
  },
  "Campagne": {
    "fr": "Campagne",
    "en": "Countryside"
  },
  "Ville": {
    "fr": "Ville",
    "en": "City"
  },
  "Philosophie": {
    "fr": "Philosophie",
    "en": "Philosophy"
  },
  "Triangle amoureux": {
    "fr": "Triangle amoureux",
    "en": "Love triangle"
  },
  "Parodie": {
    "fr": "Parodie",
    "en": "Parody"
  },
  "Mythologie": {
    "fr": "Mythologie",
    "en": "Mythology"
  },
  "Ce fichier n'est pas un JSON valide.": {
    "fr": "Ce fichier n'est pas un JSON valide.",
    "en": "This file is not valid JSON."
  },
  "Ce fichier n'est pas une sauvegarde Maximanim.": {
    "fr": "Ce fichier n'est pas une sauvegarde Maximanim.",
    "en": "This file is not a MaximAnim backup."
  },
  "Sauvegarde invalide (listes en double).": {
    "fr": "Sauvegarde invalide (listes en double).",
    "en": "Invalid backup (duplicate lists)."
  },
  "Choisis un emoji.": {
    "fr": "Choisis un emoji.",
    "en": "Choose an emoji."
  },
  "Le code de l'extension est injoignable.": {
    "fr": "Le code de l'extension est injoignable.",
    "en": "The extension code is unreachable."
  },
  "Code de l'extension trop volumineux.": {
    "fr": "Code de l'extension trop volumineux.",
    "en": "Extension code is too large."
  },
  "Cette source n'indique pas son code.": {
    "fr": "Cette source n'indique pas son code.",
    "en": "This source does not provide its code."
  },
  "Plusieurs correspondances possibles.": {
    "fr": "Plusieurs correspondances possibles.",
    "en": "Several possible matches."
  },
  "La source n'est plus joignable.": {
    "fr": "La source n'est plus joignable.",
    "en": "The source is no longer reachable."
  },
  "Cette source utilise une fonction que la version Web ne propose pas.": {
    "fr": "Cette source utilise une fonction que la version Web ne propose pas.",
    "en": "This source uses a feature unavailable in the web version."
  },
  "Maximanim est injoignable.": {
    "fr": "Maximanim est injoignable.",
    "en": "MaximAnim is unreachable."
  },
  "Connexion requise.": {
    "fr": "Connexion requise.",
    "en": "Sign-in required."
  },
  "Le relais de lecture est indisponible.": {
    "fr": "Le relais de lecture est indisponible.",
    "en": "The playback relay is unavailable."
  },
  "Module Sora sans searchBaseUrl utilisable.": {
    "fr": "Module Sora sans searchBaseUrl utilisable.",
    "en": "Sora module without a usable searchBaseUrl."
  },
  "Une saison": {
    "fr": "Une saison",
    "en": "One season"
  },
  "Films": {
    "fr": "Films",
    "en": "Films"
  },
  "Autres versions": {
    "fr": "Autres versions",
    "en": "Other versions"
  },
  "Adresse invalide.": {
    "fr": "Adresse invalide.",
    "en": "Invalid URL."
  },
  "La source est injoignable.": {
    "fr": "La source est injoignable.",
    "en": "The source is unreachable."
  },
  "Espagnol": {
    "fr": "Espagnol",
    "en": "Spanish"
  },
  "Portugais": {
    "fr": "Portugais",
    "en": "Portuguese"
  },
  "Portugais (BR)": {
    "fr": "Portugais (BR)",
    "en": "Portuguese (BR)"
  },
  "Allemand": {
    "fr": "Allemand",
    "en": "German"
  },
  "Italien": {
    "fr": "Italien",
    "en": "Italian"
  },
  "Arabe": {
    "fr": "Arabe",
    "en": "Arabic"
  },
  "Russe": {
    "fr": "Russe",
    "en": "Russian"
  },
  "Turc": {
    "fr": "Turc",
    "en": "Turkish"
  },
  "Chinois": {
    "fr": "Chinois",
    "en": "Chinese"
  },
  "Vietnamien": {
    "fr": "Vietnamien",
    "en": "Vietnamese"
  },
  "Multilingue": {
    "fr": "Multilingue",
    "en": "Multilingual"
  },
  "Catalogue vide.": {
    "fr": "Catalogue vide.",
    "en": "Empty catalogue."
  },
  "Format de catalogue non reconnu.": {
    "fr": "Format de catalogue non reconnu.",
    "en": "Unrecognised catalogue format."
  },
  "Adresse non prise en charge.": {
    "fr": "Adresse non prise en charge.",
    "en": "Unsupported URL."
  },
  "Lien raw GitHub incomplet.": {
    "fr": "Lien raw GitHub incomplet.",
    "en": "Incomplete GitHub raw link."
  },
  "Le lien doit pointer vers un catalogue .json.": {
    "fr": "Le lien doit pointer vers un catalogue .json.",
    "en": "The link must point to a .json catalogue."
  },
  "Catalogue illisible.": {
    "fr": "Catalogue illisible.",
    "en": "Unreadable catalogue."
  },
  "Catalogue trop volumineux.": {
    "fr": "Catalogue trop volumineux.",
    "en": "Catalogue too large."
  },
  "Le fichier n'est pas un JSON valide.": {
    "fr": "Le fichier n'est pas un JSON valide.",
    "en": "The file is not valid JSON."
  },
  "Cet index ne contient aucun module d'anime.": {
    "fr": "Cet index ne contient aucun module d'anime.",
    "en": "This index has no anime modules."
  },
  "Moteur Mangayomi JS": {
    "fr": "Moteur Mangayomi JS",
    "en": "Mangayomi JS engine"
  },
  "Moteur Sora": {
    "fr": "Moteur Sora",
    "en": "Sora engine"
  },
  "Format inconnu": {
    "fr": "Format inconnu",
    "en": "Unknown format"
  },
  "Extension APK Android (Aniyomi).": {
    "fr": "Extension APK Android (Aniyomi).",
    "en": "Android APK extension (Aniyomi)."
  },
  "Non compatible": {
    "fr": "Non compatible",
    "en": "Unsupported"
  },
  "Format d'extension non reconnu.": {
    "fr": "Format d'extension non reconnu.",
    "en": "Unrecognised extension format."
  },
  "Luna uniquement": {
    "fr": "Luna uniquement",
    "en": "Luna only"
  },
  "Compatible avec le runtime Web": {
    "fr": "Compatible avec le runtime Web",
    "en": "Compatible with the web runtime"
  },
  "Pas encore d'historique": {
    "fr": "Pas encore d'historique",
    "en": "No history yet"
  },
  "Fiable": {
    "fr": "Fiable",
    "en": "Reliable"
  },
  "Instable": {
    "fr": "Instable",
    "en": "Unstable"
  },
  "Relais de lecture indisponible": {
    "fr": "Relais de lecture indisponible",
    "en": "Playback relay unavailable"
  },
  "Anime introuvable dans cette source": {
    "fr": "Anime introuvable dans cette source",
    "en": "Anime not found in this source"
  },
  "Erreur de la source": {
    "fr": "Erreur de la source",
    "en": "Source error"
  },
  "Plusieurs correspondances": {
    "fr": "Plusieurs correspondances",
    "en": "Several matches"
  },
  "Permission requise": {
    "fr": "Permission requise",
    "en": "Permission required"
  },
  "Erreur source": {
    "fr": "Erreur source",
    "en": "Source error"
  },
  "Manuel": {
    "fr": "Manuel",
    "en": "Manual"
  },
  "Aucun flux en audio original": {
    "fr": "Aucun flux en audio original",
    "en": "No stream with original audio"
  },
  "Doublage anglais": {
    "fr": "Doublage anglais",
    "en": "English dub"
  },
  "Multi-audio": {
    "fr": "Multi-audio",
    "en": "Multiple audio tracks"
  },
  "La source n'a fourni aucune piste de sous-titres": {
    "fr": "La source n'a fourni aucune piste de sous-titres",
    "en": "The source provided no subtitle tracks"
  },
  "Traduction interrompue.": {
    "fr": "Traduction interrompue.",
    "en": "Translation interrupted."
  },
  "Connexion requise pour traduire": {
    "fr": "Connexion requise pour traduire",
    "en": "Sign-in required to translate"
  },
  "Quota de traduction atteint": {
    "fr": "Quota de traduction atteint",
    "en": "Translation quota reached"
  },
  "Traduction trop lente": {
    "fr": "Traduction trop lente",
    "en": "Translation too slow"
  },
  "Traduction injoignable": {
    "fr": "Traduction injoignable",
    "en": "Translation unreachable"
  },
  "Traduction indisponible": {
    "fr": "Traduction indisponible",
    "en": "Translation unavailable"
  },
  "Le relais invité est désactivé en production. Les sources qui nécessitent un relais demandent une connexion ; le suivi et les listes restent utilisables sans compte.": {
    "fr": "Le relais invité est désactivé en production. Les sources qui nécessitent un relais demandent une connexion ; le suivi et les listes restent utilisables sans compte.",
    "en": "Guest media relay is disabled in production. Sources that need a relay require sign-in; tracking and lists remain available without an account."
  },
  "Le catalogue et le suivi local restent utilisables sans compte. En production, les sources qui nécessitent un relais demandent une connexion MaximAnim.": {
    "fr": "Le catalogue et le suivi local restent utilisables sans compte. En production, les sources qui nécessitent un relais demandent une connexion MaximAnim.",
    "en": "The catalogue and local tracking remain available without an account. In production, sources that need a relay require MaximAnim sign-in."
  },
  "Le relais invité est désactivé en production. Connecte-toi pour utiliser un relais autorisé.": {
    "fr": "Le relais invité est désactivé en production. Connecte-toi pour utiliser un relais autorisé.",
    "en": "Guest relay is disabled in production. Sign in to use an authorised relay."
  },
  "Marquer comme vus": {
    "fr": "Marquer comme vus",
    "en": "Mark as watched"
  },
  "Les {0} épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.": {
    "fr": "Les {0} épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.",
    "en": "The {0} available episodes in this season will be marked as watched. Other seasons, history and lists are preserved."
  },
  " du manga": {
    "fr": " du manga",
    "en": " of the manga"
  },
  " uniquement.": {
    "fr": " uniquement.",
    "en": " only."
  },
  "Envoi…": {
    "fr": "Envoi…",
    "en": "Sending…"
  },
  "Actualisation…": {
    "fr": "Actualisation…",
    "en": "Refreshing…"
  },
  "Ajout…": {
    "fr": "Ajout…",
    "en": "Adding…"
  },
  " (flux de test)": {
    "fr": " (flux de test)",
    "en": " (test stream)"
  },
  "https://github.com/propriétaire/dépôt": {
    "fr": "https://github.com/propriétaire/dépôt",
    "en": "https://github.com/owner/repository"
  },
  "{0} d'origine": {
    "fr": "{0} d'origine",
    "en": "Source {0}"
  },
  "{0}/{1} vus": {
    "fr": "{0}/{1} vus",
    "en": "{0}/{1} watched"
  },
  "{0} vus sur {1}": {
    "fr": "{0} vus sur {1}",
    "en": "{0} watched of {1}"
  },
  "{0} sur {1}": {
    "fr": "{0} sur {1}",
    "en": "{0} of {1}"
  },
  "{0} % du bas": {
    "fr": "{0} % du bas",
    "en": "{0}% from bottom"
  },
  "{0} actives / {1}": {
    "fr": "{0} actives / {1}",
    "en": "{0} enabled / {1}"
  },
  "jamais": { "fr": "jamais", "en": "never" },
  "Synchronisation…": { "fr": "Synchronisation…", "en": "Syncing…" },
  "Index Sora · FR, EN et autres": { "fr": "Index Sora · FR, EN et autres", "en": "Sora index · FR, EN and others" },
  "{0} : {1} autre source": { "fr": "{0} : {1} autre source", "en": "{0}: {1}; trying another source" },
  "{0} choisie pour cet anime": { "fr": "{0} choisie pour cet anime", "en": "{0} selected for this anime" },
  "{0} {1} source{2}": { "fr": "{0} {1} source{2}", "en": "{0} {1} source{2}" },
  "Autoriser pour essayer": { "fr": "Autoriser pour essayer", "en": "Allow to try" },
  "{0} demande l'accès à : {1}": { "fr": "{0} demande l'accès à : {1}", "en": "{0} asks for access to: {1}" },
  "Une autorisation permet d'essayer la source ; elle ne garantit pas qu'un flux fonctionne.": { "fr": "Une autorisation permet d'essayer la source ; elle ne garantit pas qu'un flux fonctionne.", "en": "Allowing access lets the source be tried; it does not guarantee that a stream works." },
  "Essayer une autre source": { "fr": "Essayer une autre source", "en": "Try another source" },
  "Le relais de {0} demande une connexion MaximAnim. Le suivi et les listes restent locaux sans compte.": { "fr": "Le relais de {0} demande une connexion MaximAnim. Le suivi et les listes restent locaux sans compte.", "en": "The relay of {0} needs a MaximAnim sign-in. Tracking and lists stay local without an account." },
  "La recherche dure plus longtemps que prévu : relance-la ou essaie une autre source.": { "fr": "La recherche dure plus longtemps que prévu : relance-la ou essaie une autre source.", "en": "The search is taking longer than expected: restart it or try another source." },
  "Fiche": { "fr": "Fiche", "en": "Details" },
  "Fiche du film": { "fr": "Fiche du film", "en": "Film details" },
  "Équipe de l'épisode": { "fr": "Équipe de l'épisode", "en": "Episode crew" },
  "Équipe de la série": { "fr": "Équipe de la série", "en": "Series crew" },
  "Studios d'animation": { "fr": "Studios d'animation", "en": "Animation studios" },
  "En cours de lecture": { "fr": "En cours de lecture", "en": "Now watching" },
  "à regarder": { "fr": "à regarder", "en": "up next" },
  "Aucun épisode disponible pour le moment": { "fr": "Aucun épisode disponible pour le moment", "en": "No episodes available yet" },
  "Équipe du film": { "fr": "Équipe du film", "en": "Film crew" },
  "Studios": { "fr": "Studios", "en": "Studios" },
  "Préc.": { "fr": "Préc.", "en": "Prev." },
  "Recherche rapide": { "fr": "Recherche rapide", "en": "Quick search" },
  "Résultats": { "fr": "Résultats", "en": "Results" },
  "Retirer {0} des récents": { "fr": "Retirer {0} des récents", "en": "Remove {0} from recents" },
  "Tapez au moins deux lettres du titre.": { "fr": "Tapez au moins deux lettres du titre.", "en": "Type at least two letters of the title." },
  "Recherche…": { "fr": "Recherche…", "en": "Searching…" },
  "La recherche n'a pas abouti.": { "fr": "La recherche n'a pas abouti.", "en": "The search did not go through." },
  "Hors ligne : la recherche attend la connexion.": { "fr": "Hors ligne : la recherche attend la connexion.", "en": "Offline: search waits for a connection." },
  "Aucun résultat pour « {0} ».": { "fr": "Aucun résultat pour « {0} ».", "en": "No result for “{0}”." },
  "Tous les résultats": { "fr": "Tous les résultats", "en": "All results" },
  "Suiv.": { "fr": "Suiv.", "en": "Next" },
  "Équipe complète": { "fr": "Équipe complète", "en": "Full crew" },
  "sur {0}": { "fr": "sur {0}", "en": "of {0}" },
  "+ {0} autres": { "fr": "+ {0} autres", "en": "+ {0} more" },
  "Prévision": { "fr": "Prévision", "en": "Forecast" }
} as const;
export type MessageKey = keyof typeof messages;
