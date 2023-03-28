// sidebar.js
export class Sidebar {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.sidebarWidth = this.sidebar.offsetWidth;
  }

  getWidth() {
    return this.sidebarWidth;
  }
}