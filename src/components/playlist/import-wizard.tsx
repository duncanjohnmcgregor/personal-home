'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface ImportStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

interface ImportWizardProps {
  onComplete: () => void
  selectedPlaylists: string[]
  playlistNames: Map<string, string>
}

export function ImportWizard({ onComplete, selectedPlaylists, playlistNames }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<ImportStep[]>([
    {
      id: 'fetch',
      title: 'Fetching playlist details',
      description: 'Retrieving playlist information from Spotify',
      status: 'active'
    },
    {
      id: 'songs',
      title: 'Importing songs',
      description: 'Adding songs to your library',
      status: 'pending'
    },
    {
      id: 'organize',
      title: 'Organizing playlists',
      description: 'Creating playlists in your library',
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Import complete',
      description: 'Your playlists have been imported successfully',
      status: 'pending'
    }
  ])
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const updateStepStatus = (stepId: string, status: ImportStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const startImport = async () => {
    try {
      // Simulate import process
      for (let i = 0; i < selectedPlaylists.length; i++) {
        const playlistId = selectedPlaylists[i]
        
        // Update progress
        setProgress(Math.round(((i + 1) / selectedPlaylists.length) * 100))
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Update steps based on progress
        if (i === 0) {
          updateStepStatus('fetch', 'completed')
          updateStepStatus('songs', 'active')
          setCurrentStep(1)
        } else if (i === Math.floor(selectedPlaylists.length / 2)) {
          updateStepStatus('songs', 'completed')
          updateStepStatus('organize', 'active')
          setCurrentStep(2)
        }
        
        setImportedCount(i + 1)
      }
      
      // Complete the import
      updateStepStatus('organize', 'completed')
      updateStepStatus('complete', 'completed')
      setCurrentStep(3)
      setProgress(100)
      
      // Wait a bit before calling onComplete
      setTimeout(onComplete, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import')
      updateStepStatus(steps[currentStep].id, 'error')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importing Playlists</CardTitle>
        <CardDescription>
          Importing {selectedPlaylists.length} playlist{selectedPlaylists.length !== 1 ? 's' : ''} from Spotify
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {importedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Imported {importedCount} of {selectedPlaylists.length} playlists
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="mt-0.5">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : step.status === 'error' ? (
                  <Circle className="h-5 w-5 text-destructive" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${
                  step.status === 'active' ? 'text-foreground' : 
                  step.status === 'completed' ? 'text-muted-foreground' :
                  step.status === 'error' ? 'text-destructive' :
                  'text-muted-foreground/50'
                }`}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Action Button */}
        {currentStep === 0 && !error && (
          <Button onClick={startImport} className="w-full">
            Start Import
          </Button>
        )}
        
        {currentStep === 3 && (
          <Button onClick={onComplete} className="w-full">
            View Imported Playlists
          </Button>
        )}
        
        {error && (
          <Button onClick={onComplete} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  )
}