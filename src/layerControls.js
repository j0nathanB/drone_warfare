/**
 * Layer Controls functionality for the Drone Warfare Visualization
 * Handles expand/collapse and layer toggle behavior
 */

export class LayerControls {
  constructor() {
    this.isCollapsed = false
    this.init()
  }

  init() {
    // Wait for DOM to be ready if not already
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.bindEvents()
        this.setupInitialState()
      })
    } else {
      this.bindEvents()
      this.setupInitialState()
    }
  }

  bindEvents() {
    const toggleButton = document.querySelector('[data-cy="layer-controls-toggle"]')
    if (toggleButton) {
      toggleButton.addEventListener('click', this.togglePanel.bind(this))
      
      // Keyboard support
      toggleButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.togglePanel()
        }
      })
    }

    // Layer checkbox events
    this.bindLayerToggles()
  }

  bindLayerToggles() {
    const layerToggles = document.querySelectorAll('.layer-toggle input[type="checkbox"]')
    layerToggles.forEach(toggle => {
      toggle.addEventListener('change', this.handleLayerToggle.bind(this))
    })

    // Add click listeners to layer-toggle divs for toggling checkbox visibility
    const layerToggleContainers = document.querySelectorAll('.layer-toggle')
    layerToggleContainers.forEach(container => {
      container.addEventListener('click', this.handleLayerToggleContainerClick.bind(this))
    })
  }

  setupInitialState() {
    const panel = document.querySelector('[data-cy="layer-controls"]')
    const toggleButton = document.querySelector('[data-cy="layer-controls-toggle"]')
    
    if (panel && toggleButton) {
      // Set initial ARIA state
      this.updateARIAState()
      
      // Check for saved state in localStorage
      const savedState = localStorage.getItem('layerControlsCollapsed')
      if (savedState === 'true') {
        this.collapsePanel(false) // false = no animation on init
      }
    }
  }

  togglePanel() {
    if (this.isCollapsed) {
      this.expandPanel()
    } else {
      this.collapsePanel()
    }
  }

  expandPanel(animate = true) {
    const panel = document.querySelector('[data-cy="layer-controls"]')
    if (!panel) return

    this.isCollapsed = false
    panel.classList.remove('collapsed')
    
    if (!animate) {
      panel.style.transition = 'none'
      setTimeout(() => {
        panel.style.transition = ''
      }, 50)
    }

    this.updateARIAState()
    this.saveState()
    
    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('layerControlsExpanded'))
  }

  collapsePanel(animate = true) {
    const panel = document.querySelector('[data-cy="layer-controls"]')
    if (!panel) return

    this.isCollapsed = true
    panel.classList.add('collapsed')
    
    if (!animate) {
      panel.style.transition = 'none'
      setTimeout(() => {
        panel.style.transition = ''
      }, 50)
    }

    this.updateARIAState()
    this.saveState()
    
    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('layerControlsCollapsed'))
  }

  updateARIAState() {
    const toggleButton = document.querySelector('[data-cy="layer-controls-toggle"]')
    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', !this.isCollapsed)
      
      // Update aria-label for better accessibility
      const label = this.isCollapsed ? 'Expand data layers panel' : 'Collapse data layers panel'
      toggleButton.setAttribute('aria-label', label)
    }
  }

  saveState() {
    try {
      localStorage.setItem('layerControlsCollapsed', this.isCollapsed.toString())
    } catch (e) {
      // Handle cases where localStorage is not available
      console.warn('Could not save layer controls state to localStorage:', e)
    }
  }

  handleLayerToggle(event) {
    const layerId = event.target.id
    const isEnabled = event.target.checked

    // Dispatch custom event with layer information
    document.dispatchEvent(new CustomEvent('layerToggled', {
      detail: {
        layerId,
        isEnabled,
        layerType: this.getLayerType(layerId)
      }
    }))

    // Visual feedback removed - only checkbox toggle should be visible
  }

  handleLayerToggleContainerClick(event) {
    // Prevent event if the click was on the checkbox itself to avoid double-triggering
    if (event.target.type === 'checkbox') {
      return
    }

    const container = event.currentTarget
    const checkbox = container.querySelector('input[type="checkbox"]')
    
    if (!checkbox) return

    // Toggle the checkbox state
    checkbox.checked = !checkbox.checked
    
    // Dispatch the change event to trigger the layer toggle handler
    checkbox.dispatchEvent(new Event('change', { bubbles: true }))
  }

  getLayerType(layerId) {
    const layerTypes = {
      'heatmap': 'heatmap',
      'boundaries': 'boundaries',
      'strikes': 'points',
      'civilian': 'overlay'
    }
    return layerTypes[layerId] || 'unknown'
  }

  // Public API methods
  isLayerEnabled(layerId) {
    const checkbox = document.getElementById(layerId)
    return checkbox ? checkbox.checked : false
  }

  setLayerEnabled(layerId, enabled) {
    const checkbox = document.getElementById(layerId)
    if (checkbox && checkbox.checked !== enabled) {
      checkbox.checked = enabled
      checkbox.dispatchEvent(new Event('change'))
    }
  }

  getAllEnabledLayers() {
    const checkboxes = document.querySelectorAll('.layer-toggle input[type="checkbox"]:checked')
    return Array.from(checkboxes).map(cb => cb.id)
  }

  // Programmatic control
  expand() {
    if (this.isCollapsed) {
      this.expandPanel()
    }
  }

  collapse() {
    if (!this.isCollapsed) {
      this.collapsePanel()
    }
  }

  // Cleanup method
  destroy() {
    const toggleButton = document.querySelector('[data-cy="layer-controls-toggle"]')
    if (toggleButton) {
      toggleButton.removeEventListener('click', this.togglePanel.bind(this))
    }

    const layerToggles = document.querySelectorAll('.layer-toggle input[type="checkbox"]')
    layerToggles.forEach(toggle => {
      toggle.removeEventListener('change', this.handleLayerToggle.bind(this))
    })

    const layerToggleContainers = document.querySelectorAll('.layer-toggle')
    layerToggleContainers.forEach(container => {
      container.removeEventListener('click', this.handleLayerToggleContainerClick.bind(this))
    })
  }
}

// LayerControls is now initialized in the main application
// No auto-initialization needed here