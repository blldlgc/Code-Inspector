package com.codeinspector.backend.utils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.codeinspector.backend.dto.SecurityAnalysisResult;
import com.codeinspector.backend.model.security.RiskLevel;
import com.codeinspector.backend.model.security.RiskMetrics;
import com.codeinspector.backend.model.security.SecurityIssue;
import com.codeinspector.backend.model.security.SecurityRecommendation;
import com.codeinspector.backend.model.security.SecurityRule;
import com.codeinspector.backend.model.security.VulnerabilityPattern;



@Component
public class AdvancedSecurityAnalyzer {
    private final Map<String, VulnerabilityPattern> securityPatterns = new HashMap<>();
    private final List<SecurityRule> securityRules = new ArrayList<>();

    public AdvancedSecurityAnalyzer() {
        initializePatterns();
        initializeRules();
    }

    private void initializePatterns() {
        // OWASP Top 10 güvenlik açıkları
        securityPatterns.put("INJECTION", new VulnerabilityPattern(
            Pattern.compile("(executeQuery|executeUpdate)\\s*\\([^?]*\\+|jdbc:.*[^?]\\+"),
            RiskLevel.CRITICAL,
            "SQL/NoSQL Injection vulnerability",
            "Use parameterized queries or ORM frameworks"
        ));

        securityPatterns.put("BROKEN_AUTH", new VulnerabilityPattern(
            Pattern.compile("(MD5|SHA1)\\.(digest|hash)|password\\s*=\\s*\"[^\"]*\"|crypto\\.createHash\\s*\\(\\s*['\"]md5['\"]\\)"),
            RiskLevel.HIGH,
            "Weak authentication mechanism",
            "Use strong hashing algorithms (bcrypt, PBKDF2) and secure session management"
        ));

        securityPatterns.put("SENSITIVE_DATA", new VulnerabilityPattern(
            Pattern.compile("(password|secret|key|token|credential)\\s*=\\s*\"[^\"]*\"|getenv\\(['\"](?:API_KEY|SECRET)['\"]\\)"),
            RiskLevel.HIGH,
            "Sensitive data exposure",
            "Use encryption for sensitive data and secure key management"
        ));

        securityPatterns.put("XXE", new VulnerabilityPattern(
            Pattern.compile("DocumentBuilder|SAXParser|XMLReader"),
            RiskLevel.HIGH,
            "XML External Entity (XXE) vulnerability",
            "Disable external entity processing in XML parsers"
        ));

        securityPatterns.put("BROKEN_ACCESS", new VulnerabilityPattern(
            Pattern.compile("@PermitAll|role\\s*=\\s*\"ROLE_ADMIN\"|hasRole\\(.*\\)"),
            RiskLevel.HIGH,
            "Broken access control",
            "Implement proper authorization checks and role-based access control"
        ));

        // Ek güvenlik kontrolleri
        addSecurityPatterns();

        // SQL Injection pattern'i ekliyoruz
        securityPatterns.put("SQL_INJECTION", new VulnerabilityPattern(
            Pattern.compile("(executeQuery|executeUpdate)\\s*\\([^?]*\\+|\"SELECT.*WHERE.*\\+.*\\\""),
            RiskLevel.CRITICAL,
            "SQL Injection vulnerability detected",
            "Use PreparedStatement with parameterized queries instead of string concatenation"
        ));

        // Unsafe Logging pattern'i
        securityPatterns.put("UNSAFE_LOGGING", new VulnerabilityPattern(
            Pattern.compile("System\\.out\\.println\\(.*\\)|System\\.err\\.println\\(.*\\)"),
            RiskLevel.MEDIUM,
            "Unsafe logging practice",
            "Use a proper logging framework (e.g., SLF4J, Log4j) with appropriate log levels"
        ));

        // Null Check pattern'i
        securityPatterns.put("NULL_CHECK", new VulnerabilityPattern(
            Pattern.compile("if\\s*\\([^=]*==\\s*null\\)|if\\s*\\([^=]*!=\\s*null\\)"),
            RiskLevel.LOW,
            "Basic null check found",
            "Consider using Optional<T> or Objects.requireNonNull() for better null handling"
        ));
    }

    private void addSecurityPatterns() {
        // Güvensiz Kriptografi
        securityPatterns.put("WEAK_CRYPTO", new VulnerabilityPattern(
            Pattern.compile("DES|RC2|RC4|Blowfish|ECB|([^S]|^)DES"),
            RiskLevel.HIGH,
            "Weak cryptographic algorithm",
            "Use strong algorithms like AES-256-GCM"
        ));

        // Güvensiz Rastgele Sayı Üretimi
        securityPatterns.put("INSECURE_RANDOM", new VulnerabilityPattern(
            Pattern.compile("Math\\.random|Random\\(\\)|java\\.util\\.Random"),
            RiskLevel.MEDIUM,
            "Insecure random number generation",
            "Use SecureRandom for cryptographic operations"
        ));

        // Log Injection
        securityPatterns.put("LOG_INJECTION", new VulnerabilityPattern(
            Pattern.compile("logger\\.(info|error|debug)\\(.*\\+.*\\)"),
            RiskLevel.MEDIUM,
            "Potential log injection",
            "Sanitize log inputs and use proper logging frameworks"
        ));
    }

    private void initializeRules() {
        // Kod Kalitesi Kuralları
        securityRules.add(new SecurityRule(
            "NULL_CHECK",
            code -> code.contains("null") && !code.contains("!= null") && !code.contains("== null"),
            RiskLevel.MEDIUM,
            "Missing null checks",
            "Add proper null checks to prevent NullPointerException"
        ));

        securityRules.add(new SecurityRule(
            "EXCEPTION_HANDLING",
            code -> code.contains("catch") && code.contains("Exception") && !code.contains("specific"),
            RiskLevel.MEDIUM,
            "Generic exception handling",
            "Use specific exception types and proper error handling"
        ));

        // Ek kurallar
        addSecurityRules();
    }

    private void addSecurityRules() {
        // Thread Safety
        securityRules.add(new SecurityRule(
            "THREAD_SAFETY",
            code -> code.contains("synchronized") || code.contains("volatile"),
            RiskLevel.MEDIUM,
            "Potential thread safety issues",
            "Ensure proper synchronization in multi-threaded code"
        ));

        // Resource Management
        securityRules.add(new SecurityRule(
            "RESOURCE_LEAK",
            code -> code.contains("new FileInputStream") || code.contains("new Socket"),
            RiskLevel.HIGH,
            "Potential resource leak",
            "Use try-with-resources for proper resource management"
        ));
    }

    public SecurityAnalysisResult analyzeCode(String sourceCode) {
        Map<String, List<SecurityIssue>> vulnerabilities = new HashMap<>();
        List<SecurityRecommendation> recommendations = new ArrayList<>();
        
        // Pattern-based analysis
        analyzePatterns(sourceCode, vulnerabilities);
        
        // Rule-based analysis
        analyzeRules(sourceCode, vulnerabilities);
        
        // Generate recommendations
        generateRecommendations(vulnerabilities, recommendations);
        
        // Calculate risk metrics
        RiskMetrics riskMetrics = calculateRiskMetrics(vulnerabilities);
        
        return new SecurityAnalysisResult(
            vulnerabilities,
            recommendations,
            riskMetrics,
            generateSecurityReport(vulnerabilities, recommendations, riskMetrics)
        );
    }

    private void analyzePatterns(String sourceCode, Map<String, List<SecurityIssue>> vulnerabilities) {
        for (Map.Entry<String, VulnerabilityPattern> entry : securityPatterns.entrySet()) {
            String patternType = entry.getKey();
            VulnerabilityPattern vulnPattern = entry.getValue();
            Matcher matcher = vulnPattern.pattern().matcher(sourceCode);
            List<SecurityIssue> issues = new ArrayList<>();

            while (matcher.find()) {
                String matchedCode = matcher.group();
                int lineNumber = getLineNumber(sourceCode, matcher.start());
                
                SecurityIssue issue = new SecurityIssue(
                    patternType,
                    vulnPattern.description(),
                    vulnPattern.riskLevel(),
                    lineNumber,
                    matchedCode,
                    vulnPattern.recommendation(),
                    calculateImpact(vulnPattern.riskLevel()),
                    calculateSeverityScore(vulnPattern.riskLevel(), lineNumber)
                );
                issues.add(issue);
            }

            if (!issues.isEmpty()) {
                vulnerabilities.put(patternType, issues);
            }
        }
    }

    private void analyzeRules(String sourceCode, Map<String, List<SecurityIssue>> vulnerabilities) {
        for (SecurityRule rule : securityRules) {
            if (rule.condition().test(sourceCode)) {
                SecurityIssue issue = new SecurityIssue(
                    rule.ruleId(),
                    rule.description(),
                    rule.riskLevel(),
                    findRuleViolationLine(sourceCode, rule),
                    extractRelevantCode(sourceCode, rule),
                    rule.recommendation(),
                    calculateImpact(rule.riskLevel()),
                    calculateSeverityScore(rule.riskLevel(), 0)
                );
                
                vulnerabilities.computeIfAbsent(rule.ruleId(), k -> new ArrayList<>()).add(issue);
            }
        }
    }

    private void generateRecommendations(
        Map<String, List<SecurityIssue>> vulnerabilities, 
        List<SecurityRecommendation> recommendations
    ) {
        Map<String, List<SecurityIssue>> issuesByCategory = new HashMap<>();
        
        // İssue'ları kategorilere göre grupla
        vulnerabilities.forEach((key, issues) -> {
            String category = getCategoryFromIssueType(key);
            issuesByCategory.computeIfAbsent(category, k -> new ArrayList<>()).addAll(issues);
        });
        
        // Her kategori için öneriler oluştur
        issuesByCategory.forEach((category, issues) -> {
            SecurityRecommendation recommendation = new SecurityRecommendation(
                category,
                generateCategoryDescription(category, issues),
                generateCategoryRecommendation(category, issues),
                findHighestRiskLevel(issues),
                issues.stream().map(SecurityIssue::type).distinct().toList()
            );
            recommendations.add(recommendation);
        });
    }

    private RiskMetrics calculateRiskMetrics(Map<String, List<SecurityIssue>> vulnerabilities) {
        int criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0;
        Map<String, Double> categoryScores = new HashMap<>();
        
        for (List<SecurityIssue> issues : vulnerabilities.values()) {
            for (SecurityIssue issue : issues) {
                switch (issue.riskLevel()) {
                    case CRITICAL -> criticalCount++;
                    case HIGH -> highCount++;
                    case MEDIUM -> mediumCount++;
                    case LOW -> lowCount++;
                }
            }
        }
        
        double overallScore = calculateOverallScore(criticalCount, highCount, mediumCount, lowCount);
        double securityScore = calculateSecurityScore(vulnerabilities);
        double codeQualityScore = calculateCodeQualityScore(vulnerabilities);
        
        // Kategori skorlarını hesapla
        vulnerabilities.forEach((key, issues) -> {
            String category = getCategoryFromIssueType(key);
            double categoryScore = calculateCategoryScore(issues);
            categoryScores.put(category, categoryScore);
        });
        
        return new RiskMetrics(
            overallScore,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            codeQualityScore,
            securityScore,
            categoryScores
        );
    }

    // Yardımcı metodlar
    private int getLineNumber(String sourceCode, int position) {
        return sourceCode.substring(0, position).split("\n").length;
    }

    private String calculateImpact(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case CRITICAL -> "Critical security vulnerability that must be fixed immediately";
            case HIGH -> "High-risk security issue that should be addressed soon";
            case MEDIUM -> "Medium-risk issue that should be planned for remediation";
            case LOW -> "Low-risk issue that should be considered for future improvements";
        };
    }

    private double calculateSeverityScore(RiskLevel riskLevel, int lineNumber) {
        double baseScore = switch (riskLevel) {
            case CRITICAL -> 90.0;
            case HIGH -> 70.0;
            case MEDIUM -> 40.0;
            case LOW -> 20.0;
        };
        
        // Adjust score based on location in code (earlier = more severe)
        return Math.min(100, baseScore + (1.0 / (lineNumber + 1)) * 10);
    }

    private String getCategoryFromIssueType(String issueType) {
        // İssue tipine göre kategori belirleme
        if (issueType.contains("INJECTION")) return "Input Validation";
        if (issueType.contains("AUTH")) return "Authentication";
        if (issueType.contains("CRYPTO")) return "Cryptography";
        return "General Security";
    }

    private double calculateOverallScore(int critical, int high, int medium, int low) {
        double total = critical * 10 + high * 5 + medium * 2 + low;
        return Math.max(0, 100 - total);
    }

    private double calculateSecurityScore(Map<String, List<SecurityIssue>> vulnerabilities) {
        // Implement security score calculation logic
        return 100.0; // Placeholder
    }

    private double calculateCodeQualityScore(Map<String, List<SecurityIssue>> vulnerabilities) {
        // Implement code quality score calculation logic
        return 100.0; // Placeholder
    }

    private double calculateCategoryScore(List<SecurityIssue> issues) {
        // Implement category score calculation logic
        return 100.0; // Placeholder
    }

    private int findRuleViolationLine(String sourceCode, SecurityRule rule) {
        // Implement logic to find the line number where the rule is violated
        return 1; // Placeholder
    }

    private String extractRelevantCode(String sourceCode, SecurityRule rule) {
        // Implement logic to extract relevant code snippet
        return ""; // Placeholder
    }

    private RiskLevel findHighestRiskLevel(List<SecurityIssue> issues) {
        return issues.stream()
            .map(SecurityIssue::riskLevel)
            .max(Enum::compareTo)
            .orElse(RiskLevel.LOW);
    }

    private String generateCategoryDescription(String category, List<SecurityIssue> issues) {
        return String.format("Found %d issues in category: %s", issues.size(), category);
    }

    private String generateCategoryRecommendation(String category, List<SecurityIssue> issues) {
        return "Review and fix all " + category.toLowerCase() + " related issues";
    }

    private String generateSecurityReport(
        Map<String, List<SecurityIssue>> vulnerabilities,
        List<SecurityRecommendation> recommendations,
        RiskMetrics riskMetrics
    ) {
        StringBuilder report = new StringBuilder();
        
        // Report Header
        report.append("Security Analysis Report\n");
        report.append("======================\n\n");
        
        // Overall Metrics
        report.append("Risk Metrics:\n");
        report.append("--------------\n");
        report.append(String.format("Overall Risk Score: %.2f\n", riskMetrics.overallRiskScore()));
        report.append(String.format("Security Score: %.2f\n", riskMetrics.securityScore()));
        report.append(String.format("Code Quality Score: %.2f\n\n", riskMetrics.codeQualityScore()));
        
        // Issue Summary
        report.append("Issue Summary:\n");
        report.append("--------------\n");
        report.append(String.format("Critical Issues: %d\n", riskMetrics.criticalIssues()));
        report.append(String.format("High Issues: %d\n", riskMetrics.highIssues()));
        report.append(String.format("Medium Issues: %d\n", riskMetrics.mediumIssues()));
        report.append(String.format("Low Issues: %d\n\n", riskMetrics.lowIssues()));
        
        // Detailed Vulnerabilities
        report.append("Detailed Vulnerabilities:\n");
        report.append("----------------------\n");
        vulnerabilities.forEach((type, issues) -> {
            report.append(String.format("\n%s:\n", type));
            issues.forEach(issue -> {
                report.append(String.format("- Line %d: %s\n", issue.lineNumber(), issue.description()));
                report.append(String.format("  Risk Level: %s\n", issue.riskLevel()));
                report.append(String.format("  Code: %s\n", issue.vulnerableCode()));
                report.append(String.format("  Recommendation: %s\n", issue.recommendation()));
            });
        });
        
        // Recommendations
        report.append("\nRecommendations:\n");
        report.append("---------------\n");
        recommendations.forEach(rec -> {
            report.append(String.format("\nCategory: %s\n", rec.category()));
            report.append(String.format("Priority: %s\n", rec.priority()));
            report.append(String.format("Description: %s\n", rec.description()));
            report.append(String.format("Recommendation: %s\n", rec.recommendation()));
        });
        
        // Category Scores
        report.append("\nCategory Scores:\n");
        report.append("---------------\n");
        riskMetrics.categoryScores().forEach((category, score) -> {
            report.append(String.format("%s: %.2f\n", category, score));
        });
        
        return report.toString();
    }
}