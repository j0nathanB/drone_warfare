// breadcrumbs.js
export class Breadcrumbs {
  constructor(appState, selectEntity) {
    this.levels = [];
    this.appState = appState;
    this.selectEntity = selectEntity;
  }

  updateBreadcrumbs = (admLevel, admName, country) => {
    console.log('click',admLevel,admName)
    this.levels.push({ admLevel, admName, country });
    console.log(this.levels)
    const breadcrumbContainer = document.getElementById('breadcrumbs');
    breadcrumbContainer.innerHTML = '';
  
    const ul = document.createElement('ul');
  
    this.levels.forEach((breadcrumb, index) => {
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
    console.log(breadcrumbContainer)
  };

  handleBreadcrumbClick = (e) => {
    e.preventDefault();
    const clickedLevel = e.target.getAttribute('data-level');
  
    // Remove all breadcrumb levels that come after the clicked level
    const clickedLevelIndex = this.breadcrumbs.findIndex(breadcrumb => this.level === clickedLevel);
    this.breadcrumbs = this.breadcrumbs.slice(0, clickedLevelIndex + 1);
  
    // Update the map view based on the clicked level
    // ...
  
    // Update the breadcrumb display
    this.updateBreadcrumbs();
  };

  addBreadcrumb(level, label) {
    // ...
  }

  removeBreadcrumbsAfterLevel(level) {
    // ...
  }
}
