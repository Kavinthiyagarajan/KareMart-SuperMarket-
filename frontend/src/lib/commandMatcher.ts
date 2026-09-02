// src/lib/commandMatcher.ts

/**
 * Normalizes a raw user input for deterministic matching.
 * - lowercases
 * - trims whitespace
 * - removes punctuation (except for letters and numbers)
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ');
}

// Mapping of synonyms to canonical command keys
const synonymMap: Record<string, string> = {
  // wishlist
  wishlist: 'wishlist',
  'saved items': 'wishlist',
  'saved products': 'wishlist',
  favorites: 'wishlist',
  // orders
  orders: 'orders',
  'my orders': 'orders',
  'order history': 'orders',
  'previous orders': 'orders',
  // cart
  cart: 'cart',
  'my cart': 'cart',
  'shopping cart': 'cart',
  // deals
  deals: 'deals',
  offers: 'deals',
  discounts: 'deals',
  sale: 'deals',
  // support
  support: 'support',
  'customer support': 'support',
  'contact support': 'support',
  // help
  help: 'help',
  faq: 'help',
  questions: 'help',
  // addresses
  addresses: 'addresses',
  // notifications
  notifications: 'notifications',
  // profile/account
  account: 'profile',
  'my account': 'profile',
  // admin
  'admin dashboard': 'admin',
  admin: 'admin',
};

// Mapping of command keys to routes (some depend on auth/role handled elsewhere)
const commandRouteMap: Record<string, string> = {
  wishlist: '/profile/wishlist',
  orders: '/profile/orders',
  cart: '/cart',
  deals: '/deals',
  addresses: '/profile/addresses',
  notifications: '/profile/notifications',
  support: '/support',
  help: '/help',
  profile: '/profile',
  admin: '/admin',
};

/**
 * Attempts to resolve a normalized query to a navigation route.
 * Returns the route string if a match is found, otherwise null.
 */
export function resolveCommand(query: string): string | null {
  const norm = normalize(query);
  // Direct match
  if (commandRouteMap[norm]) {
    return commandRouteMap[norm];
  }
  // Synonym match
  const key = synonymMap[norm];
  if (key && commandRouteMap[key]) {
    return commandRouteMap[key];
  }
  // Phrase match – look for known words inside the query
  for (const [syn, cmd] of Object.entries(synonymMap)) {
    if (norm.includes(syn)) {
      const route = commandRouteMap[cmd];
      if (route) return route;
    }
  }
  return null;
}

/**
 * Returns a list of possible navigation commands that match the query prefix.
 * Used for suggestion dropdown.
 */
export function suggestCommands(query: string, isAdmin: boolean, isAuthenticated: boolean): { label: string; route: string }[] {
  const norm = normalize(query);
  const suggestions: { label: string; route: string }[] = [];
  for (const [key, route] of Object.entries(commandRouteMap)) {
    // filter admin
    if (key === 'admin' && !isAdmin) continue;
    // auth‑only routes
    const authOnly = ['wishlist', 'orders', 'cart', 'profile', 'addresses', 'notifications'];
    if (authOnly.includes(key) && !isAuthenticated) continue;
    const label = key.replace(/_/g, ' ');
    if (!norm || label.startsWith(norm) || norm.includes(label)) {
      suggestions.push({ label: `Go to ${label.charAt(0).toUpperCase() + label.slice(1)}`, route });
    }
  }
  return suggestions;
}
