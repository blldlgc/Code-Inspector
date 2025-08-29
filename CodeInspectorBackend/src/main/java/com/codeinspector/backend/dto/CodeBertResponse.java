package com.codeinspector.backend.dto;

public record CodeBertResponse(
    double cosine    // CodeBERT'in hesapladığı cosine benzerlik skoru
) {}
