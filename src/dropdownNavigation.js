/**
 * Dropdown Navigation System (Custom Dropdown Integration)
 *
 * Implements hierarchical dropdown navigation with cascading filters using
 * custom JavaScript dropdowns instead of native select elements.
 *
 * Global -> Country -> ADM1 -> ADM2 -> ADM3 (Pakistan only)
 *
 * Features:
 * - Custom dropdown component with consistent widths
 * - Auto-filtering based on parent selection
 * - ADM3 enabled only for Pakistan when ADM2 is selected
 * - Synchronization with breadcrumb navigation
 * - Text truncation with ellipsis for long options
 */

import { CustomDropdown } from './customDropdown.js'

export class DropdownNavigation {
  constructor(appState, selectEntity, breadcrumbs) {
    this.appState = appState
    this.selectEntityOriginal = selectEntity
    this.breadcrumbs = breadcrumbs

    // Custom dropdown instances
    this.dropdowns = {
      country: null,
      adm1: null,
      adm2: null,
      adm3: null
    }

    // Current state
    this.currentState = {
      country: null,
      adm1: null,
      adm2: null,
      adm3: null
    }

    this.init()
  }

  /**
   * Helper to find feature by name and call selectEntity with proper properties
   */
  selectEntity(entityName, level) {
    if (entityName === null && level === 0) {
      // Reset to global
      this.selectEntityOriginal(null, this.appState)
      return
    }

    // For country level (level 1)
    if (level === 1) {
      const countryCode = entityName
      const countryData = this.appState.geojson[countryCode]

      // Access country data via array index [0]
      if (countryData && countryData[0] && countryData[0].features.length > 0) {
        const feature = countryData[0].features[0]
        this.selectEntityOriginal(feature.properties, this.appState)
      }
      return
    }

    // For ADM1, ADM2, ADM3 levels, find the feature
    // level 2 = ADM1 (index 1), level 3 = ADM2 (index 2), level 4 = ADM3 (index 3)
    const dataIndex = level - 1
    let found = false

    Object.keys(this.appState.geojson).forEach(countryCode => {
      if (found) return

      const countryData = this.appState.geojson[countryCode]
      if (countryData[dataIndex] && countryData[dataIndex].features) {
        const feature = countryData[dataIndex].features.find(f =>
          f.properties.shapeName === entityName
        )

        if (feature) {
          this.selectEntityOriginal(feature.properties, this.appState)
          found = true
        }
      }
    })
  }

  init() {
    this.initializeDropdowns()
    this.populateCountryDropdown()
    this.populateAllAdm1Options()
    this.populateAllAdm2Options()
    this.populateAllAdm3Options()
  }

  initializeDropdowns() {
    // Create Country dropdown
    this.dropdowns.country = new CustomDropdown({
      id: 'country',
      containerId: 'nav-dropdown-country-wrapper',
      placeholder: 'Country',
      dataAttr: 'nav-dropdown-country',
      onChange: (value, text) => this.onCountryChange(value, text)
    })

    // Create ADM1 dropdown
    this.dropdowns.adm1 = new CustomDropdown({
      id: 'adm1',
      containerId: 'nav-dropdown-adm1-wrapper',
      placeholder: 'Adm1',
      dataAttr: 'nav-dropdown-adm1',
      onChange: (value, text) => this.onAdm1Change(value, text)
    })

    // Create ADM2 dropdown
    this.dropdowns.adm2 = new CustomDropdown({
      id: 'adm2',
      containerId: 'nav-dropdown-adm2-wrapper',
      placeholder: 'Adm2',
      dataAttr: 'nav-dropdown-adm2',
      onChange: (value, text) => this.onAdm2Change(value, text)
    })

    // Create ADM3 dropdown (disabled by default)
    this.dropdowns.adm3 = new CustomDropdown({
      id: 'adm3',
      containerId: 'nav-dropdown-adm3-wrapper',
      placeholder: 'Adm3',
      dataAttr: 'nav-dropdown-adm3',
      disabled: true,
      onChange: (value, text) => this.onAdm3Change(value, text)
    })
  }

  /**
   * Populate country dropdown with all available countries
   */
  populateCountryDropdown() {
    const countries = [
      { code: 'AFG', name: 'Afghanistan' },
      { code: 'PAK', name: 'Pakistan' },
      { code: 'SOM', name: 'Somalia' },
      { code: 'YEM', name: 'Yemen' }
    ]

    const options = countries.map(country => ({
      value: country.code,
      text: country.name,
      dataAttrs: { country: country.code }
    }))

    this.dropdowns.country.populateOptions(options)
  }

  /**
   * Populate ADM1 dropdown with all provinces from all countries
   */
  populateAllAdm1Options() {
    const adm1Options = []
    const seen = new Set()

    if (!this.appState.geojson) {
      console.warn('DropdownNavigation: geojson not available for ADM1 population')
      return
    }

    Object.keys(this.appState.geojson).forEach(countryCode => {
      const countryData = this.appState.geojson[countryCode]
      // Access ADM1 data via array index [1]
      if (countryData[1] && countryData[1].features) {
        countryData[1].features.forEach(feature => {
          const adm1Name = feature.properties.shapeName
          const key = `${countryCode}-${adm1Name}`

          if (!seen.has(key)) {
            seen.add(key)
            adm1Options.push({
              value: adm1Name,
              text: adm1Name,
              dataAttrs: {
                country: countryCode,
                parent: countryCode
              }
            })
          }
        })
      }
    })

    adm1Options.sort((a, b) => a.text.localeCompare(b.text))
    this.dropdowns.adm1.populateOptions(adm1Options)
  }

  /**
   * Populate ADM2 dropdown with all districts from all countries
   */
  populateAllAdm2Options() {
    const adm2Options = []
    const seen = new Set()

    if (!this.appState.geojson) {
      console.warn('DropdownNavigation: geojson not available for ADM2 population')
      return
    }

    Object.keys(this.appState.geojson).forEach(countryCode => {
      const countryData = this.appState.geojson[countryCode]
      // Access ADM2 data via array index [2]
      if (countryData[2] && countryData[2].features) {
        countryData[2].features.forEach(feature => {
          const adm2Name = feature.properties.shapeName
          const adm1Parent = feature.properties.parentAdm || ''
          const key = `${countryCode}-${adm1Parent}-${adm2Name}`

          if (!seen.has(key)) {
            seen.add(key)
            adm2Options.push({
              value: adm2Name,
              text: adm2Name,
              dataAttrs: {
                country: countryCode,
                parent: adm1Parent
              }
            })
          }
        })
      }
    })

    adm2Options.sort((a, b) => a.text.localeCompare(b.text))
    this.dropdowns.adm2.populateOptions(adm2Options)
  }

  /**
   * Populate ADM3 dropdown with all localities (Pakistan only)
   */
  populateAllAdm3Options() {
    const adm3Options = []
    const seen = new Set()

    if (!this.appState.geojson || !this.appState.geojson.PAK) return

    const pakistanData = this.appState.geojson.PAK
    // Access ADM3 data via array index [3] (Pakistan only)
    if (pakistanData[3] && pakistanData[3].features) {
      pakistanData[3].features.forEach(feature => {
        const adm3Name = feature.properties.shapeName
        const adm2Parent = feature.properties.parentAdm || ''
        const key = `PAK-${adm2Parent}-${adm3Name}`

        if (!seen.has(key)) {
          seen.add(key)
          adm3Options.push({
            value: adm3Name,
            text: adm3Name,
            dataAttrs: {
              country: 'PAK',
              parent: adm2Parent
            }
          })
        }
      })
    }

    adm3Options.sort((a, b) => a.text.localeCompare(b.text))
    this.dropdowns.adm3.populateOptions(adm3Options)
  }

  /**
   * Handle country selection
   */
  onCountryChange(countryCode, countryName) {
    if (!countryCode) {
      this.resetToGlobal()
      return
    }

    this.currentState.country = countryCode
    this.currentState.adm1 = null
    this.currentState.adm2 = null
    this.currentState.adm3 = null

    // Filter ADM1 options by country
    this.filterAdm1ByCountry(countryCode)

    // Filter ADM2 options by country
    this.filterAdm2ByCountry(countryCode)

    // Reset ADM3 (disable unless Pakistan + ADM2 selected)
    this.dropdowns.adm2.reset()
    this.dropdowns.adm3.reset()
    this.dropdowns.adm3.disable()

    // Navigate to country
    this.selectEntity(countryCode, 1)
  }

  /**
   * Handle ADM1 (province) selection
   */
  onAdm1Change(adm1Name, displayName) {
    if (!adm1Name) {
      // Reset to country level
      if (this.currentState.country) {
        this.onCountryChange(this.currentState.country, '')
      } else {
        this.resetToGlobal()
      }
      return
    }

    this.currentState.adm1 = adm1Name
    this.currentState.adm2 = null
    this.currentState.adm3 = null

    // Filter ADM2 options by ADM1
    this.filterAdm2ByAdm1(adm1Name)

    // Reset ADM3
    this.dropdowns.adm3.reset()
    this.dropdowns.adm3.disable()

    // Navigate to ADM1
    this.selectEntity(adm1Name, 2)
  }

  /**
   * Handle ADM2 (district) selection
   */
  onAdm2Change(adm2Name, displayName) {
    if (!adm2Name) {
      // Reset to ADM1 level
      if (this.currentState.adm1) {
        this.onAdm1Change(this.currentState.adm1, '')
      } else if (this.currentState.country) {
        this.onCountryChange(this.currentState.country, '')
      } else {
        this.resetToGlobal()
      }
      return
    }

    this.currentState.adm2 = adm2Name
    this.currentState.adm3 = null

    // Enable ADM3 if Pakistan
    if (this.currentState.country === 'PAK') {
      this.filterAdm3ByAdm2(adm2Name)
      this.dropdowns.adm3.enable()
    } else {
      this.dropdowns.adm3.reset()
      this.dropdowns.adm3.disable()
    }

    // Navigate to ADM2
    this.selectEntity(adm2Name, 3)
  }

  /**
   * Handle ADM3 (locality) selection (Pakistan only)
   */
  onAdm3Change(adm3Name, displayName) {
    if (!adm3Name) {
      // Reset to ADM2 level
      if (this.currentState.adm2) {
        this.onAdm2Change(this.currentState.adm2, '')
      }
      return
    }

    this.currentState.adm3 = adm3Name

    // Navigate to ADM3
    this.selectEntity(adm3Name, 4)
  }

  /**
   * Filter ADM1 dropdown by country
   */
  filterAdm1ByCountry(countryCode) {
    const visibleCount = this.dropdowns.adm1.filterOptions(opt => {
      return opt.dataAttrs.country === countryCode
    })

    if (visibleCount === 0) {
      this.dropdowns.adm1.reset()
    }
  }

  /**
   * Filter ADM2 dropdown by country
   */
  filterAdm2ByCountry(countryCode) {
    const visibleCount = this.dropdowns.adm2.filterOptions(opt => {
      return opt.dataAttrs.country === countryCode
    })

    if (visibleCount === 0) {
      this.dropdowns.adm2.reset()
    }
  }

  /**
   * Filter ADM2 dropdown by ADM1
   */
  filterAdm2ByAdm1(adm1Name) {
    const visibleCount = this.dropdowns.adm2.filterOptions(opt => {
      return opt.dataAttrs.country === this.currentState.country &&
             opt.dataAttrs.parent === adm1Name
    })

    if (visibleCount === 0) {
      this.dropdowns.adm2.reset()
    }
  }

  /**
   * Filter ADM3 dropdown by ADM2 (Pakistan only)
   */
  filterAdm3ByAdm2(adm2Name) {
    const visibleCount = this.dropdowns.adm3.filterOptions(opt => {
      return opt.dataAttrs.country === 'PAK' &&
             opt.dataAttrs.parent === adm2Name
    })

    if (visibleCount === 0) {
      this.dropdowns.adm3.reset()
    }
  }

  /**
   * Reset to global view
   */
  resetToGlobal() {
    this.currentState = {
      country: null,
      adm1: null,
      adm2: null,
      adm3: null
    }

    // Reset all dropdowns
    this.dropdowns.country.reset()
    this.dropdowns.adm1.reset()
    this.dropdowns.adm2.reset()
    this.dropdowns.adm3.reset()

    // Repopulate all options
    this.populateAllAdm1Options()
    this.populateAllAdm2Options()

    // Disable ADM3
    this.dropdowns.adm3.disable()

    // Navigate to global
    this.selectEntity(null, 0)
  }

  /**
   * Sync dropdowns with current app state (called by breadcrumb navigation)
   */
  syncWithAppState() {
    const state = this.appState

    // Sync country
    if (state.country && state.country !== this.currentState.country) {
      this.currentState.country = state.country
      this.dropdowns.country.syncValue(state.country, state.country)
      this.filterAdm1ByCountry(state.country)
      this.filterAdm2ByCountry(state.country)
    } else if (!state.country) {
      this.dropdowns.country.reset()
      this.currentState.country = null
    }

    // Sync ADM1
    if (state.adm1 && state.adm1 !== this.currentState.adm1) {
      this.currentState.adm1 = state.adm1
      this.dropdowns.adm1.syncValue(state.adm1, state.adm1)
      this.filterAdm2ByAdm1(state.adm1)
    } else if (!state.adm1) {
      this.dropdowns.adm1.reset()
      this.currentState.adm1 = null
    }

    // Sync ADM2
    if (state.adm2 && state.adm2 !== this.currentState.adm2) {
      this.currentState.adm2 = state.adm2
      this.dropdowns.adm2.syncValue(state.adm2, state.adm2)

      // Enable ADM3 if Pakistan
      if (this.currentState.country === 'PAK') {
        this.filterAdm3ByAdm2(state.adm2)
        this.dropdowns.adm3.enable()
      }
    } else if (!state.adm2) {
      this.dropdowns.adm2.reset()
      this.currentState.adm2 = null
      this.dropdowns.adm3.disable()
    }

    // Sync ADM3
    if (state.adm3 && state.adm3 !== this.currentState.adm3) {
      this.currentState.adm3 = state.adm3
      this.dropdowns.adm3.syncValue(state.adm3, state.adm3)
    } else if (!state.adm3) {
      this.dropdowns.adm3.reset()
      this.currentState.adm3 = null
    }

    // Handle reset to global
    if (state.admLevel === 0) {
      this.dropdowns.country.reset()
      this.dropdowns.adm1.reset()
      this.dropdowns.adm2.reset()
      this.dropdowns.adm3.reset()
      this.populateAllAdm1Options()
      this.populateAllAdm2Options()
      this.dropdowns.adm3.disable()
    }
  }
}
