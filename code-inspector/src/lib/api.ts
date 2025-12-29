import axios, { AxiosResponse, AxiosInstance } from 'axios';

const BACKEND_BASE_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

const API_KEY: string | undefined = import.meta.env.VITE_APP_GEMINI_API_KEY;

// Gemini API endpoint - güncel format (2024/2025)
// Güncel dokümantasyon: https://ai.google.dev/api/rest
// Model adını environment variable'dan al, yoksa default kullan
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
// Güncel modeller: 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'
// API versiyonu: v1 kullanılıyor (v1beta eski)
const GEMINI_API_VERSION = import.meta.env.VITE_GEMINI_API_VERSION || 'v1';
const GEMINI_API_ENDPOINT: string =
    `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent`;

// Gemini API için ayrı axios instance (interceptor'lardan muaf)
const geminiAxios: AxiosInstance = axios.create();

interface GeminiApiResponse {
    candidates?: {
        content: {
            parts: {
                text: string;
            }[];
        };
        finishReason?: string; // 'STOP', 'MAX_TOKENS', 'SAFETY', etc.
    }[];
    promptFeedback?: {
        blockReason?: string;
    };
}

interface GeminiApiRequest {
    contents: {
        parts: {
            text: string;
        }[];
    }[];
    generationConfig?: {
        temperature: number;
        maxOutputTokens: number;
    };
}


export const generateContent = async (prompt: string, temperature: number = 0.5, maxOutputTokens: number = 32768): Promise<string> => {
    if (!API_KEY) {
        const errorMsg = 'API anahtarı tanımlanmamış. .env dosyasını kontrol edin.';
        console.error(errorMsg);
        // Log'u localStorage'a kaydet
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            logs.push({ timestamp: new Date().toISOString(), level: 'error', message: errorMsg, source: 'generateContent' });
            localStorage.setItem('app_logs', JSON.stringify(logs.slice(-100))); // Son 100 log
        } catch (e) {}
        throw new Error(errorMsg);
    }

    const requestData: GeminiApiRequest = {
        contents: [{
            parts: [{ text: prompt }],
        }],
        generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxOutputTokens,
        },
    };

    try {
        // Gemini API için ayrı axios instance kullan (interceptor'lardan muaf)
        console.log('Gemini API çağrısı:', { 
            endpoint: GEMINI_API_ENDPOINT, 
            model: GEMINI_MODEL,
            version: GEMINI_API_VERSION,
            hasApiKey: !!API_KEY
        });
        
        // Gemini API REST endpoint formatı
        // Dokümantasyon: https://ai.google.dev/api/rest
        const response: AxiosResponse<GeminiApiResponse> = await geminiAxios.post(
            GEMINI_API_ENDPOINT,
            requestData,
            {
                params: {
                    key: API_KEY,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
                // Timeout ayarla
                timeout: 60000, // 60 saniye
            }
        );

        if (
            response.data &&
            response.data.candidates &&
            response.data.candidates.length > 0
        ) {
            const candidate = response.data.candidates[0];
            const text = candidate.content.parts[0].text;
            const finishReason = candidate.finishReason;
            
            // Eğer yanıt token limiti nedeniyle kesilmişse uyarı ver
            if (finishReason === 'MAX_TOKENS') {
                console.warn('⚠️ Gemini API yanıtı token limiti nedeniyle kesilmiş olabilir. maxOutputTokens değerini artırmayı düşünün.');
                // Log'u localStorage'a kaydet
                try {
                    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
                    logs.push({ 
                        timestamp: new Date().toISOString(), 
                        level: 'warn', 
                        message: 'Gemini API yanıtı MAX_TOKENS nedeniyle kesilmiş olabilir', 
                        source: 'generateContent',
                        finishReason,
                        textLength: text.length
                    });
                    localStorage.setItem('app_logs', JSON.stringify(logs.slice(-100)));
                } catch (e) {}
            }
            
            // Eğer güvenlik nedeniyle bloklanmışsa
            if (finishReason === 'SAFETY') {
                throw new Error('Gemini API yanıtı güvenlik nedeniyle bloklandı. Prompt\'u gözden geçirin.');
            }
            
            // Prompt feedback kontrolü
            if (response.data.promptFeedback?.blockReason) {
                throw new Error(`Gemini API prompt'u blokladı: ${response.data.promptFeedback.blockReason}`);
            }
            
            return text;
        } else {
            throw new Error('Gemini API yanıtında içerik bulunamadı.');
        }
    } catch (error: any) {
        // Detaylı hata bilgisi
        const errorDetails = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            endpoint: GEMINI_API_ENDPOINT,
        };
        
        const errorMsg = `Gemini API isteği hatası: ${error.response?.status || 'N/A'} - ${error.message || 'Bilinmeyen hata'}`;
        console.error(errorMsg, errorDetails);
        
        // Log'u localStorage'a kaydet
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            logs.push({ 
                timestamp: new Date().toISOString(), 
                level: 'error', 
                message: errorMsg, 
                source: 'generateContent',
                error: errorDetails
            });
            localStorage.setItem('app_logs', JSON.stringify(logs.slice(-100))); // Son 100 log
        } catch (e) {
            console.error('Log kaydetme hatası:', e);
        }
        
        // Daha açıklayıcı hata mesajı ve çözüm önerileri
        if (error.response?.status === 404) {
            const suggestions = [
                `Model adını kontrol edin. Şu an kullanılan: ${GEMINI_MODEL}`,
                'Deneyebileceğiniz modeller:',
                '  - gemini-1.5-flash (önerilen)',
                '  - gemini-1.5-pro',
                '  - gemini-pro',
                '  - gemini-2.5-flash',
                '  - gemini-2.5-pro',
                `API versiyonunu kontrol edin. Şu an kullanılan: ${GEMINI_API_VERSION}`,
                '  - v1 (önerilen)',
                '  - v1beta (eski)',
                'Güncel dokümantasyon: https://ai.google.dev/api/rest',
                `Endpoint: ${GEMINI_API_ENDPOINT}`,
                '',
                'Çözüm: .env dosyasına şunu ekleyin:',
                `  VITE_GEMINI_MODEL=gemini-1.5-flash`,
                `  VITE_GEMINI_API_VERSION=v1`
            ];
            throw new Error(
                `Gemini API endpoint bulunamadı (404).\n` +
                `Endpoint: ${GEMINI_API_ENDPOINT}\n` +
                `\nÖneriler:\n${suggestions.join('\n')}`
            );
        } else if (error.response?.status === 403) {
            throw new Error(
                'Gemini API erişim hatası (403).\n' +
                'Olası nedenler:\n' +
                '- API anahtarı geçersiz veya süresi dolmuş\n' +
                '- API anahtarı kısıtlamaları (IP, referer vb.)\n' +
                '- Faturalandırma etkin değil\n' +
                'Çözüm: Google AI Studio\'dan yeni bir API anahtarı oluşturun: https://aistudio.google.com/app/apikey'
            );
        } else if (error.response?.status === 400) {
            const errorData = error.response?.data || {};
            throw new Error(
                `Gemini API istek hatası (400).\n` +
                `Hata detayı: ${JSON.stringify(errorData, null, 2)}`
            );
        } else {
            throw new Error(
                `Gemini API isteği sırasında bir hata oluştu.\n` +
                `Durum: ${error.response?.status || 'N/A'}\n` +
                `Mesaj: ${error.message || 'Bilinmeyen hata'}\n` +
                `Daha fazla bilgi için: https://ai.google.dev/api/rest`
            );
        }
    }
};

// Proje versiyonları için tipler
export interface ProjectVersion {
  id: number;
  versionName: string;
  commitHash: string;
  commitMessage: string;
  githubUrl?: string;
  branchName?: string;
  createdAt: string;
}

export interface AnalysisResult {
  id: number;
  analysisType: string;
  resultData: string;
  createdAt: string;
}

export interface FileDiff {
  path: string;
  changeType: string;
  diff: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface CodeGraphVertex {
  id: string;
  label: string;
  type: 'class' | 'method';
  metrics?: Record<string, any>;
}

export interface CodeGraphEdge {
  source: string;
  target: string;
  // type: 'depends' | 'has' | 'calls'
  // - depends: Sınıf-sınıf bağımlılığı
  // - has: Sınıf-metot ilişkisi
  // - calls: Metot-metot çağrısı (YENİ)
  type: 'depends' | 'has' | 'calls';
}

export interface CodeGraphMetrics {
  totalNodes: number;
  totalEdges: number;
  avgDegree: number;
  maxDegree: number;
  connectivityNumber?: number; // κ(G) - Graph connectivity number
  scatteringNumber?: number; // s(G) - Graph scattering number
  ruptureNumber?: number; // r(G) - Graph rupture number
  integrityNumber?: number; // I(G) - Graph integrity number
  toughnessNumber?: number; // τ(G) - Graph toughness number
  dominationNumber?: number; // γ(G) - Graph domination number
  twoVertexCoverNumber?: number; // β₂(G) - Graph 2-vertex cover number
  twoVertexCoverNodes?: string[]; // Seçilen node'lar (2-vertex cover)
  degreeDistribution?: { [key: number]: number }; // degree -> node count
}

export interface CodeGraphResponse {
  vertices: CodeGraphVertex[];
  edges: CodeGraphEdge[];
  metrics: CodeGraphMetrics;
}

export const projectsApi = {
  list: async () => {
    // Token kontrolü interceptor'lar tarafından yapılıyor, burada gerek yok
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects`);
    return res.data as { id: number; name: string; slug: string; description?: string; vcsUrl?: string }[];
  },
  get: async (slug: string) => {
    // Token kontrolü interceptor'lar tarafından yapılıyor, burada gerek yok
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}`);
    return res.data;
  },
  create: async (payload: { name: string; slug: string; description?: string; vcsUrl?: string; branchName?: string; }) => {
    // Token kontrolü interceptor'lar tarafından yapılıyor, burada gerek yok
    const res = await axios.post(`${BACKEND_BASE_URL}/api/projects`, payload);
    return res.data;
  },
  uploadZip: async (slug: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importGit: async (slug: string, repoUrl: string, branchName?: string, githubUsername?: string, githubToken?: string) => {
    await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/import-git`, { repoUrl, branchName, githubUsername, githubToken });
  },
  delete: async (slug: string) => {
    await axios.delete(`${BACKEND_BASE_URL}/api/projects/${slug}`);
  },
  update: async (slug: string, payload: { name?: string; description?: string; vcsUrl?: string; visibility?: 'private'|'team'|'public' }) => {
    const res = await axios.put(`${BACKEND_BASE_URL}/api/projects/${slug}`, payload);
    return res.data;
  },
  createWithZip: async (payload: { name: string; slug: string; description?: string; vcsUrl?: string; branchName?: string; githubUsername?: string; githubToken?: string; }, zip?: File) => {
    const proj = await projectsApi.create(payload);
    if (zip) {
      await projectsApi.uploadZip(payload.slug, zip);
      // ZIP yüklendikten sonra versiyon oluştur
      await projectsApi.createVersionFromZip(payload.slug, zip, "Initial version from ZIP");
    }
    if (payload.vcsUrl) {
      await projectsApi.importGit(payload.slug, payload.vcsUrl, payload.branchName, payload.githubUsername, payload.githubToken);
    }
    return proj;
  },
  shareWithUser: async (slug: string, username: string) => {
    const res = await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/share/user`, { username });
    return res.data;
  },
  unshareWithUser: async (slug: string, username: string) => {
    const res = await axios.delete(`${BACKEND_BASE_URL}/api/projects/${slug}/share/user`, { 
      data: { username } 
    });
    return res.data;
  },
  shareWithTeam: async (slug: string, teamId: number) => {
    const res = await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/share/team`, { teamId });
    return res.data;
  },
  unshareWithTeam: async (slug: string, teamId: number) => {
    const res = await axios.delete(`${BACKEND_BASE_URL}/api/projects/${slug}/share/team`, { 
      data: { teamId } 
    });
    return res.data;
  },
  
  // Versiyon metotları
  listVersions: async (slug: string): Promise<ProjectVersion[]> => {
    const response = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/versions`);
    return response.data;
  },
  
  getVersion: async (slug: string, versionId: number): Promise<ProjectVersion> => {
    const response = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/versions/${versionId}`);
    return response.data;
  },
  
  createVersionFromZip: async (slug: string, file: File, message?: string): Promise<ProjectVersion> => {
    const formData = new FormData();
    formData.append('file', file);
    if (message) formData.append('message', message);
    
    const response = await axios.post(
      `${BACKEND_BASE_URL}/api/projects/${slug}/versions/zip`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },
  
  createVersionFromGitHub: async (slug: string, repoUrl: string, message?: string, branchName?: string, githubUsername?: string, githubToken?: string): Promise<ProjectVersion> => {
    const response = await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/versions/github`, {
      repoUrl,
      message,
      branchName,
      githubUsername,
      githubToken
    });
    return response.data;
  },
  
  checkoutVersion: async (slug: string, versionId: number): Promise<void> => {
    await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/versions/${versionId}/checkout`);
  },
  
  getDiff: async (slug: string, oldVersionId: number, newVersionId: number): Promise<FileDiff[]> => {
    const response = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/versions/diff`, {
      params: { oldVersionId, newVersionId }
    });
    return response.data;
  },
  
  getCommitHistory: async (slug: string): Promise<CommitInfo[]> => {
    const response = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/versions/history`);
    return response.data;
  },
  
  // Tek proje kod grafı
  getCodeGraph: async (slug: string): Promise<CodeGraphResponse> => {
    const response = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/graph`);
    return response.data;
  },
  
  // Analiz metotları
  getAnalysisResults: async (slug: string, versionId: number): Promise<AnalysisResult[]> => {
    const response = await axios.get(
      `${BACKEND_BASE_URL}/api/projects/${slug}/versions/${versionId}/analysis`
    );
    return response.data;
  },
  
  analyzeVersion: async (slug: string, versionId: number, analysisType: string): Promise<AnalysisResult> => {
    const response = await axios.post(
      `${BACKEND_BASE_URL}/api/projects/${slug}/versions/${versionId}/analysis`,
      null,
      { params: { analysisType } }
    );
    return response.data;
  },
  
  getAnalysisResult: async (slug: string, versionId: number, analysisType: string): Promise<AnalysisResult> => {
    const response = await axios.get(
      `${BACKEND_BASE_URL}/api/projects/${slug}/versions/${versionId}/analysis/${analysisType}`
    );
    return response.data;
  },

  // Tüm analizleri tek seferde çalıştıran endpoint
  runAllAnalyses: async (slug: string, versionId: number): Promise<Record<string, AnalysisResult>> => {
    const response = await axios.post(
      `${BACKEND_BASE_URL}/api/projects/${slug}/versions/${versionId}/analysis/run-all`
    );
    return response.data;
  }
};

export const projectFilesApi = {
  list: async (slug: string, path?: string) => {
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/files`, { params: { path } });
    return res.data as { name: string; path: string; directory: boolean; size: number }[];
  },
  read: async (slug: string, path: string) => {
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}/file`, { params: { path } });
    return res.data as string;
  }
};