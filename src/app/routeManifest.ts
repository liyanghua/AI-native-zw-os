export const roleRouteManifest = {
  canonical: {
    boss: "/boss",
    operations_director: "/operations-director",
    product_rnd_director: "/product-rnd-director",
    visual_director: "/visual-director",
  },
  aliases: {
    "/product-director": "/product-rnd-director",
  },
} as const;
