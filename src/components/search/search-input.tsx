'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  platforms: string[]
  onPlatformsChange: (platforms: string[]) => void
  loading?: boolean
  placeholder?: string
  className?: string
}

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  beatport: 'Beatport',
}

const PLATFORM_COLORS = {
  spotify: 'bg-green-500',
  soundcloud: 'bg-orange-500',
  beatport: 'bg-purple-500',
}

export function SearchInput({
  value,
  onChange,
  onClear,
  platforms,
  onPlatformsChange,
  loading = false,
  placeholder = 'Search for songs, artists, or albums...',
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePlatformToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      onPlatformsChange(platforms.filter(p => p !== platform))
    } else {
      onPlatformsChange([...platforms, platform])
    }
  }

  const handleClear = () => {
    onChange('')
    onClear()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-20 h-12 text-base',
            isFocused && 'ring-2 ring-primary/20',
            loading && 'animate-pulse'
          )}
          disabled={loading}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Search Platforms</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={platforms.includes(key)}
                  onCheckedChange={() => handlePlatformToggle(key)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[key as keyof typeof PLATFORM_COLORS])} />
                    {label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Platform badges */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {platforms.map((platform) => (
            <Badge
              key={platform}
              variant="secondary"
              className="text-xs"
            >
              <div className={cn('w-2 h-2 rounded-full mr-1', PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS])} />
              {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]}
            </Badge>
          ))}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!isFocused && !value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      )}
    </div>
  )
}