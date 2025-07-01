'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Playlist, CreatePlaylistData, UpdatePlaylistData } from '@/types/playlist'

const playlistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

type PlaylistFormData = z.infer<typeof playlistSchema>

interface PlaylistFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist?: Playlist
  onSubmit: (data: CreatePlaylistData | UpdatePlaylistData) => Promise<void>
  isSubmitting?: boolean
}

export function PlaylistForm({
  open,
  onOpenChange,
  playlist,
  onSubmit,
  isSubmitting = false,
}: PlaylistFormProps) {
  const isEditing = !!playlist

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: playlist?.name || '',
      description: playlist?.description || '',
      isPublic: playlist?.isPublic || false,
    },
  })

  const handleSubmit = async (data: PlaylistFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error)
    }
  }

  // Reset form when playlist changes or dialog closes
  useState(() => {
    if (playlist) {
      form.reset({
        name: playlist.name,
        description: playlist.description || '',
        isPublic: playlist.isPublic,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        isPublic: false,
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Playlist' : 'Create New Playlist'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your playlist details below.'
              : 'Create a new playlist to organize your music.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter playlist name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter playlist description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your playlist
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Playlist</FormLabel>
                    <FormDescription>
                      Make this playlist visible to other users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (isEditing ? 'Updating...' : 'Creating...')
                  : (isEditing ? 'Update Playlist' : 'Create Playlist')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}