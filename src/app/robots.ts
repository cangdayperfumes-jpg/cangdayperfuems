import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cangday.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/tr/checkout/", "/en/checkout/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
