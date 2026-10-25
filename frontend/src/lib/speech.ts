/**
 * Marcuscabin - Web Speech API Service (TTS & STT).
 * Provides zero-latency client-side speech synthesis with boundary callbacks for lip-sync,
 * and speech-to-text recognition for conversational hands-free input.
 */

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number, name: string) => void;
  onError?: (error: any) => void;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isListeningActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(text: string, callbacks: SpeechCallbacks = {}): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this environment.');
      callbacks.onStart?.();
      // Simulate duration based on word count
      const words = text.split(' ').length;
      const durationMs = Math.max(1500, (words / 2.5) * 1000);
      setTimeout(() => callbacks.onEnd?.(), durationMs);
      return;
    }

    // Cancel ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Select natural, professional medical voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Jenny') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('English')) &&
        v.lang.startsWith('en')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    utterance.onstart = () => {
      callbacks.onStart?.();
    };

    utterance.onend = () => {
      callbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      callbacks.onError?.(e);
      callbacks.onEnd?.();
    };

    utterance.onboundary = (event) => {
      callbacks.onBoundary?.(event.charIndex, event.name);
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public startSpeechRecognition(
    onResult: (transcript: string) => void,
    onStatusChange?: (isListening: boolean) => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser.');
      return false;
    }

    try {
      if (this.recognition && this.isListeningActive) {
        this.recognition.stop();
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.isListeningActive = true;
        onStatusChange?.(true);
      };

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          onResult(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListeningActive = false;
        onStatusChange?.(false);
      };

      rec.onend = () => {
        this.isListeningActive = false;
        onStatusChange?.(false);
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      this.isListeningActive = false;
      onStatusChange?.(false);
      return false;
    }
  }

  public stopSpeechRecognition(): void {
    if (this.recognition && this.isListeningActive) {
      this.recognition.stop();
      this.isListeningActive = false;
    }
  }
}

export const speechService = new SpeechService();
