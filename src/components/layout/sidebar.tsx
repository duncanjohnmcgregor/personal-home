"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Folder, 
  Music
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  {
    title: "My Playlists",
    href: "/dashboard/playlists",
    icon: Music,
    description: "Drag and drop songs between playlists"
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
          <div className="flex items-center gap-2 mb-4 px-4">
            <Folder className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold tracking-tight">
              Playlist Manager
            </h2>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    pathname === item.href && "bg-muted font-medium"
                  )}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {item.description}
                    </p>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}