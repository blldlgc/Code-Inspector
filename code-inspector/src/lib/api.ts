import axios, { AxiosResponse } from 'axios';

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

export const projectsApi = {
  list: async () => {
    const res = await axios.get(`${BACKEND_BASE_URL}/api/projects`);
    return res.data as { id: number; name: string; slug: string; description?: string; vcsUrl?: string }[];
  },
  create: async (payload: { name: string; slug: string; description?: string; vcsUrl?: string; }) => {
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
  importGit: async (slug: string, repoUrl: string) => {
    await axios.post(`${BACKEND_BASE_URL}/api/projects/${slug}/import-git`, { repoUrl });
  },
  delete: async (slug: string) => {
    await axios.delete(`${BACKEND_BASE_URL}/api/projects/${slug}`);
  },
  update: async (slug: string, payload: { name?: string; description?: string; vcsUrl?: string; visibility?: 'private'|'team'|'public' }) => {
    const res = await axios.put(`${BACKEND_BASE_URL}/api/projects/${slug}`, payload);
    return res.data;
  },
  createWithZip: async (payload: { name: string; slug: string; description?: string; vcsUrl?: string; }, zip?: File) => {
    const proj = await projectsApi.create(payload);
    if (zip) {
      await projectsApi.uploadZip(payload.slug, zip);
    }
    if (payload.vcsUrl) {
      await projectsApi.importGit(payload.slug, payload.vcsUrl);
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