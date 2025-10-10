/**
 * Header Controls functionality for the Drone Warfare Visualization
 * Handles Data Layers dropdown and Timeline/Compare toggle buttons
 */

export class HeaderControls {
  constructor() {
    this.isDropdownOpen = false
    this.timelineActive = false
    this.compareActive = false
    this.init()
  }

  init() {
    this.bindEvents()
    this.setupInitialState()
  }

  bindEvents() {
    // Data Layers dropdown toggle
    const dataLayersBtn = document.querySelector('[data-cy="data-layers-btn"]')
    if (dataLayersBtn) {
      dataLayersBtn.addEventListener('click', this.toggleDropdown.bind(this))
      
      // Keyboard support
      dataLayersBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.toggleDropdown()
        }
      })
    }

    // Timeline toggle button
    const timelineBtn = document.querySelector('[data-cy="timeline-view-btn"]')
    if (timelineBtn) {
      timelineBtn.addEventListener('click', this.toggleTimeline.bind(this))
    }

    // Compare toggle button
    const compareBtn = document.querySelector('[data-cy="compare-view-btn"]')
    if (compareBtn) {
      compareBtn.addEventListener('click', this.toggleCompare.bind(this))
    }

    // Header layer checkbox events (sync with map layer controls)
    this.bindHeaderLayerToggles()

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this))
  }

  bindHeaderLayerToggles() {
    const headerCheckboxes = document.querySelectorAll('.data-layers-content input[type="checkbox"]')
    headerCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.handleHeaderLayerToggle.bind(this))
    })

    // Add click listeners to layer-toggle containers for better UX
    const layerToggleContainers = document.querySelectorAll('.data-layers-content .layer-toggle')
    layerToggleContainers.forEach(container => {
      // Skip disabled containers
      if (container.classList.contains('layer-disabled')) {
        return
      }
      container.addEventListener('click', this.handleLayerToggleContainerClick.bind(this))
    })
  }

  handleLayerToggleContainerClick(event) {
    // Prevent event if the click was on the checkbox itself to avoid double-triggering
    if (event.target.type === 'checkbox' || event.target.tagName === 'INPUT') {
      return
    }

    const container = event.currentTarget
    const checkbox = container.querySelector('input[type="checkbox"]')

    if (!checkbox || checkbox.disabled) return

    // Toggle the checkbox state
    checkbox.checked = !checkbox.checked

    // Dispatch the change event to trigger the layer toggle handler
    checkbox.dispatchEvent(new Event('change', { bubbles: true }))
  }

  setupInitialState() {
    // Ensure dropdown is closed by default
    const dropdown = document.querySelector('.data-layers-dropdown')
    if (dropdown) {
      dropdown.classList.remove('open')
      this.isDropdownOpen = false
    }
    
    // Sync header checkboxes with existing layer controls
    this.syncLayerStates()
  }

  toggleDropdown() {
    const dropdown = document.querySelector('.data-layers-dropdown')
    if (!dropdown) return

    this.isDropdownOpen = !this.isDropdownOpen
    
    if (this.isDropdownOpen) {
      dropdown.classList.add('open')
    } else {
      dropdown.classList.remove('open')
    }

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('dataLayersDropdownToggled', {
      detail: { isOpen: this.isDropdownOpen }
    }))
  }

  closeDropdown() {
    const dropdown = document.querySelector('.data-layers-dropdown')
    if (dropdown && this.isDropdownOpen) {
      dropdown.classList.remove('open')
      this.isDropdownOpen = false
    }
  }

  toggleTimeline() {
    this.timelineActive = !this.timelineActive
    const timelineBtn = document.querySelector('[data-cy="timeline-view-btn"]')
    
    if (timelineBtn) {
      if (this.timelineActive) {
        timelineBtn.classList.add('active')
      } else {
        timelineBtn.classList.remove('active')
      }
    }

    // Dispatch custom event for timeline functionality
    document.dispatchEvent(new CustomEvent('timelineToggled', {
      detail: { 
        isActive: this.timelineActive,
        shouldShow: this.timelineActive 
      }
    }))
  }

  toggleCompare() {
    this.compareActive = !this.compareActive
    const compareBtn = document.querySelector('[data-cy="compare-view-btn"]')
    
    if (compareBtn) {
      if (this.compareActive) {
        compareBtn.classList.add('active')
      } else {
        compareBtn.classList.remove('active')
      }
    }

    // Dispatch custom event for compare functionality
    document.dispatchEvent(new CustomEvent('compareToggled', {
      detail: { 
        isActive: this.compareActive,
        shouldShow: this.compareActive 
      }
    }))
  }

  handleHeaderLayerToggle(event) {
    const layerId = event.target.id.replace('header-', '') // Remove 'header-' prefix
    const isEnabled = event.target.checked

    // Sync with main layer controls
    const mainCheckbox = document.getElementById(layerId)
    if (mainCheckbox && mainCheckbox.checked !== isEnabled) {
      mainCheckbox.checked = isEnabled
      mainCheckbox.dispatchEvent(new Event('change'))
    }

    // Dispatch custom event directly to map
    document.dispatchEvent(new CustomEvent('layerToggled', {
      detail: {
        layerId,
        isEnabled,
        source: 'header'
      }
    }))

    // Also dispatch headerLayerToggled for other listeners
    document.dispatchEvent(new CustomEvent('headerLayerToggled', {
      detail: {
        layerId,
        isEnabled,
        source: 'header'
      }
    }))
  }

  handleOutsideClick(event) {
    const dropdown = document.querySelector('.data-layers-dropdown')
    if (!dropdown || !this.isDropdownOpen) return

    // Check if click is outside the dropdown
    if (!dropdown.contains(event.target)) {
      this.closeDropdown()
    }
  }

  syncLayerStates() {
    // Sync header checkboxes with main layer controls
    const layerMappings = [
      { header: 'header-heatmap', main: 'heatmap' },
      { header: 'header-bubblemap', main: 'bubblemap' },
      { header: 'header-boundary-country', main: 'boundary-country' },
      { header: 'header-boundary-adm1', main: 'boundary-adm1' },
      { header: 'header-boundary-adm2', main: 'boundary-adm2' },
      { header: 'header-boundary-adm3', main: 'boundary-adm3' },
      { header: 'header-strikes', main: 'strikes' },
      { header: 'header-civilian', main: 'civilian' }
    ]

    layerMappings.forEach(mapping => {
      const headerCheckbox = document.getElementById(mapping.header)
      const mainCheckbox = document.getElementById(mapping.main)

      if (headerCheckbox && mainCheckbox) {
        headerCheckbox.checked = mainCheckbox.checked
      }
    })
  }

  // Public API methods
  isTimelineActive() {
    return this.timelineActive
  }

  isCompareActive() {
    return this.compareActive
  }

  setTimelineActive(active) {
    if (this.timelineActive !== active) {
      this.toggleTimeline()
    }
  }

  setCompareActive(active) {
    if (this.compareActive !== active) {
      this.toggleCompare()
    }
  }

  // Listen for main layer control changes and sync
  setupLayerSync() {
    document.addEventListener('layerToggled', (event) => {
      const { layerId, isEnabled } = event.detail
      const headerCheckbox = document.getElementById(`header-${layerId}`)
      
      if (headerCheckbox && headerCheckbox.checked !== isEnabled) {
        headerCheckbox.checked = isEnabled
      }
    })
  }

  // Cleanup method
  destroy() {
    const dataLayersBtn = document.querySelector('[data-cy="data-layers-btn"]')
    if (dataLayersBtn) {
      dataLayersBtn.removeEventListener('click', this.toggleDropdown.bind(this))
    }

    const timelineBtn = document.querySelector('[data-cy="timeline-view-btn"]')
    if (timelineBtn) {
      timelineBtn.removeEventListener('click', this.toggleTimeline.bind(this))
    }

    const compareBtn = document.querySelector('[data-cy="compare-view-btn"]')
    if (compareBtn) {
      compareBtn.removeEventListener('click', this.toggleCompare.bind(this))
    }

    document.removeEventListener('click', this.handleOutsideClick.bind(this))
  }
}