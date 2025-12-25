import axios, { AxiosResponse } from 'axios';
import { authService } from './auth';

const BACKEND_BASE_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

const API_KEY: string | undefined = import.meta.env.VITE_APP_GEMINI_API_KEY;

const GEMINI_API_ENDPOINT: string =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiApiResponse {
    candidates?: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
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


export const generateContent = async (prompt: string, temperature: number = 0.5, maxOutputTokens: number = 8192): Promise<string> => {
    if (!API_KEY) {
        throw new Error('API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
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
        const response: AxiosResponse<GeminiApiResponse> = await axios.post(
            GEMINI_API_ENDPOINT,
            requestData,
            {
                params: {
                    key: API_KEY,
                },
            }
        );

        if (
            response.data &&
            response.data.candidates &&
            response.data.candidates.length > 0
        ) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Gemini API yanıtında içerik bulunamadı.');
        }
    } catch (error: any) {
        console.error('Gemini API isteği hatası:', error);
        throw new Error('Gemini API isteği sırasında bir hata oluştu.');
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
}

export interface CodeGraphResponse {
  vertices: CodeGraphVertex[];
  edges: CodeGraphEdge[];
  metrics: CodeGraphMetrics;
}

export const projectsApi = {
  list: async () => {
    // Token kontrolü yap
    authService.checkTokenAndLogout();
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects`);
    return res.data as { id: number; name: string; slug: string; description?: string; vcsUrl?: string }[];
  },
  get: async (slug: string) => {
    authService.checkTokenAndLogout();
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects/${slug}`);
    return res.data;
  },
  create: async (payload: { name: string; slug: string; description?: string; vcsUrl?: string; branchName?: string; }) => {
    authService.checkTokenAndLogout();
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