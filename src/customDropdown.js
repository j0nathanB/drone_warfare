/**
 * Custom Dropdown Component
 *
 * Replaces native select elements with custom JavaScript dropdowns
 * that maintain consistent widths regardless of content.
 *
 * Features:
 * - Consistent minimal width for dropdown triggers
 * - Text truncation with ellipsis for long options
 * - Full text display in dropdown menu
 * - Keyboard navigation (Enter, Escape, Arrow keys)
 * - Click-outside-to-close functionality
 * - Disabled state support
 * - Integration with existing dropdown navigation
 */

export class CustomDropdown {
  constructor(config) {
    this.id = config.id
    this.containerId = config.containerId
    this.placeholder = config.placeholder
    this.dataAttr = config.dataAttr
    this.disabled = config.disabled || false
    this.onChange = config.onChange || (() => {})

    this.isOpen = false
    this.options = []
    this.selectedValue = null
    this.selectedText = null
    this.highlightedIndex = -1

    this.init()
  }

  init() {
    // Create dropdown structure
    this.createDropdownStructure()

    // Bind event listeners
    this.bindEvents()
  }

  createDropdownStructure() {
    const container = document.getElementById(this.containerId)
    if (!container) {
      console.error(`Container ${this.containerId} not found`)
      return
    }

    // Create wrapper
    this.wrapper = document.createElement('div')
    this.wrapper.className = 'custom-dropdown-wrapper'
    this.wrapper.setAttribute('data-cy', this.dataAttr)

    // Create trigger button
    this.trigger = document.createElement('button')
    this.trigger.className = 'custom-dropdown-trigger'
    this.trigger.setAttribute('type', 'button')
    this.trigger.setAttribute('role', 'button')
    this.trigger.setAttribute('aria-haspopup', 'listbox')
    this.trigger.setAttribute('aria-expanded', 'false')

    if (this.disabled) {
      this.trigger.classList.add('dropdown-disabled')
      this.trigger.disabled = true
    }

    // Create display text span
    this.displayText = document.createElement('span')
    this.displayText.className = 'dropdown-display-text'
    this.displayText.textContent = this.placeholder

    // Create caret icon
    this.caret = document.createElement('span')
    this.caret.className = 'dropdown-caret'
    this.caret.innerHTML = '▼'

    this.trigger.appendChild(this.displayText)
    this.trigger.appendChild(this.caret)

    // Create dropdown menu
    this.menu = document.createElement('div')
    this.menu.className = 'custom-dropdown-menu'
    this.menu.setAttribute('data-cy', `dropdown-menu-${this.id}`)
    this.menu.setAttribute('role', 'listbox')
    this.menu.style.display = 'none'

    // Assemble
    this.wrapper.appendChild(this.trigger)
    this.wrapper.appendChild(this.menu)

    // Replace existing element or append
    const existingSelect = document.querySelector(`[data-cy="${this.dataAttr}"]`)
    if (existingSelect) {
      existingSelect.replaceWith(this.wrapper)
    } else {
      container.appendChild(this.wrapper)
    }
  }

  bindEvents() {
    // Click trigger to toggle
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!this.disabled) {
        this.toggle()
      }
    })

    // Keyboard navigation
    this.trigger.addEventListener('keydown', (e) => {
      if (this.disabled) return

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (this.isOpen) {
            this.selectHighlighted()
          } else {
            this.open()
          }
          break
        case 'Escape':
          e.preventDefault()
          this.close()
          break
        case 'ArrowDown':
          e.preventDefault()
          if (this.isOpen) {
            this.highlightNext()
          } else {
            this.open()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (this.isOpen) {
            this.highlightPrevious()
          }
          break
      }
    })

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.close()
      }
    })
  }

  populateOptions(options) {
    this.options = options
    this.menu.innerHTML = ''

    options.forEach((option, index) => {
      const optionEl = document.createElement('div')
      optionEl.className = 'dropdown-option'
      optionEl.textContent = option.text
      optionEl.setAttribute('data-value', option.value)
      optionEl.setAttribute('data-index', index)
      optionEl.setAttribute('role', 'option')

      // Copy data attributes for filtering
      if (option.dataAttrs) {
        Object.keys(option.dataAttrs).forEach(key => {
          optionEl.setAttribute(`data-${key}`, option.dataAttrs[key])
        })
      }

      // Click handler
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation()
        this.selectOption(option.value, option.text)
      })

      // Hover handler
      optionEl.addEventListener('mouseenter', () => {
        this.highlightIndex(index)
      })

      this.menu.appendChild(optionEl)
    })
  }

  open() {
    if (this.disabled) return

    // Close other dropdowns
    document.querySelectorAll('.custom-dropdown-menu').forEach(menu => {
      if (menu !== this.menu) {
        menu.style.display = 'none'
        menu.classList.remove('dropdown-menu-open')
      }
    })

    this.isOpen = true
    this.menu.style.display = 'block'
    this.menu.classList.add('dropdown-menu-open')
    this.trigger.setAttribute('aria-expanded', 'true')
    this.trigger.classList.add('dropdown-open')

    // Reset highlight
    this.highlightedIndex = -1
  }

  close() {
    this.isOpen = false
    this.menu.style.display = 'none'
    this.menu.classList.remove('dropdown-menu-open')
    this.trigger.setAttribute('aria-expanded', 'false')
    this.trigger.classList.remove('dropdown-open')
    this.highlightedIndex = -1

    // Remove all highlights
    this.menu.querySelectorAll('.dropdown-option').forEach(opt => {
      opt.classList.remove('dropdown-option-highlighted', 'dropdown-option-hover')
    })
  }

  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  selectOption(value, text) {
    this.selectedValue = value
    this.selectedText = text
    this.displayText.textContent = text || this.placeholder
    this.close()

    // Trigger change callback
    this.onChange(value, text)
  }

  highlightIndex(index) {
    // Remove previous highlight
    this.menu.querySelectorAll('.dropdown-option').forEach(opt => {
      opt.classList.remove('dropdown-option-highlighted', 'dropdown-option-hover')
    })

    // Add new highlight
    const options = this.menu.querySelectorAll('.dropdown-option')
    if (index >= 0 && index < options.length) {
      this.highlightedIndex = index
      options[index].classList.add('dropdown-option-highlighted', 'dropdown-option-hover')

      // Scroll into view
      options[index].scrollIntoView({ block: 'nearest' })
    }
  }

  highlightNext() {
    const nextIndex = Math.min(this.highlightedIndex + 1, this.options.length - 1)
    this.highlightIndex(nextIndex)
  }

  highlightPrevious() {
    const prevIndex = Math.max(this.highlightedIndex - 1, 0)
    this.highlightIndex(prevIndex)
  }

  selectHighlighted() {
    if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
      const option = this.options[this.highlightedIndex]
      this.selectOption(option.value, option.text)
    }
  }

  reset() {
    this.selectedValue = null
    this.selectedText = null
    this.displayText.textContent = this.placeholder
    this.close()
  }

  enable() {
    this.disabled = false
    this.trigger.disabled = false
    this.trigger.classList.remove('dropdown-disabled')
  }

  disable() {
    this.disabled = true
    this.trigger.disabled = true
    this.trigger.classList.add('dropdown-disabled')
    this.close()
  }

  getValue() {
    return this.selectedValue
  }

  getText() {
    return this.selectedText
  }

  getOptions() {
    return this.options
  }

  // Filter options based on criteria
  filterOptions(filterFn) {
    const allOptions = this.menu.querySelectorAll('.dropdown-option')
    let visibleCount = 0

    allOptions.forEach(optionEl => {
      const value = optionEl.getAttribute('data-value')
      const text = optionEl.textContent
      const dataAttrs = {}

      // Extract data attributes
      Array.from(optionEl.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          const key = attr.name.replace('data-', '')
          dataAttrs[key] = attr.value
        }
      })

      const shouldShow = filterFn({ value, text, dataAttrs })

      if (shouldShow) {
        optionEl.style.display = 'block'
        visibleCount++
      } else {
        optionEl.style.display = 'none'
      }
    })

    // Update options array
    this.options = Array.from(allOptions)
      .filter(opt => opt.style.display !== 'none')
      .map((opt, index) => {
        const dataAttrs = {}
        // Preserve all data attributes
        Array.from(opt.attributes).forEach(attr => {
          if (attr.name.startsWith('data-') && !['data-value', 'data-index'].includes(attr.name)) {
            const key = attr.name.replace('data-', '')
            dataAttrs[key] = attr.value
          }
        })
        return {
          value: opt.getAttribute('data-value'),
          text: opt.textContent,
          dataAttrs
        }
      })

    return visibleCount
  }

  // Sync with current state
  syncValue(value, text) {
    this.selectedValue = value
    this.selectedText = text
    this.displayText.textContent = text || this.placeholder
  }
}
