/**
 * Dropdown Navigation System
 *
 * Implements hierarchical dropdown navigation with cascading filters:
 * Global -> Country -> ADM1 -> ADM2 -> ADM3 (Pakistan only)
 *
 * Features:
 * - Auto-filtering based on parent selection
 * - ADM3 enabled only for Pakistan when ADM2 is selected
 * - Synchronization with breadcrumb navigation
 * - Preserves existing breadcrumb behavior
 */

export class DropdownNavigation {
  constructor(appState, selectEntity, breadcrumbs) {
    this.appState = appState
    this.selectEntity = selectEntity
    this.breadcrumbs = breadcrumbs

    // Dropdown elements
    this.dropdowns = {
      global: document.getElementById('nav-dropdown-global'),
      country: document.getElementById('nav-dropdown-country'),
      adm1: document.getElementById('nav-dropdown-adm1'),
      adm2: document.getElementById('nav-dropdown-adm2'),
      adm3: document.getElementById('nav-dropdown-adm3')
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

  init() {
    this.populateCountryDropdown()
    this.populateAllAdm1Options() // Initially show all ADM1s
    this.populateAllAdm2Options() // Initially show all ADM2s
    this.bindEvents()
    this.resizeAllDropdowns() // Initial resize
  }

  bindEvents() {
    // Global dropdown
    this.dropdowns.global.addEventListener('change', (e) => {
      if (e.target.value === 'global') {
        this.resetToGlobal()
      }
    })

    // Country dropdown
    this.dropdowns.country.addEventListener('change', (e) => {
      this.onCountryChange(e.target.value)
    })

    // ADM1 dropdown
    this.dropdowns.adm1.addEventListener('change', (e) => {
      this.onAdm1Change(e.target.value)
    })

    // ADM2 dropdown
    this.dropdowns.adm2.addEventListener('change', (e) => {
      this.onAdm2Change(e.target.value)
    })

    // ADM3 dropdown
    this.dropdowns.adm3.addEventListener('change', (e) => {
      this.onAdm3Change(e.target.value)
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

    // Clear existing options except placeholder
    this.dropdowns.country.innerHTML = '<option value="">Country</option>'

    countries.forEach(country => {
      const option = document.createElement('option')
      option.value = country.code
      option.textContent = country.name
      option.setAttribute('data-country', country.code)
      this.dropdowns.country.appendChild(option)
    })
  }

  /**
   * Populate ADM1 dropdown with all regions from all countries
   */
  populateAllAdm1Options() {
    this.dropdowns.adm1.innerHTML = '<option value="">ADM1</option>'

    const countries = ['AFG', 'PAK', 'SOM', 'YEM']
    countries.forEach(countryCode => {
      if (this.appState.geojson[countryCode] && this.appState.geojson[countryCode][1]) {
        const adm1Features = this.appState.geojson[countryCode][1].features
        adm1Features.forEach(feature => {
          const option = document.createElement('option')
          option.value = feature.properties.shapeName
          option.textContent = feature.properties.shapeName
          option.setAttribute('data-country', countryCode)
          this.dropdowns.adm1.appendChild(option)
        })
      }
    })
  }

  /**
   * Populate ADM2 dropdown with all districts from all countries
   */
  populateAllAdm2Options() {
    this.dropdowns.adm2.innerHTML = '<option value="">ADM2</option>'

    const countries = ['AFG', 'PAK', 'SOM', 'YEM']
    countries.forEach(countryCode => {
      if (this.appState.geojson[countryCode] && this.appState.geojson[countryCode][2]) {
        const adm2Features = this.appState.geojson[countryCode][2].features
        adm2Features.forEach(feature => {
          const option = document.createElement('option')
          option.value = feature.properties.shapeName
          option.textContent = feature.properties.shapeName
          option.setAttribute('data-country', countryCode)
          option.setAttribute('data-parent', feature.properties.parentAdm)
          this.dropdowns.adm2.appendChild(option)
        })
      }
    })
  }

  /**
   * Filter ADM1 dropdown based on selected country
   */
  filterAdm1ByCountry(countryCode) {
    this.dropdowns.adm1.innerHTML = '<option value="">ADM1</option>'

    if (!countryCode || !this.appState.geojson[countryCode]) {
      this.populateAllAdm1Options()
      return
    }

    const adm1Features = this.appState.geojson[countryCode][1].features
    adm1Features.forEach(feature => {
      const option = document.createElement('option')
      option.value = feature.properties.shapeName
      option.textContent = feature.properties.shapeName
      option.setAttribute('data-country', countryCode)
      this.dropdowns.adm1.appendChild(option)
    })
  }

  /**
   * Filter ADM2 dropdown based on selected country and optionally ADM1
   */
  filterAdm2(countryCode, adm1Name = null) {
    this.dropdowns.adm2.innerHTML = '<option value="">ADM2</option>'

    if (!countryCode || !this.appState.geojson[countryCode]) {
      this.populateAllAdm2Options()
      return
    }

    if (!this.appState.geojson[countryCode][2]) {
      return // No ADM2 data for this country
    }

    const adm2Features = this.appState.geojson[countryCode][2].features

    adm2Features.forEach(feature => {
      // If ADM1 is selected, only show ADM2s that belong to it
      if (adm1Name && feature.properties.parentAdm !== adm1Name) {
        return
      }

      const option = document.createElement('option')
      option.value = feature.properties.shapeName
      option.textContent = feature.properties.shapeName
      option.setAttribute('data-country', countryCode)
      option.setAttribute('data-parent', feature.properties.parentAdm)
      this.dropdowns.adm2.appendChild(option)
    })
  }

  /**
   * Filter ADM3 dropdown based on selected ADM2 (Pakistan only)
   */
  filterAdm3(countryCode, adm2Name) {
    this.dropdowns.adm3.innerHTML = '<option value="">ADM3</option>'

    if (countryCode !== 'PAK' || !adm2Name) {
      return
    }

    if (!this.appState.geojson[countryCode][3]) {
      return // No ADM3 data
    }

    const adm3Features = this.appState.geojson[countryCode][3].features

    adm3Features.forEach(feature => {
      if (feature.properties.parentAdm === adm2Name) {
        const option = document.createElement('option')
        option.value = feature.properties.shapeName
        option.textContent = feature.properties.shapeName
        option.setAttribute('data-country', countryCode)
        option.setAttribute('data-parent', feature.properties.parentAdm)
        this.dropdowns.adm3.appendChild(option)
      }
    })
  }

  /**
   * Enable or disable ADM3 dropdown based on country and ADM2 selection
   */
  updateAdm3State(countryCode, adm2Selected) {
    if (countryCode === 'PAK' && adm2Selected) {
      this.dropdowns.adm3.disabled = false
      this.dropdowns.adm3.classList.remove('dropdown-disabled')
    } else {
      this.dropdowns.adm3.disabled = true
      this.dropdowns.adm3.classList.add('dropdown-disabled')
      this.dropdowns.adm3.innerHTML = '<option value="">ADM3</option>'
    }
  }

  /**
   * Handle country selection
   */
  onCountryChange(countryCode) {
    if (!countryCode) {
      this.resetToGlobal()
      return
    }

    this.currentState.country = countryCode
    this.currentState.adm1 = null
    this.currentState.adm2 = null
    this.currentState.adm3 = null

    // Filter child dropdowns
    this.filterAdm1ByCountry(countryCode)
    this.filterAdm2(countryCode)
    this.updateAdm3State(countryCode, false)

    // Reset child dropdown selections
    this.dropdowns.adm1.value = ''
    this.dropdowns.adm2.value = ''
    this.dropdowns.adm3.value = ''

    // Resize dropdowns to fit content
    this.resizeAllDropdowns()

    // Navigate to country
    this.navigateToCountry(countryCode)
  }

  /**
   * Handle ADM1 selection
   */
  onAdm1Change(adm1Name) {
    if (!adm1Name || !this.currentState.country) {
      return
    }

    this.currentState.adm1 = adm1Name
    this.currentState.adm2 = null
    this.currentState.adm3 = null

    // Filter ADM2 by parent ADM1
    this.filterAdm2(this.currentState.country, adm1Name)
    this.updateAdm3State(this.currentState.country, false)

    // Reset child dropdown selections
    this.dropdowns.adm2.value = ''
    this.dropdowns.adm3.value = ''

    // Resize dropdowns to fit content
    this.resizeAllDropdowns()

    // Navigate to ADM1
    this.navigateToAdm1(this.currentState.country, adm1Name)
  }

  /**
   * Handle ADM2 selection
   */
  onAdm2Change(adm2Name) {
    if (!adm2Name || !this.currentState.country) {
      return
    }

    this.currentState.adm2 = adm2Name
    this.currentState.adm3 = null

    // Enable ADM3 for Pakistan
    this.updateAdm3State(this.currentState.country, true)
    this.filterAdm3(this.currentState.country, adm2Name)

    // Reset ADM3 selection
    this.dropdowns.adm3.value = ''

    // Resize dropdowns to fit content
    this.resizeAllDropdowns()

    // Navigate to ADM2
    this.navigateToAdm2(this.currentState.country, adm2Name)
  }

  /**
   * Handle ADM3 selection (Pakistan only)
   */
  onAdm3Change(adm3Name) {
    if (!adm3Name || this.currentState.country !== 'PAK') {
      return
    }

    this.currentState.adm3 = adm3Name

    // Navigate to ADM3
    this.navigateToAdm3(this.currentState.country, adm3Name)
  }

  /**
   * Navigate to country level
   */
  navigateToCountry(countryCode) {
    const countryFeature = this.appState.geojson[countryCode][0].features[0]
    if (countryFeature) {
      this.selectEntity(countryFeature.properties, this.appState)
    }
  }

  /**
   * Navigate to ADM1 level
   */
  navigateToAdm1(countryCode, adm1Name) {
    const adm1Features = this.appState.geojson[countryCode][1].features
    const targetFeature = adm1Features.find(f => f.properties.shapeName === adm1Name)

    if (targetFeature) {
      this.selectEntity(targetFeature.properties, this.appState)
    }
  }

  /**
   * Navigate to ADM2 level
   */
  navigateToAdm2(countryCode, adm2Name) {
    const adm2Features = this.appState.geojson[countryCode][2].features
    const targetFeature = adm2Features.find(f => f.properties.shapeName === adm2Name)

    if (targetFeature) {
      this.selectEntity(targetFeature.properties, this.appState)
    }
  }

  /**
   * Navigate to ADM3 level (Pakistan only)
   */
  navigateToAdm3(countryCode, adm3Name) {
    if (countryCode !== 'PAK') return

    const adm3Features = this.appState.geojson[countryCode][3].features
    const targetFeature = adm3Features.find(f => f.properties.shapeName === adm3Name)

    if (targetFeature) {
      this.selectEntity(targetFeature.properties, this.appState)
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

    // Reset dropdown values
    this.dropdowns.global.value = 'global'
    this.dropdowns.country.value = ''
    this.dropdowns.adm1.value = ''
    this.dropdowns.adm2.value = ''
    this.dropdowns.adm3.value = ''

    // Restore all options
    this.populateAllAdm1Options()
    this.populateAllAdm2Options()
    this.updateAdm3State(null, false)

    // Navigate to global
    this.selectEntity(null, this.appState)
  }

  /**
   * Update dropdowns based on current app state (for breadcrumb sync)
   */
  syncWithAppState() {
    const { admLevel, country, admName } = this.appState

    if (admLevel === 0) {
      // Global view
      this.resetToGlobal()
    } else if (admLevel === 1) {
      // Country level
      this.currentState.country = country
      this.dropdowns.country.value = country || ''
      this.filterAdm1ByCountry(country)
      this.filterAdm2(country)
      this.updateAdm3State(country, false)

      // Reset child dropdowns
      this.dropdowns.adm1.value = ''
      this.dropdowns.adm2.value = ''
      this.dropdowns.adm3.value = ''
    } else if (admLevel === 2) {
      // ADM1 level
      this.currentState.country = country
      this.currentState.adm1 = admName
      this.dropdowns.country.value = country
      this.filterAdm1ByCountry(country)
      this.dropdowns.adm1.value = admName
      this.filterAdm2(country, admName)
      this.updateAdm3State(country, false)

      // Reset child dropdowns
      this.dropdowns.adm2.value = ''
      this.dropdowns.adm3.value = ''
    } else if (admLevel === 3) {
      // ADM2 level
      const adm1Parent = this.getAdm1ParentForAdm2(country, admName)
      this.currentState.country = country
      this.currentState.adm1 = adm1Parent
      this.currentState.adm2 = admName
      this.dropdowns.country.value = country
      this.filterAdm1ByCountry(country)
      if (adm1Parent) {
        this.dropdowns.adm1.value = adm1Parent
      }
      this.filterAdm2(country, adm1Parent)
      this.dropdowns.adm2.value = admName
      this.updateAdm3State(country, true)
      this.filterAdm3(country, admName)

      // Reset ADM3 dropdown
      this.dropdowns.adm3.value = ''
    } else if (admLevel === 4) {
      // ADM3 level (Pakistan only)
      const adm2Parent = this.getAdm2ParentForAdm3(country, admName)
      const adm1Parent = adm2Parent ? this.getAdm1ParentForAdm2(country, adm2Parent) : null

      this.currentState.country = country
      this.currentState.adm1 = adm1Parent
      this.currentState.adm2 = adm2Parent
      this.currentState.adm3 = admName

      this.dropdowns.country.value = country
      this.filterAdm1ByCountry(country)
      if (adm1Parent) {
        this.dropdowns.adm1.value = adm1Parent
      }
      this.filterAdm2(country, adm1Parent)
      if (adm2Parent) {
        this.dropdowns.adm2.value = adm2Parent
      }
      this.updateAdm3State(country, true)
      this.filterAdm3(country, adm2Parent)
      this.dropdowns.adm3.value = admName
    }
  }

  /**
   * Get ADM1 parent for a given ADM2
   */
  getAdm1ParentForAdm2(countryCode, adm2Name) {
    if (!this.appState.geojson[countryCode] || !this.appState.geojson[countryCode][2]) {
      return null
    }

    const adm2Features = this.appState.geojson[countryCode][2].features
    const adm2Feature = adm2Features.find(f => f.properties.shapeName === adm2Name)
    return adm2Feature ? adm2Feature.properties.parentAdm : null
  }

  /**
   * Get ADM2 parent for a given ADM3
   */
  getAdm2ParentForAdm3(countryCode, adm3Name) {
    if (!this.appState.geojson[countryCode] || !this.appState.geojson[countryCode][3]) {
      return null
    }

    const adm3Features = this.appState.geojson[countryCode][3].features
    const adm3Feature = adm3Features.find(f => f.properties.shapeName === adm3Name)
    return adm3Feature ? adm3Feature.properties.parentAdm : null
  }

  /**
   * Resize a dropdown to fit its content
   */
  resizeDropdown(dropdown) {
    if (!dropdown) return

    // Create temporary element to measure text width
    const tempSelect = document.createElement('select')
    tempSelect.style.position = 'absolute'
    tempSelect.style.visibility = 'hidden'
    tempSelect.style.fontSize = getComputedStyle(dropdown).fontSize
    tempSelect.style.fontFamily = getComputedStyle(dropdown).fontFamily
    tempSelect.style.padding = getComputedStyle(dropdown).padding
    document.body.appendChild(tempSelect)

    // Get the widest option text (or selected option)
    let maxWidth = 0
    const selectedOption = dropdown.options[dropdown.selectedIndex]
    const textToMeasure = selectedOption ? selectedOption.text : dropdown.options[0]?.text || 'Country'

    // Create option and measure
    const tempOption = document.createElement('option')
    tempOption.text = textToMeasure
    tempSelect.appendChild(tempOption)

    // Measure width and add padding for dropdown arrow
    const measuredWidth = tempSelect.offsetWidth
    maxWidth = Math.max(maxWidth, measuredWidth)

    // Clean up
    document.body.removeChild(tempSelect)

    // Set width with padding for arrow (22px) plus some buffer
    dropdown.style.width = `${maxWidth + 30}px`
  }

  /**
   * Resize all dropdowns
   */
  resizeAllDropdowns() {
    Object.values(this.dropdowns).forEach(dropdown => {
      if (dropdown && dropdown.tagName === 'SELECT') {
        this.resizeDropdown(dropdown)
      }
    })
  }
}
