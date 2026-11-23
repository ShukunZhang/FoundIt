interface SpeechAlternative {
  transcript: string;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechAlternative> & { isFinal: boolean }>;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechCtor = new () => BrowserSpeechRecognition;

function speechCtor(): SpeechCtor | null {
  const host = window as Window & {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function speechInputSupported(): boolean {
  return speechCtor() !== null;
}

/**
 * Starts one dictation session. Interim text is reported while the person is
 * still talking. The promise resolves with the final transcript.
 */
export function dictate(onInterim: (transcript: string) => void): { stop: () => void; done: Promise<string> } {
  const Ctor = speechCtor();
  if (!Ctor) {
    return { stop: () => undefined, done: Promise.reject(new Error('This browser has no voice input.')) };
  }
  const recognition = new Ctor();
  recognition.lang = 'en-CA';
  recognition.interimResults = true;
  recognition.continuous = false;
  let settled = false;
  const done = new Promise<string>((resolve, reject) => {
    let latest = '';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? '';
      }
      latest = transcript.replace(/\s+/g, ' ').trim();
      onInterim(latest);
    };
    recognition.onerror = (event) => {
      if (settled) return;
      settled = true;
      if (event.error === 'aborted' || event.error === 'no-speech') {
        resolve(latest);
        return;
      }
      if (event.error === 'not-allowed') {
        reject(new Error('Allow the microphone to describe the item by voice.'));
        return;
      }
      reject(new Error('Voice input stopped before a description was captured.'));
    };
    recognition.onend = () => {
      if (settled) return;
      settled = true;
      resolve(latest);
    };
  });
  recognition.start();
  return {
    stop: () => recognition.stop(),
    done,
  };
}
