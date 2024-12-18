package com.codeinspector.codecomparison.controller;

import com.codeinspector.codecomparison.dto.CoverageRequest;
import com.codeinspector.codecomparison.dto.CoverageResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.io.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

@RestController
@RequestMapping("/api")
public class CoverageController {

    @PostMapping("/coverage")
    public ResponseEntity<CoverageResponse> calculateCoverage(@RequestBody CoverageRequest request) {
        try {
            // Save application and test code to temporary files
            String basePath = System.getProperty("java.io.tmpdir") + File.separator + "codecoverage";
            File baseDir = new File(basePath);
            if (!baseDir.exists()) {
                baseDir.mkdirs();
            }

            saveToFile(basePath + File.separator + "HesapMakinesi.java", request.getAppCode());
            saveToFile(basePath + File.separator + "HesapMakinesiTest.java", request.getTestCode());

            // Run Maven to generate JaCoCo report
            ProcessBuilder builder = new ProcessBuilder(
                    "cmd.exe", "/c", "mvnw.cmd", "clean", "test", "jacoco:report"
            );
            builder.directory(baseDir); // Maven projesinin çalışacağı dizin

            Process process = builder.start();

            // Maven çıktısını oku ve konsola yazdır
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));

            String line;
            System.out.println("Standard Output:");
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }

            System.out.println("Error Output:");
            while ((line = errorReader.readLine()) != null) {
                System.err.println(line);
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Maven command failed with exit code " + exitCode);
            }

            // Parse JaCoCo report
            String reportPath = basePath + File.separator + "target" + File.separator + "site" + File.separator + "jacoco" + File.separator + "jacoco.xml";
            double coverage = parseCoverageReport(reportPath);

            // Return response
            CoverageResponse response = new CoverageResponse(coverage, "Coverage calculated successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new CoverageResponse(0.0, "Error calculating coverage: " + e.getMessage()));
        }
    }

    private void saveToFile(String filePath, String content) throws IOException {
        File file = new File(filePath);
        if (!file.getParentFile().exists()) {
            file.getParentFile().mkdirs();
        }
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(content);
        }
    }

    private double parseCoverageReport(String reportPath) {
        try {
            File xmlFile = new File(reportPath);
            if (!xmlFile.exists()) {
                throw new RuntimeException("JaCoCo report not found at " + xmlFile.getAbsolutePath());
            }

            // XML Parse işlemi devam eder
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(xmlFile);
            document.getDocumentElement().normalize();

            NodeList counters = document.getElementsByTagName("counter");
            int missed = 0, covered = 0;

            for (int i = 0; i < counters.getLength(); i++) {
                Element counter = (Element) counters.item(i);
                if ("INSTRUCTION".equals(counter.getAttribute("type"))) {
                    missed = Integer.parseInt(counter.getAttribute("missed"));
                    covered = Integer.parseInt(counter.getAttribute("covered"));
                    break;
                }
            }

            return ((double) covered / (missed + covered)) * 100.0;

        } catch (Exception e) {
            throw new RuntimeException("Error parsing JaCoCo report: " + e.getMessage());
        }
    }

}
