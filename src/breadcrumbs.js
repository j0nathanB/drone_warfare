// breadcrumbs.js
export class Breadcrumbs {
  constructor(appState, selectEntity) {
    this.breadcrumbs = [];
    this.appState = appState;
    this.selectEntity = selectEntity;

    // Initialize breadcrumbs display on page load
    this.updateBreadcrumbs(this.breadcrumbs);

    // Wire up header breadcrumb Global click handler
    const headerGlobalBreadcrumb = document.querySelector('.header-breadcrumb-nav .breadcrumb-node');
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
    this.breadcrumbs = this.breadcrumbs.slice(0, clickedLevel + 1);

    if (clickedLevel === 0) {
      this.appState.admLevel = 0;
      this.selectEntity(null, this.appState)
      this.breadcrumbs = [];
      this.updateBreadcrumbs(this.breadcrumbs);

      // Sync dropdowns to global state
      if (this.appState.dropdownNavigation) {
        this.appState.dropdownNavigation.syncWithAppState();
      }
      return;
    }

    const currentBreadcrumb = this.breadcrumbs[clickedLevel - 1];
    const admLevelFeatures = this.appState.geojson[currentBreadcrumb.country][clickedLevel - 1].features;

    let targetFeature = null;
    // If there is only one feature, it is at the country level, so select it
    if (admLevelFeatures.length === 1) {
      this.appState.admLevel = clickedLevel - 1;
      targetFeature = admLevelFeatures[0];
      this.selectEntity(admLevelFeatures[0].properties, this.appState);
    } else {
      targetFeature = admLevelFeatures.find(feature => feature.properties.shapeName === currentBreadcrumb.admName);
      this.appState.admLevel = clickedLevel - 1;
      this.selectEntity(targetFeature.properties, this.appState);
    }

    // Zoom to the feature
    const featureBounds = L.geoJSON(targetFeature).getBounds();
    this.appState.map.zoomToFeature(null, featureBounds);

    // Update the breadcrumb display
    this.breadcrumbs = this.breadcrumbs.slice(0, clickedLevel);
    this.updateBreadcrumbs(this.breadcrumbs);

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
      
      node.innerHTML = `<span>${breadcrumb.admName}</span>`;
      node.addEventListener('click', this.handleBreadcrumbClick);
      breadcrumbContainer.appendChild(node);
    });
  }

  updateBreadcrumbsAtMax(admLevel, admName, country) {
    this.breadcrumbs = this.breadcrumbs.slice(0, admLevel);
    this.breadcrumbs.push({ "admLevel": admLevel, "admName": admName, "country": country });
    this.updateBreadcrumbs(this.breadcrumbs);
  }
}
