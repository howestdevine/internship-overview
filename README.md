# Stage-overzicht

Webpagina met de goedgekeurde stagevoorstellen uit de Airtable-view **Overzicht** (tabel *Bedrijf stagevoorstel*).
Zoeken, filteren op tags en een detailvenster per bedrijf. Geen npm-packages nodig, enkel Node ≥ 20.6.

## Instellen

1. Maak een token aan op <https://airtable.com/create/tokens>
   - Scope: `data.records:read`
   - Access: base *Internship_base*
2. `cp .env.example .env` en vul `AIRTABLE_TOKEN` en `AIRTABLE_BASE_ID` in
   (de base-ID begint met `app…` en staat in de URL van je base).

## Gebruik

**Live (altijd actuele data, 5 min cache):**

```bash
npm start
```

Open daarna <http://localhost:3000>.

**Statische versie (één HTML-bestand, overal te hosten):**

```bash
npm run build
```

Dit maakt `dist/index.html` met de data erin. Draai het opnieuw als er voorstellen bijkomen.

## Welke voorstellen verschijnen?

De records uit de view *Overzicht*, en daarvan enkel die met `Status = Goedgekeurd`
(`STATUS_FIELD` / `STATUS_VALUE`), ook als de view-filter in Airtable ooit wijzigt.
Ze staan op datum van toevoeging (veld *Created*), nieuwste eerst.

Wordt de bedrijfsnaam niet goed herkend? Zet `TITLE_FIELD` op de exacte veldnaam.

## Publiceren op GitHub Pages

De workflow `.github/workflows/deploy.yml` bouwt de pagina en zet ze op GitHub Pages:
bij elke push naar `main`, elk uur tijdens werkdagen, en handmatig via *Actions → Publiceer stage-overzicht → Run workflow*.

Eenmalig instellen op github.com:

1. *Settings → Secrets and variables → Actions → New repository secret*: `AIRTABLE_TOKEN` = je Airtable-token.
2. *Settings → Pages → Build and deployment → Source*: **GitHub Actions**.

> Het token staat nooit in de gepubliceerde pagina; enkel de data van de goedgekeurde voorstellen.
> GitHub pauzeert geplande workflows na 60 dagen zonder activiteit in de repo. Krijg je daar een mail over, klik dan op *Enable workflow*.

## Embedden in Leho (Canvas)

Maak een pagina, open de HTML-editor (`</>`) en plak:

```html
<iframe src="https://GEBRUIKERSNAAM.github.io/REPO/?embed=1" title="Stagevoorstellen" width="100%" height="900" style="border:0"></iframe>
```

Met `?embed=1` verdwijnt de grote titel en gebruikt de pagina altijd het lichte thema, zodat ze naadloos in Leho past.

## Statistieken (Umami)

Anonieme, cookieloze statistieken via [Umami Cloud](https://cloud.umami.is). Het script wordt enkel toegevoegd als
`UMAMI_WEBSITE_ID` gezet is (in de workflow), en telt enkel op `devinekask.github.io`; lokaal wordt niets gemeten.

Gemeten events: `visit` (leho/direct), `open-proposal`, `save-proposal`, `contact-email`, `contact-website`,
`copy-link`, `filter-region`, `filter-tag`, `filter-saved` — telkens met bedrijfsnaam, tag of regio. Zoektermen worden niet gemeten.
