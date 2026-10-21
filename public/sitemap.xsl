<?xml version="1.0" encoding="UTF-8"?>
<!-- Human-readable view of /sitemap.xml and /sitemaps/*.xml in a browser.
     Search engines ignore this and read the XML itself. -->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="s xhtml image">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Cangday — Sitemap</title>
        <style>
          :root { --ink:#120D0A; --ivory:#F5EFE6; --gold:#C9A24B; --gold-deep:#8A6A2F; --line:#E4D9C6; --muted:#6E655C; }
          * { box-sizing: border-box; }
          body { margin:0; background:var(--ivory); color:var(--ink); font:14px/1.5 -apple-system, "Segoe UI", Roboto, sans-serif; }
          header { background:var(--ink); color:var(--ivory); padding:28px 16px; }
          .wrap { max-width:1100px; margin:0 auto; padding:0 16px; }
          h1 { margin:0; font:600 26px/1.2 Georgia, serif; letter-spacing:.5px; }
          h1 span { color:var(--gold); }
          header p { margin:8px 0 0; color:rgba(245,239,230,.7); }
          main { padding:24px 0 48px; }
          .stats { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
          .stat { background:#fff; border:1px solid var(--line); border-left:3px solid var(--gold); border-radius:4px; padding:10px 14px; }
          .stat b { display:block; font-size:20px; }
          .stat span { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--muted); }
          table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); border-radius:4px; overflow:hidden; }
          th { background:var(--ink); color:var(--ivory); text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:1px; padding:10px 12px; }
          td { padding:9px 12px; border-top:1px solid var(--line); vertical-align:top; }
          tr:nth-child(even) td { background:#FBF8F3; }
          a { color:var(--ink); text-decoration:none; word-break:break-all; }
          a:hover { color:var(--gold-deep); text-decoration:underline; }
          .muted { color:var(--muted); white-space:nowrap; }
          .tag { display:inline-block; font-size:11px; font-weight:600; padding:1px 7px; border-radius:99px; background:rgba(201,162,75,.15); color:var(--gold-deep); margin:2px 4px 0 0; }
          .back { display:inline-block; margin-bottom:14px; color:var(--gold-deep); font-weight:600; }
          @media (max-width:640px) { .hide-sm { display:none; } td, th { padding:8px; } }
        </style>
      </head>
      <body>
        <header>
          <div class="wrap">
            <h1>CANGDAY <span>Sitemap</span></h1>
            <p>The pages search engines can find on cangdayperfume.com. This page is for people — Google reads the underlying XML.</p>
          </div>
        </header>
        <main class="wrap">
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <div class="stats">
                <div class="stat"><b><xsl:value-of select="count(s:sitemapindex/s:sitemap)" /></b><span>Sections</span></div>
              </div>
              <table>
                <tr><th>Section</th><th class="hide-sm">Last updated</th></tr>
                <xsl:for-each select="s:sitemapindex/s:sitemap">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                    <td class="muted hide-sm"><xsl:value-of select="substring(s:lastmod, 1, 10)" /></td>
                  </tr>
                </xsl:for-each>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <a class="back" href="/sitemap.xml">← All sections</a>
              <div class="stats">
                <div class="stat"><b><xsl:value-of select="count(s:urlset/s:url)" /></b><span>URLs</span></div>
                <div class="stat"><b><xsl:value-of select="count(s:urlset/s:url/image:image)" /></b><span>Images</span></div>
              </div>
              <table>
                <tr><th>Page</th><th class="hide-sm">Languages</th><th class="hide-sm">Updated</th><th class="hide-sm">Priority</th></tr>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                    <td class="hide-sm">
                      <xsl:for-each select="xhtml:link[@hreflang != 'x-default']">
                        <span class="tag"><xsl:value-of select="@hreflang" /></span>
                      </xsl:for-each>
                    </td>
                    <td class="muted hide-sm"><xsl:value-of select="substring(s:lastmod, 1, 10)" /></td>
                    <td class="muted hide-sm"><xsl:value-of select="s:priority" /></td>
                  </tr>
                </xsl:for-each>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
