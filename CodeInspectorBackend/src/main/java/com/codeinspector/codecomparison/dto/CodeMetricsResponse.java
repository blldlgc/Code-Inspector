package com.codeinspector.codecomparison.dto;

import java.util.Map;

public record CodeMetricsResponse(Map<String, String> metrics) {}