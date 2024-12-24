package com.codeinspector.backend.dto;

import java.util.Map;

public record CodeMetricsResponse(Map<String, String> metrics) {}