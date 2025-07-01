"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Music
} from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  {
    title: "Playlists",
    href: "/dashboard/playlists",
    icon: Music,
  },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
      <div className="flex justify-center px-2 py-3">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-6 text-sm transition-colors rounded-lg",
                isActive 
                  ? "text-foreground font-medium bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-6 w-6 mb-1", isActive && "text-primary")} />
              <span className="text-xs leading-tight">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}