// breadcrumbs.js
export class Breadcrumbs {
  constructor(appState, selectEntity) {
    this.breadcrumbs = [];
    this.appState = appState;
    this.selectEntity = selectEntity;
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
    console.log(targetFeature)
    this.appState.map.zoomToFeature(null, featureBounds);
  
    // Update the breadcrumb display
    this.breadcrumbs = this.breadcrumbs.slice(0, clickedLevel);
    this.updateBreadcrumbs(this.breadcrumbs);
  };  

  updateBreadcrumbs(breadcrumbs) {
    const breadcrumbContainer = document.getElementById('breadcrumbs');
    breadcrumbContainer.innerHTML = '';
  
    const ul = document.createElement('ul');
  
    // Add the "All" breadcrumb
    const allLi = document.createElement('li');
    const allA = document.createElement('a');
    allA.href = '#';
    allA.id = 'home';
    allA.textContent = 'All';
    allA.setAttribute('data-level', 0)
    allA.addEventListener('click', this.handleBreadcrumbClick);
    allLi.appendChild(allA);
    ul.appendChild(allLi);

    breadcrumbs.forEach((breadcrumb, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.setAttribute('data-level', breadcrumb.admLevel);
      a.textContent = breadcrumb.admName;
  
      a.addEventListener('click', this.handleBreadcrumbClick);
  
      li.appendChild(a);
      ul.appendChild(li);
    });
  
    breadcrumbContainer.appendChild(ul);
  }

  updateBreadcrumbsAtMax(admLevel, admName, country) {
    console.log('updateBreadcrumbsAtMax', this.breadcrumbs, admLevel,admName,country)
    this.breadcrumbs = this.breadcrumbs.slice(0, admLevel);
    this.breadcrumbs.push({ "admLevel": admLevel, "admName": admName, "country": country });
    this.updateBreadcrumbs(this.breadcrumbs);
  }
}
