/**
 * Configuration du domaine officiel Ivoire Couvée d'Or
 * Modifiez ici pour propager partout dans l'app.
 */

export const APP_DOMAIN = 'https://ivoirecouveedor.com';
export const APP_NAME = "Ivoire Couvée d'Or";
export const APP_SHORT_NAME = "IvCouvée";
export const APP_TAGLINE = "L'Intelligence au service de l'Aviculture";
export const APP_PHONE = '+225 01 03 03 64 62';
export const APP_EMAIL = 'contact@ivoirecouveedor.com';
export const APP_LOGO_URL = `${APP_DOMAIN}/logo-512.png`;
export const APP_OG_IMAGE = `${APP_DOMAIN}/logo-512.png`;

/** Retourne l'URL absolue d'une page */
export const pageUrl = (path = '/') =>
  `${APP_DOMAIN}${path.startsWith('/') ? path : '/' + path}`;
