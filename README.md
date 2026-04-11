# Drone Report

An interactive presentation of US drone strikes in Afghanistan, Pakistan, Yemen, and Somalia, 2002–2020.

**Live site:** https://j0nathanb.github.io/drone_report

5,184 strikes. Between 9,418 and 17,800 people killed. Between 977 and 2,300 of them civilians, including 326 to 480 children. The numbers are ranges because that is how the record exists — the journalism is the most complete public accounting there is, and it is still full of holes. The site is built around showing both the data and the shape of what it cannot show.

## What's here

Four sections:

1. **The Story** — the narrative arc across three administrations and four countries.
2. **The Data** — an interactive map with a timeline brush, resolution slider (country / province / district / location), fog-of-war vs. heat-map views, and filters by country, casualty type, and min/max estimate.
3. **The Gap** — three visualizations of what the record fails to show: the 77% of Afghanistan strikes reporting zero casualties, the deadliest strikes with no journalism attached to them, and the min–max uncertainty rendered as a Sankey diagram.
4. **About** — methodology, sources, and geographic-confidence table.

## Data

- **Strike data:** [The Bureau of Investigative Journalism](https://www.thebureauinvestigates.com/projects/drone-war) (TBIJ) — dates, locations, casualty ranges, source articles.
- **Geographic boundaries:** [geoBoundaries](https://www.geoboundaries.org/) for administrative polygons; [NGA GeoNames](https://geonames.nga.mil/geonames/GNSHome/index.html) for place-name normalization.
- **Matching:** TBIJ location strings are joined to geoBoundaries/NGA via the notebooks under `data/cleanup/` (a sequence of normalize → match → aggregate → emit GeoJSON steps).

## Stack

Plain static site — no build step.

- [Leaflet](https://leafletjs.com/) for the map
- [D3 v7](https://d3js.org/) + [d3-sankey](https://github.com/d3/d3-sankey) for the timeline, zero-casualty grid, and Sankey diagram
- Vanilla JS, HTML, CSS

## Running locally

Any static file server works:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Project structure

```
index.html              Single-page entry
css/styles.css          All styles
js/main.js              All interactive logic
data/                   GeoJSON (optimized) + TBIJ source + cleanup notebooks
  cleanup/              Jupyter pipeline: normalize, match, aggregate, emit
  geoboundaries/        Raw administrative boundaries
  nga/                  NGA GeoNames reference data
  tbij/                 TBIJ strike database
assets/
  articles/             TBIJ article cross-reference
  images/               Hero and supporting imagery
```

## Credits

Data and journalism by **The Bureau of Investigative Journalism**. This project presents their work interactively; the journalism is theirs, the visualization of what is missing is this project's contribution.
