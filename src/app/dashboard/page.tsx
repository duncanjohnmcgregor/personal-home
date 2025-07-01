import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Simple redirect to playlists since that's the only functionality we need
  redirect('/dashboard/playlists')
}