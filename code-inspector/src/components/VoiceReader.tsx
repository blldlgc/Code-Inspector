import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAccessibility } from '@/context/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceReaderProps {
  text: string;
  title?: string;
  className?: string;
}

export const VoiceReader: React.FC<VoiceReaderProps> = ({ text, title, className }) => {
  const { settings } = useAccessibility();
  const [speed, setSpeed] = useState(settings.voiceReadingSpeed || 1.0);
  
  const {
    speak,
    pause,
    resume,
    stop,
    repeat,
    isPlaying,
    isPaused,
    isLoading,
    error,
    progress,
  } = useTextToSpeech({
    language: 'en-US',
    speed: speed,
  });

  // Hız değiştiğinde güncelle
  useEffect(() => {
    setSpeed(settings.voiceReadingSpeed || 1.0);
  }, [settings.voiceReadingSpeed]);

  // Cleanup on unmount - stop any ongoing playback
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Sesli okuma aktif değilse bileşeni gösterme
  if (!settings.voiceReadingEnabled) {
    return null;
  }

  // Web Speech API desteği kontrolü
  const isWebSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handlePlay = () => {
    if (isPaused) {
      resume();
    } else {
      speak(text, { speed });
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleRepeat = () => {
    repeat(text, { speed });
  };

  if (!text || text.trim().length === 0) {
    return null;
  }

  // Show information if Web Speech API is not supported
  if (!isWebSpeechSupported) {
    return (
      <div className={cn("border rounded-lg p-4 space-y-3 bg-muted/50", className)}>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Text-to-speech is currently unavailable</p>
          <p className="text-xs">
            Your browser does not support text-to-speech. This feature will be updated to work through the backend soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)}>
      {title && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="h-4 w-4" />
          <span>{title}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePlay}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          ) : isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </Button>

        {isPlaying && (
          <Button
            onClick={pause}
            size="sm"
            variant="outline"
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}

        <Button
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
          size="sm"
          variant="outline"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleRepeat}
          disabled={!isPlaying && !isPaused}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Repeat
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground">Speed:</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => {
              const newSpeed = parseFloat(e.target.value);
              setSpeed(newSpeed);
              if (isPlaying) {
                stop();
                setTimeout(() => speak(text, { speed: newSpeed }), 100);
              }
            }}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground w-8">{speed.toFixed(1)}x</span>
        </div>
      </div>

      {isPlaying && (
        <Progress value={progress} className="h-2" />
      )}

      {error && !error.message.includes('interrupted') && !error.message.includes('removed from the document') && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
          <div className="font-medium">{error.message.split('\n\n')[0]}</div>
          {error.message.includes('\n\n') && (
            <div className="text-xs text-muted-foreground whitespace-pre-line mt-2">
              {error.message.split('\n\n')[1]}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


