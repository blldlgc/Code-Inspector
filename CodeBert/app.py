from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

MODEL_NAME = "microsoft/codebert-base"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(title="CodeBERT Similarity API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

# --- Model init (tek sefer) ---
tok = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME).to(DEVICE).eval()

def _sanitize(code: str) -> str:
    s = code.replace("\t", "    ").replace("\r\n", "\n").replace("\r", "\n")
    return s[:8000]  # uzun textleri kıs: 512 token zaten kesilecek

@torch.inference_mode()
def embed_once(text: str) -> np.ndarray:
    text = _sanitize(text)
    inputs = tok(text, truncation=True, max_length=512, return_tensors="pt")
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
    # last_hidden_state: [B, T, H]; attention mask ile mean-pool
    out = model(**inputs).last_hidden_state
    mask = inputs["attention_mask"].unsqueeze(-1)                  # [B, T, 1]
    summed = (out * mask).sum(1)                                   # [B, H]
    counts = mask.sum(1).clamp(min=1)                              # [B, 1]
    mean = summed / counts
    # L2 normalize
    v = torch.nn.functional.normalize(mean, p=2, dim=-1)[0]
    return v.detach().cpu().numpy()                                # (H,)

# --- DTO'lar ---
class EmbeddingRequest(BaseModel):
    code: str

class EmbeddingResponse(BaseModel):
    dim: int
    vector: List[float]

class SimilarityRequest(BaseModel):
    a: str
    b: str

class SimilarityResponse(BaseModel):
    cosine: float

class BatchSimilarityRequest(BaseModel):
    snippets: List[str]

class BatchSimilarityResponse(BaseModel):
    matrix: List[List[float]]

@app.get("/healthz")
def healthz():
    return {"ok": True, "model": MODEL_NAME, "device": str(DEVICE)}

@app.post("/embed", response_model=EmbeddingResponse)
def api_embed(req: EmbeddingRequest):
    v = embed_once(req.code)
    return EmbeddingResponse(dim=v.shape[0], vector=v.astype(float).tolist())

@app.post("/similarity", response_model=SimilarityResponse)
def api_similarity(req: SimilarityRequest):
    va = embed_once(req.a)
    vb = embed_once(req.b)
    # vektörler L2-normalize => dot = cosine
    cos = float((va * vb).sum())
    return SimilarityResponse(cosine=cos)

@app.post("/batch-similarity", response_model=BatchSimilarityResponse)
def api_batch(req: BatchSimilarityRequest):
    vecs = [embed_once(x) for x in req.snippets]
    n = len(vecs)
    M = np.eye(n, dtype=float)
    for i in range(n):
        for j in range(i + 1, n):
            c = float((vecs[i] * vecs[j]).sum())
            M[i, j] = M[j, i] = c
    return BatchSimilarityResponse(matrix=M.tolist())

# Opsiyonel: lokal çalıştırma
# uvicorn app:app --host 0.0.0.0 --port 8000
