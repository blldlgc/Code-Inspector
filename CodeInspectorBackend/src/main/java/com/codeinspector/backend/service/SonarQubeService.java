package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.SonarAnalysisResult;
import com.codeinspector.backend.utils.SonarQubeHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

@Service
public class SonarQubeService {

    @Value("${sonar.token}")
    private String projectToken;

    @Value("${sonar.host.url}")
    private String sonarUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Manuel olarak oluşturulan helper
    private final SonarQubeHelper sonarQubeHelper = new SonarQubeHelper();

    public SonarAnalysisResult analyzeProject(String sourceCode, String projectKey) {
        try {
            File projectFile = sonarQubeHelper.createProjectFile(sourceCode, projectKey);
            startAnalysis(projectFile, projectKey);
            return getResults(projectKey);
        } catch (Exception e) {
            e.printStackTrace(); // Hata loglama
            return new SonarAnalysisResult(0, 0, 0, 0.0, 0.0);
        }
    }

    private void startAnalysis(File projectFile, String projectKey) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "docker-compose",
                "run",
                "--rm",
                "sonar-scanner",
                "-X",  // Add the -X flag for debug output
                "-Dsonar.projectKey=" + projectKey,
                "-Dsonar.sources=" + projectFile.getAbsolutePath(),
                "-Dsonar.host.url=http://sonarqube:9000",
                "-Dsonar.login=" + projectToken
        );

        processBuilder.directory(new File(System.getProperty("user.dir")));
        Process process = processBuilder.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));

        String line;
        System.out.println("std out: ");
        while ((line = reader.readLine()) != null) {
            System.out.println(line);
        }
        System.out.println("error out");
        while ((line = errorReader.readLine()) != null) {
            System.out.println(line);
        }

        boolean completed = process.waitFor(5, TimeUnit.MINUTES);

        if (!completed) {
            throw new RuntimeException("SonarQube analysis timed out");
        }
    }

    private SonarAnalysisResult getResults(String projectKey) {
        String url = sonarUrl + "/api/measures/component?componentKey=" + projectKey + "&metricKeys=bugs,vulnerabilities,code_smells,duplicated_lines_density,coverage";

        try {
            String response = restTemplate.getForObject(url, String.class);
            System.out.println("Response: " + response);
            return parseSonarAnalysisResult(response);
        } catch (HttpClientErrorException e) {
            System.err.println("Error fetching results: " + e.getMessage());
            return new SonarAnalysisResult(0, 0, 0, 0.0, 0.0);
        }
    }

    private SonarAnalysisResult parseSonarAnalysisResult(String jsonResponse) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            JsonNode measures = rootNode.path("component").path("measures");

            int bugs = 0;
            int vulnerabilities = 0;
            int codeSmells = 0;
            double duplicatedLinesDensity = 0.0;
            double coverage = 0.0;

            for (JsonNode measure : measures) {
                String metric = measure.path("metric").asText();
                String value = measure.path("value").asText();

                switch (metric) {
                    case "bugs":
                        bugs = Integer.parseInt(value);
                        break;
                    case "vulnerabilities":
                        vulnerabilities = Integer.parseInt(value);
                        break;
                    case "code_smells":
                        codeSmells = Integer.parseInt(value);
                        break;
                    case "duplicated_lines_density":
                        duplicatedLinesDensity = Double.parseDouble(value);
                        break;
                    case "coverage":
                        coverage = Double.parseDouble(value);
                        break;
                }
            }

            return new SonarAnalysisResult(bugs, vulnerabilities, codeSmells, duplicatedLinesDensity, coverage);
        } catch (Exception e) {
            e.printStackTrace();
            return new SonarAnalysisResult(0, 0, 0, 0.0, 0.0);
        }
    }
}
