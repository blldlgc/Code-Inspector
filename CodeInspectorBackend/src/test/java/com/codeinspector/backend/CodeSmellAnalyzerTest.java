package com.codeinspector.backend;

import com.codeinspector.backend.dto.CodeAnalysisResult;
import com.codeinspector.backend.utils.CodeSmellAnalyzer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class CodeSmellAnalyzerTest {

    private CodeSmellAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new CodeSmellAnalyzer();
    }

    private final String code = """
import java.util.ArrayList;
import java.util.List;

// Kullanıcı Sınıfı (Minimal Alanlar)
class User {
    public String n; // Kullanıcı adı
    public String p; // Parola
    public String r; // Rol (admin, user)

    public User(String n, String p, String r) {
        this.n = n;
        this.p = p;
        this.r = r;
    }
}

// Kullanıcı Yönetimi Sınıfı (Tanrı Sınıfı)
class UserManager {
    private List<User> users = new ArrayList<>();
    public static int adminCount = 0; // Global Durum

    public void addUser(String name, String pass, String role) {
        // Uzun Parametre Listesi
        User user = new User(name, pass, role);
        users.add(user);
        if (role.equals("admin")) {
            adminCount++;
        }
    }

    public void removeUser(String name) {
        // Kod Tekrarı
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).n.equals(name)) {
                if (users.get(i).r.equals("admin")) {
                    adminCount--;
                }
                users.remove(i);
                break;
            }
        }
    }

    public void authenticateUser(String name, String pass) {
        // Kod Tekrarı
        for (User user : users) {
            if (user.n.equals(name) && user.p.equals(pass)) {
                System.out.println("User authenticated: " + name);
                return;
            }
        }
        System.out.println("Authentication failed.");
    }

    public void displayAllUsers() {
        // Veri Kümesi (Data Clumps)
        for (int i = 0; i < users.size(); i++) {
            User u = users.get(i);
            System.out.println("User " + (i + 1) + ": " + u.n + ", " + u.r);
        }
    }

    public void displayAdminCount() {
        // Gereksiz Switch (Tek Durum)
        switch (adminCount) {
            case 0:
                System.out.println("No admins found.");
                break;
            default:
                System.out.println("Number of admins: " + adminCount);
        }
    }

    public void riskyOperation(String name, String role, String pass, String action) {
        // Uzun Yöntem ve Uzun Parametre Listesi
        for (int i = 0; i < users.size(); i++) {
            User u = users.get(i);
            if (u.n.equals(name) && u.r.equals(role) && u.p.equals(pass)) {
                switch (action) {
                    case "delete":
                        users.remove(i);
                        System.out.println("User deleted: " + name);
                        break;
                    case "promote":
                        u.r = "admin";
                        adminCount++;
                        System.out.println("User promoted to admin: " + name);
                        break;
                    default:
                        System.out.println("Unknown action.");
                }
                return;
            }
        }
        System.out.println("Operation failed.");
    }
}

// Ana Çalıştırma Sınıfı
public class UserManagementSystem {
    public static void main(String[] args) {
        UserManager manager = new UserManager();

        // Kullanıcılar Ekleniyor
        manager.addUser("Alice", "pass123", "admin");
        manager.addUser("Bob", "password", "user");
        manager.addUser("Charlie", "1234", "user");

        // Tüm Kullanıcıları Göster
        manager.displayAllUsers();

        // Yetkilendirme
        manager.authenticateUser("Alice", "pass123");

        // Admin Sayısını Göster
        manager.displayAdminCount();

        // Riskli İşlem
        manager.riskyOperation("Bob", "user", "password", "promote");

        // Tüm Kullanıcıları Göster
        manager.displayAllUsers();
    }
}

            """;


    @Test
    public void testAnalyzeCode() {
        CodeAnalysisResult result = analyzer.analyzeCode(code);

        assertNotNull(result);

        Map<String, Double> smellScores = result.getSmellScores();
        assertNotNull(smellScores);
        assertTrue(smellScores.containsKey("Long Methods"));
        assertTrue(smellScores.containsKey("Large Class"));
        assertTrue(smellScores.containsKey("Duplicate Code"));
        assertTrue(smellScores.containsKey("Long Parameter List"));
        assertTrue(smellScores.containsKey("Cyclomatic Complexity"));
        assertTrue(smellScores.containsKey("Naming Conventions"));
        assertTrue(smellScores.containsKey("Data Clumps"));
        assertTrue(smellScores.containsKey("Switch Statements"));
        assertTrue(result.getOverallScore() > 0);

    }

    @Test
    public void testAnalyzeLongMethods() {
        String sourceCode = """
                public void longMethod() {
                                    int a = 0;
                                    int b = 1;
                                    int c = 2;
                                    int d = 3;
                                    int e = 4;
                                    int f = 5;
                                    int g = 6;
                                    int h = 7;
                                    int i = 8;
                                    int j = 9;
                                    int k = 10;
                                    int l = 11;
                                    int m = 12;
                                    int n = 13;
                                    int o = 14;
                                    int p = 15;
                                    int q = 16;
                                    int r = 17;
                                    int s = 18;
                                    int t = 19;
                                    int u = 20;
                                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);
        assertNotNull(result);
        assertTrue(result.getSmellScores().get("Long Methods") < 100);
        assertFalse(result.getSmellScores().get("Long Methods").isNaN());
    }


    @Test
    public void testAnalyzeLargeClass() {
        String sourceCode = """
                 public class LargeClass {
                                    public void method1() {}
                                    public void method2() {}
                                    public void method3() {}
                                    public void method4() {}
                                    public void method5() {}
                                    public void method6() {}
                                    public void method7() {}
                                    public void method8() {}
                                    public void method9() {}
                                    public void method10() {}
                                    public void method11() {}
                                }
                """;
        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);
        assertNotNull(result);
        assertTrue(result.getSmellScores().get("Large Class") < 100);
        assertFalse(result.getSmellScores().get("Large Class").isNaN());
    }

    @Test
    void testAnalyzeDuplicateCode() {
        String sourceCode = """
                public class DuplicateCode {
                    public void method1() {
                        System.out.println("Duplicate");
                        System.out.println("Duplicate");
                    }
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getSmellScores().get("Duplicate Code") < 100);
        assertFalse(result.getSmellDetails().get("Duplicate Code").isEmpty());
    }

    @Test
    void testAnalyzeLongParameterList() {
        String sourceCode = """
                public class ParameterTest {
                    public void method1(int a, int b, int c, int d) {}
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getSmellScores().get("Long Parameter List") < 100);
        assertFalse(result.getSmellDetails().get("Long Parameter List").isEmpty());
    }

    @Test
    void testAnalyzeComplexity() {
        String sourceCode = """
                public class ComplexityTest {
                    public void method1() {
                        if (true) {
                            while (true) {
                                for (int i = 0; i < 10; i++) {
                                    if (i == 5) break;
                                }
                            }
                            while (true) {
                                for (int i = 0; i < 10; i++) {
                                    if (i == 5) break;
                                }
                            }
                            while (true) {
                                for (int i = 0; i < 10; i++) {
                                    if (i == 5) break;
                                }
                            }
                            while (true) {
                                for (int i = 0; i < 10; i++) {
                                    if (i == 5) break;
                                }
                            }
                        }
                    }
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getSmellScores().get("Cyclomatic Complexity") < 100);
        assertFalse(result.getSmellDetails().get("Cyclomatic Complexity").isEmpty());
    }

    @Test
    void testAnalyzeNaming() {
        String sourceCode = """
                public class NamingTest {
                    private int x;
                    private String VeryBadVariableName;
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getSmellScores().get("Naming Conventions") < 100);
        assertFalse(result.getSmellDetails().get("Naming Conventions").isEmpty());
    }

    @Test
    void testAnalyzeDataClumps() {
        String sourceCode = """
                public class DataClumpTest {
                    private int field1;
                    private int field2;
                    private int field3;
                    private int field4;
                    private int field5;
                    private int field6;
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getSmellScores().get("Data Clumps") < 100);
        assertFalse(result.getSmellDetails().get("Data Clumps").isEmpty());
    }

    @Test
    void testAnalyzeSwitchStatements() {
        String sourceCode = """
                public class SwitchTest {
                    public void method1(int value) {
                        switch (value) {
                            case 1 -> System.out.println("One");
                            case 2 -> System.out.println("Two");
                            default -> System.out.println("Other");
                            switch (value) {
                            case 1 -> System.out.println("One");
                            case 2 -> System.out.println("Two");
                            default -> System.out.println("Other");
                        }
                        switch (value) {
                            case 1 -> System.out.println("One");
                            case 2 -> System.out.println("Two");
                            default -> System.out.println("Other");
                        }
                        }
                    }
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getSmellScores().get("Switch Statements") < 100);
        assertFalse(result.getSmellDetails().get("Switch Statements").isEmpty());
    }

    @Test
    void testOverallScore() {
        String sourceCode = """
                public class OverallScoreTest {
                    private int x;
                    public void method1(int a, int b, int c, int d) {}
                }
                """;

        CodeAnalysisResult result = analyzer.analyzeCode(sourceCode);

        assertTrue(result.getOverallScore() > 0);
        assertTrue(result.getOverallScore() <= 100);
    }
}

