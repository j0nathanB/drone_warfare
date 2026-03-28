/* ============================================
   SUM OF STORIES — Main Application
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────

  const COUNTRIES = ['AFG', 'PAK', 'YEM', 'SOM'];
  const COUNTRY_COLORS = {
    AFG: '#7a9abf',
    PAK: '#8ab47a',
    YEM: '#c4956a',
    SOM: '#b47a8a'
  };

  const ADM_LEVELS = ['Adm_0', 'Adm_1', 'Adm_2', 'Loc'];
  const ADM_FILES = {
    AFG: { Adm_0: 'AFG_Adm_0-optimized.geojson', Adm_1: 'AFG_Adm_1-optimized.geojson', Adm_2: 'AFG_Adm_2-optimized.geojson', Loc: 'AFG_Loc-optimized.geojson' },
    PAK: { Adm_0: 'PAK_Adm_0-optimized.geojson', Adm_1: 'PAK_Adm_1-optimized.geojson', Adm_2: 'PAK_Adm_2-optimized.geojson', Loc: 'PAK_Loc-optimized.geojson' },
    YEM: { Adm_0: 'YEM_Adm_0-optimized.geojson', Adm_1: 'YEM_Adm_1-optimized.geojson', Adm_2: 'YEM_Adm_2-optimized.geojson', Loc: 'YEM_Loc-optimized.geojson' },
    SOM: { Adm_0: 'SOM_Adm_0-optimized.geojson', Adm_1: 'SOM_Adm_1-optimized.geojson', Adm_2: 'SOM_Adm_2-optimized.geojson', Loc: 'SOM_Loc-optimized.geojson' }
  };

  // Presidential administration date ranges
  const ADMINS = {
    bush1: { start: new Date(2001, 0, 20), end: new Date(2005, 0, 20), label: 'Bush I' },
    bush2: { start: new Date(2005, 0, 20), end: new Date(2009, 0, 20), label: 'Bush II' },
    obama1: { start: new Date(2009, 0, 20), end: new Date(2013, 0, 20), label: 'Obama I' },
    obama2: { start: new Date(2013, 0, 20), end: new Date(2017, 0, 20), label: 'Obama II' },
    trump: { start: new Date(2017, 0, 20), end: new Date(2021, 0, 20), label: 'Trump' }
  };

  // Sankey casualty data by country (from chat_notes.md)
  const CASUALTY_DATA = {
    AFG: { min_total: 4148, max_total: 10123, min_civilians: 330, max_civilians: 878, min_children: 102, max_children: 198 },
    PAK: { min_total: 2515, max_total: 4026, min_civilians: 424, max_civilians: 969, min_children: 172, max_children: 207 },
    YEM: { min_total: 1513, max_total: 2112, min_civilians: 207, max_civilians: 325, min_children: 51, max_children: 61 },
    SOM: { min_total: 1242, max_total: 1539, min_civilians: 16, max_civilians: 128, min_children: 1, max_children: 14 }
  };

  // ── State ──────────────────────────────────

  const state = {
    view: 'fog',           // 'fog' or 'heat'
    resolution: 3,         // 0-3 (Adm_0, Adm_1, Adm_2, Loc)
    lethality: 'total',    // 'total', 'civilians', 'children'
    estimate: 'min',       // 'min' or 'max'
    countries: new Set(['AFG', 'PAK', 'YEM', 'SOM']),
    admins: new Set(['bush1', 'bush2', 'obama1', 'obama2', 'trump']),
    dateRange: [new Date(2002, 10, 1), new Date(2020, 2, 31)],
    playing: false,
    playTimer: null,
    // Sankey state
    sankeyEstimate: 'min',
    sankeyCountry: 'all'
  };

  // ── Data Store ─────────────────────────────

  const geodata = {};  // geodata[country][level] = geojson

  // ── Map ────────────────────────────────────

  let map, currentLayers = [];

  function initMap() {
    map = L.map('map', {
      center: [25, 55],
      zoom: 4,
      minZoom: 3,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Dark basemap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('Tiles: CARTO | Data: TBIJ')
      .addTo(map);
  }

  // ── Data Loading ───────────────────────────

  async function loadAllData() {
    const promises = [];

    for (const country of COUNTRIES) {
      geodata[country] = {};
      for (const level of ADM_LEVELS) {
        const file = ADM_FILES[country][level];
        if (!file) continue;
        promises.push(
          fetch(`data/${file}`)
            .then(r => r.json())
            .then(data => {
              // Fix Loc coordinate ordering: files have [lat, lon], need [lon, lat]
              if (level === 'Loc') {
                for (const feature of data.features) {
                  const coords = feature.geometry.coordinates;
                  feature.geometry.coordinates = [coords[1], coords[0]];
                }
              }
              geodata[country][level] = data;
            })
            .catch(err => console.warn(`Failed to load ${file}:`, err))
        );
      }
    }

    await Promise.all(promises);
  }

  // ── Date Parsing ───────────────────────────

  function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle DD/MM/YYYY (Loc files)
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      return new Date(+y, +m - 1, +d);
    }
    // Handle YYYY-MM-DD (Adm files)
    return new Date(dateStr);
  }

  // ── Filtering ──────────────────────────────

  function isDateInRange(date) {
    if (!date) return true;
    return date >= state.dateRange[0] && date <= state.dateRange[1];
  }

  function isDateInAdmins(date) {
    if (!date) return true;
    for (const [key, admin] of Object.entries(ADMINS)) {
      if (state.admins.has(key) && date >= admin.start && date < admin.end) {
        return true;
      }
    }
    return false;
  }

  function getFilteredStats(props) {
    const dates = (props.dates || []).map(parseDate);
    const prefix = state.estimate === 'min' ? 'min' : 'max';

    let lethalityKey;
    if (state.lethality === 'total') lethalityKey = 'total';
    else if (state.lethality === 'civilians') lethalityKey = 'civilians';
    else lethalityKey = 'children';

    const values = props[`${prefix}_${lethalityKey}`] || props[`${prefix}_total`] || [];
    const allTotal = props[`${prefix}_total`] || [];
    const allCiv = props[`${prefix}_civilians`] || [];
    const allChildren = props[`${prefix}_children`] || [];

    let filteredValue = 0;
    let filteredTotal = 0;
    let filteredCiv = 0;
    let filteredChildren = 0;
    let filteredStrikeCount = 0;

    for (let i = 0; i < dates.length; i++) {
      if (isDateInRange(dates[i]) && isDateInAdmins(dates[i])) {
        filteredValue += (values[i] || 0);
        filteredTotal += (allTotal[i] || 0);
        filteredCiv += (allCiv[i] || 0);
        filteredChildren += (allChildren[i] || 0);
        filteredStrikeCount++;
      }
    }

    return {
      value: filteredValue,
      total: filteredTotal,
      civilians: filteredCiv,
      children: filteredChildren,
      strikeCount: filteredStrikeCount
    };
  }

  // ── Map Rendering ──────────────────────────

  function clearLayers() {
    for (const layer of currentLayers) {
      map.removeLayer(layer);
    }
    currentLayers = [];
  }

  function getColor(value, maxValue) {
    if (value === 0) return 'transparent';
    const t = Math.min(value / Math.max(maxValue, 1), 1);
    if (t < 0.25) return '#d4a87a';
    if (t < 0.5) return '#c46a3a';
    if (t < 0.75) return '#a83220';
    return '#7a1a10';
  }

  function getRadius(value, maxValue) {
    if (value === 0) return 0;
    const t = Math.min(value / Math.max(maxValue, 1), 1);
    return 4 + t * 20;
  }

  function renderMap() {
    clearLayers();

    const levelName = ADM_LEVELS[state.resolution];
    const isFog = state.view === 'fog';

    // Collect global max for scaling
    let globalMax = 1;
    const allStats = [];

    for (const country of COUNTRIES) {
      if (!state.countries.has(country)) continue;
      const data = geodata[country]?.[levelName];
      if (!data) continue;

      for (const feature of data.features) {
        const stats = getFilteredStats(feature.properties);
        allStats.push({ feature, stats, country });
        if (stats.value > globalMax) globalMax = stats.value;
      }
    }

    // Render
    for (const { feature, stats, country } of allStats) {
      if (stats.strikeCount === 0) continue;

      if (levelName === 'Loc') {
        // Point data
        const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

        if (isFog) {
          // Fog of War: individual markers
          const marker = L.circleMarker(latlng, {
            radius: Math.max(3, Math.min(8, 3 + stats.strikeCount)),
            fillColor: COUNTRY_COLORS[country],
            fillOpacity: 0.7,
            color: COUNTRY_COLORS[country],
            weight: 1,
            opacity: 0.9
          });
          marker.bindPopup(() => buildPopup(feature.properties, stats, country));
          marker.addTo(map);
          currentLayers.push(marker);
        } else {
          // Heat map: sized/colored by value
          const marker = L.circleMarker(latlng, {
            radius: getRadius(stats.value, globalMax),
            fillColor: getColor(stats.value, globalMax),
            fillOpacity: 0.6,
            color: getColor(stats.value, globalMax),
            weight: 1,
            opacity: 0.8
          });
          marker.bindPopup(() => buildPopup(feature.properties, stats, country));
          marker.addTo(map);
          currentLayers.push(marker);
        }
      } else {
        // Polygon data
        const layer = L.geoJSON(feature, {
          style: () => {
            if (isFog) {
              return {
                fillColor: COUNTRY_COLORS[country],
                fillOpacity: stats.strikeCount > 0 ? 0.15 : 0,
                color: COUNTRY_COLORS[country],
                weight: stats.strikeCount > 0 ? 1.5 : 0.5,
                opacity: stats.strikeCount > 0 ? 0.6 : 0.2,
                dashArray: stats.strikeCount > 0 ? '4 4' : null
              };
            } else {
              return {
                fillColor: getColor(stats.value, globalMax),
                fillOpacity: stats.value > 0 ? 0.4 + 0.4 * (stats.value / globalMax) : 0.05,
                color: stats.value > 0 ? getColor(stats.value, globalMax) : '#333',
                weight: 1,
                opacity: 0.7
              };
            }
          },
          onEachFeature: (feat, lyr) => {
            lyr.bindPopup(() => buildPopup(feat.properties, stats, country));
            lyr.on('mouseover', function () {
              this.setStyle({ weight: 2.5, opacity: 1 });
            });
            lyr.on('mouseout', function () {
              this.setStyle({ weight: isFog ? 1.5 : 1, opacity: 0.7 });
            });
          }
        });
        layer.addTo(map);
        currentLayers.push(layer);
      }
    }
  }

  function buildPopup(props, stats, country) {
    const name = props.shapeName || 'Location';
    const countryLabel = { AFG: 'Afghanistan', PAK: 'Pakistan', YEM: 'Yemen', SOM: 'Somalia' }[country];
    const est = state.estimate === 'min' ? 'Min' : 'Max';

    return `
      <h4>${name}</h4>
      <div class="popup-stat"><span class="popup-stat-label">Country</span><span class="popup-stat-value">${countryLabel}</span></div>
      <div class="popup-stat"><span class="popup-stat-label">Strikes</span><span class="popup-stat-value">${stats.strikeCount}</span></div>
      <div class="popup-stat"><span class="popup-stat-label">Killed (${est})</span><span class="popup-stat-value">${stats.total.toLocaleString()}</span></div>
      <div class="popup-stat"><span class="popup-stat-label">Civilians</span><span class="popup-stat-value">${stats.civilians.toLocaleString()}</span></div>
      <div class="popup-stat"><span class="popup-stat-label">Children</span><span class="popup-stat-value">${stats.children.toLocaleString()}</span></div>
    `;
  }

  // ── Timeline ───────────────────────────────

  let timelineSvg, timelineBrush, timelineX;

  function initTimeline() {
    const container = document.getElementById('timeline-slider');
    const width = container.clientWidth;
    const height = 40;
    const margin = { left: 0, right: 0, top: 2, bottom: 14 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Build monthly strike histogram from all data
    const monthlyStrikes = {};
    const startDate = new Date(2002, 0, 1);
    const endDate = new Date(2020, 11, 31);

    for (const country of COUNTRIES) {
      for (const level of ADM_LEVELS) {
        const data = geodata[country]?.[level];
        if (!data || level !== 'Adm_0') continue; // Use Adm_0 to avoid double-counting
        for (const feature of data.features) {
          const dates = (feature.properties.dates || []).map(parseDate);
          for (const d of dates) {
            if (!d) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyStrikes[key] = (monthlyStrikes[key] || 0) + 1;
          }
        }
      }
    }

    // Generate all months
    const months = [];
    const d = new Date(startDate);
    while (d <= endDate) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ date: new Date(d), count: monthlyStrikes[key] || 0 });
      d.setMonth(d.getMonth() + 1);
    }

    // Scales
    timelineX = d3.scaleTime()
      .domain([startDate, endDate])
      .range([margin.left, margin.left + innerW]);

    const maxCount = d3.max(months, d => d.count) || 1;
    const y = d3.scaleLinear()
      .domain([0, maxCount])
      .range([innerH, 0]);

    const barWidth = Math.max(1, innerW / months.length - 0.5);

    // Create SVG
    timelineSvg = d3.select('#timeline-slider')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Admin period backgrounds
    const adminColors = {
      bush1: 'rgba(100,100,100,0.1)',
      bush2: 'rgba(100,100,100,0.15)',
      obama1: 'rgba(100,149,237,0.1)',
      obama2: 'rgba(100,149,237,0.15)',
      trump: 'rgba(196,50,50,0.1)'
    };

    for (const [key, admin] of Object.entries(ADMINS)) {
      const x1 = Math.max(margin.left, timelineX(admin.start));
      const x2 = Math.min(margin.left + innerW, timelineX(admin.end));
      if (x2 > x1) {
        timelineSvg.append('rect')
          .attr('x', x1)
          .attr('y', margin.top)
          .attr('width', x2 - x1)
          .attr('height', innerH)
          .attr('fill', adminColors[key])
          .attr('class', `admin-bg admin-bg-${key}`);
      }
    }

    // Bars
    timelineSvg.selectAll('.timeline-bar')
      .data(months)
      .join('rect')
      .attr('class', 'timeline-bar')
      .attr('x', d => timelineX(d.date))
      .attr('y', d => margin.top + y(d.count))
      .attr('width', barWidth)
      .attr('height', d => innerH - y(d.count));

    // Axis
    const axis = d3.axisBottom(timelineX)
      .ticks(d3.timeYear.every(2))
      .tickFormat(d3.timeFormat('%Y'))
      .tickSize(3);

    timelineSvg.append('g')
      .attr('class', 'timeline-axis')
      .attr('transform', `translate(0, ${margin.top + innerH})`)
      .call(axis);

    // Brush
    timelineBrush = d3.brushX()
      .extent([[margin.left, margin.top], [margin.left + innerW, margin.top + innerH]])
      .on('end', onTimelineBrush);

    timelineSvg.append('g')
      .attr('class', 'timeline-brush')
      .call(timelineBrush);
  }

  function onTimelineBrush(event) {
    if (!event.selection) {
      // Reset to full range
      state.dateRange = [new Date(2002, 10, 1), new Date(2020, 2, 31)];
    } else {
      state.dateRange = event.selection.map(timelineX.invert);
    }
    updateDateDisplay();
    renderMap();
  }

  function updateDateDisplay() {
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    document.getElementById('timeline-date-display').textContent =
      `${fmt(state.dateRange[0])} \u2014 ${fmt(state.dateRange[1])}`;
  }

  // Play animation
  function togglePlay() {
    const btn = document.getElementById('play-btn');
    if (state.playing) {
      clearInterval(state.playTimer);
      state.playing = false;
      btn.classList.remove('playing');
      btn.querySelector('.play-icon').textContent = '\u25B6';
      btn.setAttribute('aria-label', 'Play timeline animation');
      return;
    }

    state.playing = true;
    btn.classList.add('playing');
    btn.querySelector('.play-icon').textContent = '\u275A\u275A';
    btn.setAttribute('aria-label', 'Pause timeline animation');

    const startDate = new Date(2002, 10, 1);
    const endDate = new Date(2020, 2, 31);
    let current = new Date(startDate);
    const windowMonths = 6;

    state.playTimer = setInterval(() => {
      current.setMonth(current.getMonth() + 1);
      const windowEnd = new Date(current);
      windowEnd.setMonth(windowEnd.getMonth() + windowMonths);

      if (current > endDate) {
        togglePlay(); // Stop
        return;
      }

      state.dateRange = [new Date(current), windowEnd > endDate ? endDate : windowEnd];
      updateDateDisplay();

      // Update brush visually
      const brushGroup = timelineSvg.select('.timeline-brush');
      brushGroup.call(timelineBrush.move, state.dateRange.map(timelineX));

      renderMap();
    }, 300);
  }

  // ── Zero-Casualty Grid ─────────────────────

  function renderZeroGrid() {
    const container = document.getElementById('zero-grid');
    const total = 4238;
    const reported = 957;
    const zero = total - reported;

    // Build array: reported first, then zero
    const dots = [];
    for (let i = 0; i < reported; i++) dots.push('reported');
    for (let i = 0; i < zero; i++) dots.push('zero');

    // Shuffle for visual interest
    for (let i = dots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dots[i], dots[j]] = [dots[j], dots[i]];
    }

    container.innerHTML = dots
      .map(type => `<div class="grid-dot ${type}"></div>`)
      .join('');
  }

  // ── Sankey Chart ───────────────────────────

  function getSankeyData() {
    const est = state.sankeyEstimate;
    const country = state.sankeyCountry;

    let totalKilled, civilians, children;

    if (country === 'all') {
      totalKilled = COUNTRIES.reduce((s, c) => s + CASUALTY_DATA[c][`${est}_total`], 0);
      civilians = COUNTRIES.reduce((s, c) => s + CASUALTY_DATA[c][`${est}_civilians`], 0);
      children = COUNTRIES.reduce((s, c) => s + CASUALTY_DATA[c][`${est}_children`], 0);
    } else {
      totalKilled = CASUALTY_DATA[country][`${est}_total`];
      civilians = CASUALTY_DATA[country][`${est}_civilians`];
      children = CASUALTY_DATA[country][`${est}_children`];
    }

    const military = totalKilled - civilians;
    const civilianAdults = civilians - children;

    return {
      nodes: [
        { name: `Total Killed (${totalKilled.toLocaleString()})` },
        { name: `Military (${military.toLocaleString()})` },
        { name: `Civilian (${civilians.toLocaleString()})` },
        { name: `Adults (${civilianAdults.toLocaleString()})` },
        { name: `Children (${children.toLocaleString()})` }
      ],
      links: [
        { source: 0, target: 1, value: military },
        { source: 0, target: 2, value: civilians },
        { source: 2, target: 3, value: civilianAdults },
        { source: 2, target: 4, value: children }
      ]
    };
  }

  function renderSankey() {
    const container = document.getElementById('sankey-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 120, bottom: 20, left: 20 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300;

    const svg = d3.select('#sankey-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = getSankeyData();

    // Sankey layout
    const sankey = d3.sankey()
      .nodeWidth(20)
      .nodePadding(24)
      .extent([[0, 0], [width, height]])
      .nodeAlign(d3.sankeyLeft);

    const { nodes, links } = sankey({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });

    const nodeColors = ['#c4956a', '#6a8a6a', '#c46a3a', '#c46a3a', '#d44a2a'];

    // Links
    svg.append('g')
      .selectAll('.sankey-link')
      .data(links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => nodeColors[d.source.index])
      .attr('stroke-width', d => Math.max(1, d.width));

    // Nodes
    const node = svg.append('g')
      .selectAll('.sankey-node')
      .data(nodes)
      .join('g')
      .attr('class', 'sankey-node');

    node.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('fill', (d, i) => nodeColors[i]);

    node.append('text')
      .attr('x', d => d.x1 + 8)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .text(d => d.name)
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '12px')
      .style('fill', '#e0ddd5');
  }

  // ── UI Event Binding ───────────────────────

  function bindControls() {
    // View toggle
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.view = btn.dataset.view;
        renderMap();
      });
    });

    // Resolution slider
    const resolutionLabels = ['Country', 'Province', 'District', 'Location'];
    const resSlider = document.getElementById('resolution-slider');
    resSlider.addEventListener('input', (e) => {
      state.resolution = +e.target.value;
      resSlider.setAttribute('aria-valuetext', resolutionLabels[state.resolution]);
      renderMap();
    });

    // Lethality radios
    document.querySelectorAll('input[name="lethality"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.lethality = radio.value;
        renderMap();
      });
    });

    // Estimate toggle
    document.querySelectorAll('[data-estimate]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-estimate]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.estimate = btn.dataset.estimate;
        renderMap();
      });
    });

    // Country checkboxes
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) state.countries.add(cb.value);
        else state.countries.delete(cb.value);
        renderMap();
      });
    });

    // Admin checkboxes
    document.querySelectorAll('input[name="admin"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) state.admins.add(cb.value);
        else state.admins.delete(cb.value);
        renderMap();
      });
    });

    // Play button
    document.getElementById('play-btn').addEventListener('click', togglePlay);

    // Sankey controls
    document.querySelectorAll('[data-sankey]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-sankey]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.sankeyEstimate = btn.dataset.sankey;
        renderSankey();
      });
    });

    document.querySelectorAll('[data-sankey-country]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-sankey-country]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.sankeyCountry = btn.dataset.sankeyCountry;
        renderSankey();
      });
    });
  }

  // ── Scroll Animations ─────────────────────

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.story-block, .gap-block, .about-block, .story-stats, .country-card').forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }

  // ── Init ───────────────────────────────────

  async function init() {
    initMap();
    bindControls();

    // Show loading state
    const mapEl = document.getElementById('map');
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;color:#9e9890;font-family:Atkinson Hyperlegible Next,sans-serif;font-size:0.85rem;';
    loadingDiv.textContent = 'Loading strike data\u2026';
    loadingDiv.setAttribute('role', 'status');
    loadingDiv.setAttribute('aria-live', 'polite');
    mapEl.style.position = 'relative';
    mapEl.appendChild(loadingDiv);

    await loadAllData();
    loadingDiv.remove();

    renderMap();
    initTimeline();
    renderZeroGrid();
    renderSankey();
    initScrollAnimations();
  }

  // Add fade-in animation CSS dynamically (respects reduced motion)
  const style = document.createElement('style');
  style.textContent = `
    @media (prefers-reduced-motion: no-preference) {
      .fade-in {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
