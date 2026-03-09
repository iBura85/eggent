"use client"

import { SidebarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

export function SiteHeader({
  title,
  variant = "default",
}: {
  title?: string
  variant?: "default" | "chat"
}) {
  const { toggleSidebar } = useSidebar()
  const isChat = variant === "chat"

  return (
    <header
      className={`sticky top-0 z-50 flex w-full items-center ${
        isChat
          ? "border-b border-white/8 bg-background/80 backdrop-blur-xl"
          : "border-b bg-background"
      }`}
    >
      <div
        className={`flex h-(--header-height) w-full items-center ${
          isChat ? "gap-3 px-5 md:px-6" : "gap-2 px-4"
        }`}
      >
        <Button
          className={isChat ? "h-9 w-9 rounded-full" : "h-8 w-8"}
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        {!isChat ? (
          <Separator orientation="vertical" className="mr-2 h-4" />
        ) : null}
        <h1 className={isChat ? "text-sm font-medium tracking-[0.02em] text-foreground/90" : "text-sm font-medium"}>
          {title || "Eggent"}
        </h1>
      </div>
    </header>
  )
}
