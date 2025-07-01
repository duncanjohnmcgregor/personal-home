"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Music, 
  Download, 
  Link as LinkIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Playlists",
    href: "/dashboard/playlists",
    icon: Music,
  },
  {
    title: "Import",
    href: "/dashboard/import/spotify",
    icon: Download,
  },
  {
    title: "Connect",
    href: "/dashboard/connect",
    icon: LinkIcon,
  },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid grid-cols-4 gap-1 p-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 text-xs transition-colors",
                isActive 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
              <span className="text-[10px]">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}