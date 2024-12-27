import axios, { AxiosResponse } from 'axios';

const API_KEY: string | undefined = import.meta.env.VITE_APP_GEMINI_API_KEY;

const GEMINI_API_ENDPOINT: string =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
}


export const generateContent = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error('API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
    }

    const requestData: GeminiApiRequest = {
        contents: [{
            parts: [{ text: prompt }],
        }]
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