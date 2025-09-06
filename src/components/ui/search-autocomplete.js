'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchAutocomplete({ 
  items = [], 
  value = '', 
  onChange, 
  placeholder = 'Pesquisar...',
  category = '',
  categoryLabel = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const timeoutRef = useRef(null)

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Create search index for performance
  const searchIndex = useMemo(() => {
    const index = {}
    items.forEach(item => {
      const normalizedName = item.nome_curso.toLowerCase()
      // Index by first letters for fast lookup
      for (let i = 1; i <= Math.min(normalizedName.length, 5); i++) {
        const prefix = normalizedName.substring(0, i)
        if (!index[prefix]) index[prefix] = []
        index[prefix].push(item)
      }
    })
    return index
  }, [items])

  // Get suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    
    const term = searchTerm.toLowerCase()
    const results = new Set()
    
    // Fast prefix matching
    if (searchIndex[term.substring(0, Math.min(term.length, 5))]) {
      searchIndex[term.substring(0, Math.min(term.length, 5))].forEach(item => {
        if (item.nome_curso.toLowerCase().includes(term) ||
            (item.subcategoria && item.subcategoria.toLowerCase().includes(term))) {
          results.add(item)
        }
      })
    }
    
    // Fallback to full search if no prefix matches
    if (results.size === 0) {
      items.forEach(item => {
        if (item.nome_curso.toLowerCase().includes(term) ||
            (item.subcategoria && item.subcategoria.toLowerCase().includes(term))) {
          results.add(item)
        }
      })
    }
    
    return Array.from(results).slice(0, 10) // Limit to 10 suggestions
  }, [searchTerm, items, searchIndex])

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedIndex(-1)
    
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    // Debounce the onChange callback
    timeoutRef.current = setTimeout(() => {
      onChange(value)
      setIsOpen(value.length > 0)
    }, 300)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.nome_curso)
    onChange(suggestion.nome_curso)
    setIsOpen(false)
    setSelectedIndex(-1)
    
    // On mobile, blur input to hide keyboard
    if (isMobile && inputRef.current) {
      inputRef.current.blur()
    }
  }

  // Close modal
  const closeModal = () => {
    setIsOpen(false)
    setSelectedIndex(-1)
    if (inputRef.current) inputRef.current.blur()
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    onChange('')
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Desktop dropdown component
  const DesktopDropdown = () => (
    isOpen && suggestions.length > 0 && (
      <div 
        ref={suggestionsRef}
        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0 ${
              index === selectedIndex ? 'bg-blue-50' : ''
            }`}
            onClick={() => selectSuggestion(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="font-medium text-gray-900">
              {suggestion.nome_curso}
            </div>
            {suggestion.subcategoria && (
              <div className="text-sm text-gray-500">
                {suggestion.subcategoria}
              </div>
            )}
          </button>
        ))}
      </div>
    )
  )

  // Mobile modal component
  const MobileModal = () => (
    isOpen && isMobile && (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b bg-gray-50">
          <button
            onClick={closeModal}
            className="p-2 -ml-2 mr-2"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Pesquisar em</div>
            <div className="font-medium text-gray-900">{categoryLabel}</div>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder={placeholder}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                className={`w-full px-4 py-4 text-left border-b active:bg-gray-100 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => selectSuggestion(suggestion)}
              >
                <div className="font-medium text-gray-900 text-base">
                  {suggestion.nome_curso}
                </div>
                {suggestion.subcategoria && (
                  <div className="text-sm text-gray-500 mt-1">
                    {suggestion.subcategoria}
                  </div>
                )}
              </button>
            ))
          ) : searchTerm.length >= 2 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum curso encontrado para "{searchTerm}"
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
        </div>
      </div>
    )
  )

  return (
    <>
      {/* Desktop Input */}
      <div className={`relative ${isMobile ? 'w-full' : ''}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (isMobile) {
                setIsOpen(true)
              } else if (searchTerm.length > 0) {
                setIsOpen(true)
              }
            }}
            onBlur={() => {
              if (!isMobile) {
                // Delay to allow click on suggestion
                setTimeout(() => setIsOpen(false), 200)
              }
            }}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
          />
          {searchTerm && !isMobile && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Desktop Dropdown */}
        {!isMobile && <DesktopDropdown />}
      </div>

      {/* Mobile Modal */}
      {isMobile && <MobileModal />}
    </>
  )
}