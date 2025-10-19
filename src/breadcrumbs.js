// breadcrumbs.js
export class Breadcrumbs {
  constructor(appState, selectEntity) {
    this.breadcrumbs = [];
    this.appState = appState;
    this.selectEntity = selectEntity;

    // Country code to name mapping
    this.countryNames = {
      'AFG': 'Afghanistan',
      'PAK': 'Pakistan',
      'SOM': 'Somalia',
      'YEM': 'Yemen'
    };

    // Initialize breadcrumbs display on page load
    this.updateBreadcrumbs(this.breadcrumbs);

    // Wire up header breadcrumb Global click handler
    const headerGlobalBreadcrumb = document.querySelector('.visual-breadcrumbs .breadcrumb-node');
    if (headerGlobalBreadcrumb) {
      headerGlobalBreadcrumb.addEventListener('click', this.handleBreadcrumbClick.bind(this));
    }
  }

  addBreadcrumbs = (admLevel, admName, country) => {
    this.breadcrumbs.push({ admLevel, admName, country });
    this.updateBreadcrumbs(this.breadcrumbs);
  };

  handleBreadcrumbClick = (e) => {
    e.preventDefault();

    const clickedLevel = Number(e.target.getAttribute('data-level'));

    if (clickedLevel === 0) {
      this.appState.admLevel = 0;
      this.breadcrumbs = [];
      this.updateBreadcrumbs(this.breadcrumbs);
      this.selectEntity(null, this.appState)

      // Sync dropdowns to global state
      if (this.appState.dropdownNavigation) {
        this.appState.dropdownNavigation.syncWithAppState();
      }
      return;
    }

    const currentBreadcrumb = this.breadcrumbs[clickedLevel - 1];

    console.log('[Breadcrumb Click]', {
      clickedLevel,
      currentBreadcrumb,
      currentAppState: {
        admLevel: this.appState.admLevel,
        country: this.appState.country,
        admName: this.appState.admName
      }
    });

    // clickedLevel is the breadcrumb admLevel (1 = country, 2 = province, etc.)
    // geojson array: geojson[country][0] = country level, [1] = province level, etc.
    // So we need to use clickedLevel - 1 to access geojson
    const geojsonIndex = clickedLevel - 1;
    const admLevelFeatures = this.appState.geojson[currentBreadcrumb.country][geojsonIndex].features;

    let targetFeature = null;

    // Special case for country-level breadcrumb (admLevel 1)
    if (clickedLevel === 1) {
      console.log('[Breadcrumb Click] Country-level click detected (clickedLevel === 1)');
      targetFeature = admLevelFeatures[0]; // Country level has only 1 feature
      // Set admLevel to 0 (parent of country) because selectEntity will increment to 1
      this.appState.admLevel = 0;
      // Clear breadcrumbs BEFORE calling selectEntity to prevent duplicates
      this.breadcrumbs = [];
      console.log('[Breadcrumb Click] Before selectEntity:',{
        admLevel: this.appState.admLevel,
        country: this.appState.country,
        featureName: targetFeature.properties.shapeName
      });
      this.selectEntity(targetFeature.properties, this.appState);
    } else {
      console.log('[Breadcrumb Click] Sub-national level click detected');
      // For sub-national levels, find the specific feature by name
      targetFeature = admLevelFeatures.find(feature => feature.properties.shapeName === currentBreadcrumb.admName);

      // Set appState to parent level because selectEntity will increment by 1
      // We want to navigate TO clickedLevel, so set to clickedLevel - 1
      this.appState.admLevel = clickedLevel - 1;

      // Remove breadcrumbs AFTER the clicked level
      // Keep breadcrumbs up to (but not including) the clicked level
      // selectEntity will re-add the clicked breadcrumb
      this.breadcrumbs = this.breadcrumbs.slice(0, clickedLevel - 1);

      console.log('[Breadcrumb Click] Before selectEntity:', {
        admLevel: this.appState.admLevel,
        country: this.appState.country,
        featureName: targetFeature?.properties.shapeName
      });
      this.selectEntity(targetFeature.properties, this.appState);
    }

    console.log('[Breadcrumb Click] After selectEntity:', {
      admLevel: this.appState.admLevel,
      country: this.appState.country,
      admName: this.appState.admName
    });

    // Zoom to the feature
    const featureBounds = L.geoJSON(targetFeature).getBounds();
    this.appState.map.zoomToFeature(null, featureBounds);

    // Sync dropdowns with new state
    if (this.appState.dropdownNavigation) {
      this.appState.dropdownNavigation.syncWithAppState();
    }
  };  

  updateBreadcrumbs(breadcrumbs) {
    const breadcrumbContainer = document.querySelector('[data-cy="breadcrumbs"] .breadcrumb-path');
    if (!breadcrumbContainer) return;

    breadcrumbContainer.innerHTML = '';

    // Add the "Global" breadcrumb node
    const globalNode = document.createElement('div');
    globalNode.className = 'breadcrumb-node breadcrumb-item';
    globalNode.setAttribute('data-cy', 'breadcrumb-global');
    globalNode.setAttribute('data-level', '0');
    globalNode.innerHTML = '<span>Global View</span>';
    globalNode.addEventListener('click', this.handleBreadcrumbClick);
    breadcrumbContainer.appendChild(globalNode);

    breadcrumbs.forEach((breadcrumb, index) => {
      // Add arrow between breadcrumbs
      if (index >= 0) {
        const arrow = document.createElement('div');
        arrow.className = 'breadcrumb-arrow';
        arrow.innerHTML = '→';
        breadcrumbContainer.appendChild(arrow);
      }

      // Add breadcrumb node
      const node = document.createElement('div');
      node.className = 'breadcrumb-node breadcrumb-item';
      node.setAttribute('data-level', breadcrumb.admLevel);

      // Set appropriate data-cy based on level
      if (breadcrumb.admLevel === 1) {
        node.setAttribute('data-cy', 'breadcrumb-country');
      } else if (breadcrumb.admLevel === 2) {
        node.setAttribute('data-cy', 'breadcrumb-region');
      } else {
        node.setAttribute('data-cy', `breadcrumb-level-${breadcrumb.admLevel}`);
      }

      // Display full country name for country-level breadcrumbs
      const displayName = (breadcrumb.admLevel === 1 && this.countryNames[breadcrumb.admName])
        ? this.countryNames[breadcrumb.admName]
        : breadcrumb.admName;

      node.innerHTML = `<span>${displayName}</span>`;
      node.addEventListener('click', this.handleBreadcrumbClick);
      breadcrumbContainer.appendChild(node);
    });

    // Update location header
    this.updateLocationHeader(breadcrumbs);
  }

  updateLocationHeader(breadcrumbs) {
    const locationHeader = document.querySelector('[data-cy="location-header"]');
    if (!locationHeader) return;

    if (breadcrumbs.length === 0) {
      // At global level
      locationHeader.textContent = 'Global';
    } else {
      // Build hierarchical location string
      // Convert country codes to full names
      const locationPath = breadcrumbs.map(bc => {
        // If this is a country-level breadcrumb (admLevel 1), use country name instead of code
        if (bc.admLevel === 1 && this.countryNames[bc.admName]) {
          return this.countryNames[bc.admName];
        }
        return bc.admName;
      }).join(' - ');
      locationHeader.textContent = locationPath;
    }
  }

  updateBreadcrumbsAtMax(admLevel, admName, country) {
    this.breadcrumbs = this.breadcrumbs.slice(0, admLevel);
    this.breadcrumbs.push({ "admLevel": admLevel, "admName": admName, "country": country });
    this.updateBreadcrumbs(this.breadcrumbs);
  }
}
