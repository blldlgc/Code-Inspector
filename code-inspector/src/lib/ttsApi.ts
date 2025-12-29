import axios from 'axios';
import { authService } from './auth';

const BACKEND_BASE_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

export interface TTSRequest {
  text: string;
  language?: string; // "en-US" for English
  speed?: number; // 0.5 to 2.0
}

export interface TTSResponse {
  audioBase64: string;
  contentType: string;
  duration: number;
}

export const ttsApi = {
  speak: async (request: TTSRequest): Promise<TTSResponse> => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ttsApi.ts:19',message:'ttsApi.speak called',data:{textLength:request.text.length,language:request.language,speed:request.speed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      // Token kontrolü interceptor'lar tarafından yapılıyor, burada gerek yok
      const requestBody = {
        text: request.text,
        language: request.language || 'en-US',
        speed: request.speed || 1.0,
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ttsApi.ts:28',message:'Sending request to backend',data:{url:`${BACKEND_BASE_URL}/api/tts/speak`,requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const response = await axios.post(
        `${BACKEND_BASE_URL}/api/tts/speak`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
          },
        }
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ttsApi.ts:40',message:'Backend response received',data:{status:response.status,contentType:response.data?.contentType,hasAudioBase64:!!response.data?.audioBase64},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return response.data;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bc7ab8a0-d63f-4d50-839b-5c6b20d92200',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ttsApi.ts:44',message:'ttsApi.speak error',data:{error:error?.message,status:error?.response?.status,responseData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  },
};


