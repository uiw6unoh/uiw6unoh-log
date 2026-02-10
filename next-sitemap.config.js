const path = require("path")
const { CONFIG } = require("./site.config")

module.exports = {
  siteUrl: CONFIG.link,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  generateIndexSitemap: false,
  additionalPaths: async () => {
    const manifest = require(path.resolve(".next/prerender-manifest.json"))
    return Object.keys(manifest.routes)
      .filter((route) => route !== "/")
      .map((route) => ({
        loc: route,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.7,
      }))
  },
}
