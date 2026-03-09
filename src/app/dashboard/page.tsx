import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ChatPanel } from "@/components/chat/chat-panel"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import {
  getAllProjects,
} from "@/lib/storage/project-store"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const projects = await getAllProjects()

  if (projects.length === 0) {
    redirect("/dashboard/projects")
  }

  return (
    <div className="[--header-height:calc(--spacing(14))] h-dvh overflow-hidden bg-background">
      <SidebarProvider className="flex h-dvh min-h-dvh flex-col overflow-hidden">
        <SiteHeader title="Chat" variant="chat" />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-hidden bg-transparent">
            <div className="flex h-[calc(100dvh-var(--header-height))] min-h-0 flex-1 flex-col overflow-hidden">
              <ChatPanel />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
