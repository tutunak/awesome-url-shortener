# Site & deployment

The site at **https://shorteners.tutunak.com** is a Hugo build of `README.md`.
There is no second copy of the data: `layouts/partials/parse-readme.html` reads
the markdown at build time and turns every `* [name](url) - description` line
into a card. Edit the list, rebuild, done.

## Local

```sh
npm install        # pulls Hugo (hugo-extended) and wrangler — no global installs
npm run dev        # http://localhost:1313, live reload on README.md edits
npm run build      # writes ./public
npm run preview    # build + serve ./public through the real Workers runtime
```

## Deploy from Cloudflare (Workers Builds)

Deploys are triggered from the Cloudflare dashboard, not from CI in this repo.

**One-time setup**

1. Push this branch to GitHub.
2. Cloudflare dashboard → **Compute (Workers)** → **Create** → **Import a repository**
   → authorise GitHub → pick `tutunak/awesome-url-shortener`.
3. Build settings:

   | Field | Value |
   | --- | --- |
   | Worker name | `awesome-url-shorteners` (must match `name` in `wrangler.jsonc`) |
   | Production branch | `master` |
   | Root directory | *(leave empty — repo root)* |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |

4. **Turn off automatic deployments**: Worker → **Settings** → **Builds** →
   disable *Automatic deployments* for the production branch. Pushes then stop
   triggering anything on their own.
5. First deploy: **Deployments** → **Create deployment** (or *Retry build*).
   Every later deploy is that same button.

**Custom domain** — `wrangler.jsonc` already declares it:

```jsonc
"routes": [{ "pattern": "shorteners.tutunak.com", "custom_domain": true }]
```

On first deploy wrangler creates the DNS record itself, provided the
`tutunak.com` zone lives in the same Cloudflare account. If it does not, delete
that block and attach the domain by hand under Worker → **Settings** →
**Domains & Routes** → **Add** → **Custom domain**.

Changing the hostname means changing two things: the `routes` pattern above and
`baseURL` in `hugo.toml` (it feeds canonical URLs, `sitemap.xml` and
`robots.txt`).

## Deploy from your laptop instead

```sh
npx wrangler login
npm run build && npm run deploy
```

Same Worker, same custom domain — useful when you want a deploy without opening
the dashboard.

## How the build is pinned

`hugo-extended` is a devDependency, so Cloudflare builds with the exact Hugo
version in `package-lock.json` instead of whatever its build image happens to
ship. There is no `HUGO_VERSION` variable to keep in sync. Node comes from
`.nvmrc` (22).

## Adding or editing a service

Edit `README.md` only. Keep the format `* [NAME](URL) - Description.` and the
alphabetical order — the site renders sections in README order and entries in
the order it finds them. New `## Heading` sections appear automatically; give
one a nicer title and blurb through `[[params.sections]]` in `hugo.toml` if you
want. A heading with no list items under it (like `## Contributing`) is skipped.

Cards cross-reference themselves: an entry listed in both the hosted and
self-hosted sections gets a *self-hostable* / *hosted option* badge, computed
from the name appearing twice.

**If the Hugo download ever fails in a Cloudflare build** (the `hugo-extended`
package fetches its binary from GitHub releases at install time), fall back to
the build image's own Hugo: set the build command to `hugo --gc --minify` and add
a build variable `HUGO_VERSION` matching the version in `package.json`.
