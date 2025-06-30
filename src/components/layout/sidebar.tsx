"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Music, 
  Download, 
  Link as LinkIcon, 
  History, 
  Settings 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "My Playlists",
    href: "/dashboard/playlists",
    icon: Music,
  },
  {
    title: "Import from Spotify",
    href: "/dashboard/import/spotify",
    icon: Download,
  },
  {
    title: "Connect Platforms",
    href: "/dashboard/connect",
    icon: LinkIcon,
  },
  {
    title: "Purchase History",
    href: "/dashboard/history",
    icon: History,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Music Manager
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href && "bg-muted font-medium"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link href="/dashboard/settings">
              <Button
                variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === "/dashboard/settings" && "bg-muted font-medium"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}