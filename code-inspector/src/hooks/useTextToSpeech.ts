import { useState, useRef, useCallback, useEffect } from 'react';
import { ttsApi, TTSRequest } from '@/lib/ttsApi';

interface UseTextToSpeechOptions {
  language?: string;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // For backend audio playback

  // Text-to-speech using Web Speech API with backend fallback
  const speak = useCallback(async (text: string, requestOptions?: Partial<TTSRequest>) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:25',message:'speak called',data:{textLength:text.length,hasRequestOptions:!!requestOptions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      setIsLoading(true);
      setError(null);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:32',message:'Checking Web Speech API',data:{hasSpeechSynthesis:'speechSynthesis' in window,isDefined:window.speechSynthesis !== undefined,isNotNull:window.speechSynthesis !== null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Try Web Speech API first
      if ('speechSynthesis' in window && window.speechSynthesis) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:37',message:'Trying Web Speech API',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        try {
          await speakWithWebSpeechAPI(text, requestOptions);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:41',message:'Web Speech API succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          return;
        } catch (webSpeechError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:46',message:'Web Speech API failed, trying backend',data:{error:webSpeechError instanceof Error ? webSpeechError.message : String(webSpeechError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          // Web Speech API failed, silently try backend fallback (don't show error to user yet)
          console.debug('Web Speech API failed, trying backend fallback:', webSpeechError);
          try {
            await speakWithBackend(text, requestOptions);
            return; // Backend succeeded, no error shown
          } catch (backendError) {
            // Both failed, show error
            const error = backendError instanceof Error ? backendError : new Error('Text-to-speech failed. Both Web Speech API and backend service are unavailable.');
            setError(error);
            setIsLoading(false);
            options.onError?.(error);
            throw error;
          }
        }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:52',message:'Web Speech API not available, using backend',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Web Speech API not available, use backend
        await speakWithBackend(text, requestOptions);
        return;
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:58',message:'speak catch block',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);
      options.onError?.(error);
    }
  }, [options]);

  // Web Speech API implementation
  const speakWithWebSpeechAPI = useCallback(async (text: string, requestOptions?: Partial<TTSRequest>) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:65',message:'speakWithWebSpeechAPI called',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Web Speech API check
    if (!('speechSynthesis' in window)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:69',message:'speechSynthesis not in window',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw new Error('Your browser does not support text-to-speech. Please use a modern browser (Chrome, Edge, Safari).');
    }

    // SpeechSynthesis status check
    if (window.speechSynthesis === undefined || window.speechSynthesis === null) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:75',message:'speechSynthesis is null/undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw new Error('Speech synthesis service is unavailable. Please check your system audio settings.');
    }

      // Wait for voices to load (async in some browsers)
      const loadVoices = (): Promise<void> => {
        return new Promise((resolve) => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve();
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              resolve();
            };
            // Timeout: continue after 2 seconds
            setTimeout(() => resolve(), 2000);
          }
        });
      };

      await loadVoices();

      // Stop previous reading
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }

      // Create new utterance wrapped in Promise for error handling
      return new Promise<void>((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const language = requestOptions?.language || options.language || 'en-US';
        
        // English voice support check
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') || voice.lang === 'en-US' || voice.lang === 'en-GB'
        );
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          utterance.lang = englishVoice.lang;
        } else {
          // If no English voice, check available voices
          const availableVoices = voices.filter(voice => voice.lang);
          if (availableVoices.length > 0) {
            // Find best match (en starting or closest)
            const bestVoice = availableVoices.find(voice => voice.lang.startsWith('en')) 
              || availableVoices.find(voice => voice.lang.includes('US') || voice.lang.includes('GB'))
              || availableVoices[0];
            utterance.voice = bestVoice;
            utterance.lang = bestVoice.lang;
          } else {
            utterance.lang = language;
          }
        }
        
        utterance.rate = requestOptions?.speed || options.speed || 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Event handlers
        utterance.onstart = () => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:123',message:'utterance.onstart triggered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setIsPlaying(true);
          setIsPaused(false);
          setIsLoading(false);
          startTimeRef.current = Date.now();
          options.onStart?.();

          // Progress tracking
          progressIntervalRef.current = window.setInterval(() => {
            if (startTimeRef.current && durationRef.current > 0) {
              const elapsed = Date.now() - startTimeRef.current;
              const newProgress = Math.min(100, (elapsed / durationRef.current) * 100);
              setProgress(newProgress);
            }
          }, 100);
        };

        utterance.onend = () => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:140',message:'utterance.onend triggered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          startTimeRef.current = null;
          options.onEnd?.();
          resolve();
        };

        utterance.onerror = (event) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:151',message:'utterance.onerror triggered',data:{error:event.error,errorType:typeof event.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          
          // Translate error messages to English and add solution suggestions
          let errorMessage = 'Text-to-speech error: ';
          let solution = '';
          
          switch (event.error) {
            case 'network':
              errorMessage += 'Network error. Please check your internet connection.';
              break;
            case 'synthesis-failed':
              errorMessage += 'Speech synthesis failed.';
              solution = 'This issue is usually caused by system audio services. Solution suggestions:\n' +
                        '1. Check your system audio settings\n' +
                        '2. Completely close and reopen your browser\n' +
                        '3. Restart your computer\n' +
                        '4. Check your system language settings (English voice packs should be installed)\n' +
                        '5. Alternatively, you can copy the text and read it in another application';
              break;
            case 'synthesis-unavailable':
              errorMessage += 'Speech synthesis unavailable.';
              solution = 'System audio services may not be running. Please check your system settings.';
              break;
            case 'audio-busy':
              errorMessage += 'Audio output is busy. Please wait and try again.';
              break;
            case 'not-allowed':
              errorMessage += 'Text-to-speech permission denied.';
              solution = 'Please check microphone and audio permissions in your browser settings.';
              break;
            default:
              errorMessage += `Unknown error: ${event.error}`;
              solution = 'Please check your browser console or contact your system administrator.';
          }
          
          // Don't set error here - let backend fallback handle it
          // Only reject to trigger backend fallback
          const error = new Error('Web Speech API failed, trying backend');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:188',message:'Rejecting promise from utterance.onerror (silent fallback)',data:{error:event.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          // Reject promise to trigger backend fallback (don't show error to user yet)
          reject(error);
        };

        // Duration estimation (can use duration from backend, for now estimate)
        const estimatedDuration = (text.split(' ').length / 150) * 60 * 1000; // 150 words per minute
        durationRef.current = estimatedDuration / utterance.rate;

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
  }, [options]);

  // Backend fallback implementation
  const speakWithBackend = useCallback(async (text: string, requestOptions?: Partial<TTSRequest>) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:210',message:'speakWithBackend called',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      console.log('Using backend TTS fallback for text:', text.substring(0, 50) + '...');
      
      const request = {
        text,
        language: requestOptions?.language || options.language || 'en-US',
        speed: requestOptions?.speed || options.speed || 1.0,
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:220',message:'Calling backend TTS API',data:{request},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Call backend TTS API
      const response = await ttsApi.speak(request);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:224',message:'Backend TTS API response received',data:{contentType:response.contentType,hasAudioBase64:!!response.audioBase64,duration:response.duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Check if backend returned audio data
      if (response.contentType === 'text/plain') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:228',message:'Backend returned text/plain, not audio',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Backend returned text (not audio) - this means backend TTS failed
        // Decode the text to show user what was attempted
        const decodedText = atob(response.audioBase64);
        throw new Error('Text-to-speech service is currently unavailable. The backend TTS service could not generate audio. This may be due to:\n' +
          '1. TTS service API limitations or rate limiting\n' +
          '2. Network connectivity issues\n' +
          '3. Service configuration problems\n\n' +
          'Please try again later or contact support. The text that was attempted: ' + 
          decodedText.substring(0, Math.min(100, decodedText.length)) + '...');
      } else if (response.contentType?.startsWith('audio/')) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:233',message:'Backend returned audio, playing',data:{contentType:response.contentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Backend returned audio, play it
        const audioData = Uint8Array.from(atob(response.audioBase64), c => c.charCodeAt(0));
        const blob = new Blob([audioData], { type: response.contentType });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        audio.playbackRate = requestOptions?.speed || options.speed || 1.0;
        
        audio.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setIsLoading(false);
          startTimeRef.current = Date.now();
          durationRef.current = response.duration || 0;
          options.onStart?.();
          
          progressIntervalRef.current = window.setInterval(() => {
            if (startTimeRef.current && durationRef.current > 0) {
              const elapsed = Date.now() - startTimeRef.current;
              const newProgress = Math.min(100, (elapsed / durationRef.current) * 100);
              setProgress(newProgress);
            }
          }, 100);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          URL.revokeObjectURL(audioUrl);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          startTimeRef.current = null;
          options.onEnd?.();
        };
        
        audio.onerror = (e) => {
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          URL.revokeObjectURL(audioUrl);
          // Ignore "play() interrupted" errors - these are usually harmless
          const errorMessage = e.message || '';
          if (!errorMessage.includes('interrupted') && !errorMessage.includes('removed from the document')) {
            const error = new Error('Failed to play audio from backend');
            setError(error);
            options.onError?.(error);
          }
        };
        
        // Store audio ref for cleanup
        audioRef.current = audio;
        utteranceRef.current = audio as any;
        
        // Play audio with error handling for interrupted play() calls
        try {
          await audio.play();
        } catch (playError: any) {
          // Ignore "play() interrupted" errors - these are usually harmless
          const errorMessage = playError?.message || '';
          if (!errorMessage.includes('interrupted') && !errorMessage.includes('removed from the document')) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:playError',message:'Audio play() error',data:{error:errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            setIsPlaying(false);
            setIsPaused(false);
            setIsLoading(false);
            URL.revokeObjectURL(audioUrl);
            const error = new Error(`Audio playback error: ${errorMessage}`);
            setError(error);
            options.onError?.(error);
          }
        }
      } else {
        throw new Error('Backend returned unexpected content type: ' + response.contentType);
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTextToSpeech.ts:270',message:'speakWithBackend catch block',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const error = err instanceof Error ? err : new Error('Backend TTS failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setError(error);
      setIsLoading(false);
      options.onError?.(error);
    }
  }, [options]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      if (startTimeRef.current && durationRef.current > 0) {
        progressIntervalRef.current = window.setInterval(() => {
          if (startTimeRef.current) {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min(100, (elapsed / durationRef.current) * 100);
            setProgress(newProgress);
          }
        }, 100);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    startTimeRef.current = null;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const repeat = useCallback((text: string, requestOptions?: Partial<TTSRequest>) => {
    stop();
    setTimeout(() => {
      speak(text, requestOptions);
    }, 100);
  }, [speak, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  return {
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
        };
      };


