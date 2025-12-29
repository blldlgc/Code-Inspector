package com.codeinspector.backend.utils;

import java.io.File; // <-- dto CoverageResult import
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map; // JUnit 4 örneği
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

import org.jacoco.core.analysis.Analyzer;
import org.jacoco.core.analysis.CoverageBuilder;
import org.jacoco.core.analysis.IClassCoverage;
import org.jacoco.core.analysis.ICounter;
import org.jacoco.core.analysis.IMethodCoverage;
import org.jacoco.core.data.ExecutionDataStore;
import org.jacoco.core.data.SessionInfoStore;
import org.jacoco.core.instr.Instrumenter;
import org.jacoco.core.runtime.IRuntime;
import org.jacoco.core.runtime.LoggerRuntime;
import org.jacoco.core.runtime.RuntimeData;
import org.junit.Test;

import com.codeinspector.backend.dto.CoverageResult;

public class InMemoryCoverageAnalyzer {

    private static final Pattern PACKAGE_PATTERN = Pattern.compile("^\\s*package\\s+([\\w\\.]+)\\s*;", Pattern.MULTILINE);

    /**
     * Tek bir source ve test dosyası için coverage analizi yapar.
     * Bu metot bağımlılıkları handle etmez, sadece verilen 2 dosyayı derler.
     */
    public CoverageResult analyzeCoverage(String sourceCode, String testCode) {
        return analyzeCoverageWithDependencies(sourceCode, testCode, new HashMap<>());
    }

    /**
     * Source ve test dosyası ile birlikte bağımlılıkları da derleyerek coverage analizi yapar.
     * 
     * @param sourceCode Ana source dosyasının içeriği
     * @param testCode Test dosyasının içeriği
     * @param dependencyFiles Bağımlılık dosyaları (dosya yolu -> içerik map'i)
     * @return Coverage sonucu
     */
    public CoverageResult analyzeCoverageWithDependencies(
            String sourceCode, 
            String testCode, 
            Map<String, String> dependencyFiles) {
        File tempDir = null;
        IRuntime runtime = null;
        try {
            System.out.println("\n=== COVERAGE ANALİZİ BAŞLIYOR ===");
            
            // 1) Geçici klasör
            tempDir = createTempDirectory();
            System.out.println("1. Geçici klasör oluşturuldu: " + tempDir.getAbsolutePath());

            // 2) Sınıf adlarını bul
            String mainClassName = extractClassName(sourceCode);
            String testClassName = extractClassName(testCode);
            System.out.println("2. Sınıf adları bulundu:");
            System.out.println("   - Ana sınıf: " + mainClassName);
            System.out.println("   - Test sınıfı: " + testClassName);

            // 2.5) Test koduna eksik import'ları ekle
            testCode = addMissingImports(testCode);
            sourceCode = addMissingImports(sourceCode);

            // 3) .java dosyalarına yaz - package yapısını koru
            String sourcePackage = extractPackage(sourceCode);
            String testPackage = extractPackage(testCode);
            
            // Package yapısına göre dosya yolunu oluştur
            String sourceFilePath = sourcePackage != null 
                ? sourcePackage.replace('.', '/') + "/" + mainClassName + ".java"
                : mainClassName + ".java";
            String testFilePath = testPackage != null 
                ? testPackage.replace('.', '/') + "/" + testClassName + ".java"
                : testClassName + ".java";
            
            File sourceFile = new File(tempDir, sourceFilePath);
            File testFile = new File(tempDir, testFilePath);
            sourceFile.getParentFile().mkdirs(); // Package dizinlerini oluştur
            testFile.getParentFile().mkdirs();
            writeFile(sourceFile, sourceCode);
            writeFile(testFile, testCode);
            System.out.println("3. Kaynak kodlar dosyalara yazıldı:");
            System.out.println("   - Kaynak dosya: " + sourceFile.getAbsolutePath());
            System.out.println("   - Test dosyası: " + testFile.getAbsolutePath());
            
            // Bağımlılık dosyalarını da yaz - package yapısını koru
            List<File> dependencyJavaFiles = new ArrayList<>();
            if (dependencyFiles != null && !dependencyFiles.isEmpty()) {
                System.out.println("   - Bağımlılık dosyaları yazılıyor...");
                for (Map.Entry<String, String> entry : dependencyFiles.entrySet()) {
                    String depFilePath = entry.getKey(); // Relative path: com/testproject/model/User.java
                    String depContent = entry.getValue();
                    
                    // Package yapısını korumak için dosya yolunu kullan
                    File depFile = new File(tempDir, depFilePath);
                    depFile.getParentFile().mkdirs(); // Package dizinlerini oluştur
                    writeFile(depFile, depContent);
                    dependencyJavaFiles.add(depFile);
                    System.out.println("     * " + depFilePath);
                }
            }
            
            System.out.println("\nKAYNAK KOD:");
            System.out.println(sourceCode);
            System.out.println("\nTEST KODU:");
            System.out.println(testCode);

            // 4) Derleme - Tüm dosyaları birlikte derle
            System.out.println("\n4. Derleme başlıyor...");
            List<File> allJavaFiles = new ArrayList<>();
            allJavaFiles.add(sourceFile);
            allJavaFiles.add(testFile);
            allJavaFiles.addAll(dependencyJavaFiles);
            compileJavaFiles(tempDir, allJavaFiles.toArray(new File[0]));
            System.out.println("   Derleme başarılı! (Toplam " + allJavaFiles.size() + " dosya derlendi)");

            // Derleme sonrası kontrol - package yapısına göre
            String mainClassFullName = sourcePackage != null ? sourcePackage + "." + mainClassName : mainClassName;
            String testClassFullName = testPackage != null ? testPackage + "." + testClassName : testClassName;
            File mainClassFile = new File(tempDir, mainClassFullName.replace('.', '/') + ".class");
            File testClassFile = new File(tempDir, testClassFullName.replace('.', '/') + ".class");

            System.out.println("Derleme sonrası dosya kontrolü:");
            System.out.println("Ana sınıf (.class): " + mainClassFile.exists());
            System.out.println("Test sınıfı (.class): " + testClassFile.exists());

            if (!mainClassFile.exists() || !testClassFile.exists()) {
                throw new RuntimeException("Derleme başarısız olmuş olabilir, .class dosyaları bulunamadı");
            }

            // 5) JaCoCo runtime
            runtime = new LoggerRuntime();
            RuntimeData data = new RuntimeData();
            runtime.startup(data);
            System.out.println("5. JaCoCo runtime başlatıldı");

            // 6) ClassLoader hazırlığı
            System.out.println("\n6. ClassLoader hazırlanıyor...");
            URL[] urls = new URL[] { tempDir.toURI().toURL() };
            System.out.println("   ClassLoader URL: " + urls[0]);

            try (URLClassLoader instrumentingClassLoader = 
                     new URLClassLoader(urls, new InstrumentingClassLoader(getClass().getClassLoader(), runtime, tempDir))) {

                // 7) Sınıfları yükle - full class name kullan
                System.out.println("\n7. Sınıflar yükleniyor...");
                Class<?> mainClass = instrumentingClassLoader.loadClass(mainClassFullName);
                System.out.println("   Ana sınıf yüklendi: " + mainClass.getName());
                Class<?> testClass = instrumentingClassLoader.loadClass(testClassFullName);
                System.out.println("   Test sınıfı yüklendi: " + testClass.getName());

                // 8) Test instance
                System.out.println("\n8. Test instance'ı oluşturuluyor...");
                Object testInstance = testClass.getDeclaredConstructor().newInstance();
                System.out.println("   Test instance oluşturuldu: " + testInstance);

                // 8.5) @Before metodlarını çalıştır (JUnit 4 için)
                System.out.println("\n8.5. @Before metodları çalıştırılıyor...");
                try {
                    Method beforeMethod = testClass.getDeclaredMethod("setUp");
                    beforeMethod.setAccessible(true);
                    beforeMethod.invoke(testInstance);
                    System.out.println("   setUp() metodu çalıştırıldı");
                } catch (NoSuchMethodException e) {
                    System.out.println("   setUp() metodu bulunamadı, atlanıyor");
                } catch (Exception e) {
                    System.err.println("   setUp() metodu çalıştırılırken hata: " + e.getMessage());
                }

                // 9) mainClass'ı test'e enjekte et - test sınıfındaki field'lara bak
                System.out.println("\n9. Ana sınıf instance'ı hazırlanıyor...");
                Object mainInstance = null;
                
                // Önce test sınıfında ana sınıf için bir field var mı kontrol et
                Field mainClassField = null;
                for (Field field : testClass.getDeclaredFields()) {
                    System.out.println("   Field inceleniyor: " + field.getName() + " (tip: " + field.getType() + ")");
                    if (field.getType().equals(mainClass)) {
                        mainClassField = field;
                        System.out.println("   -> Ana sınıf field'ı bulundu: " + field.getName());
                        break;
                    }
                }
                
                // Eğer test sınıfında ana sınıf için bir field varsa, onu kullan
                if (mainClassField != null) {
                    mainClassField.setAccessible(true);
                    Object existingInstance = mainClassField.get(testInstance);
                    if (existingInstance != null) {
                        System.out.println("   -> Test sınıfında zaten bir instance var, kullanılıyor");
                        mainInstance = existingInstance;
                    } else {
                        // Field var ama null, yeni instance oluştur
                        System.out.println("   -> Field var ama null, yeni instance oluşturuluyor...");
                        mainInstance = createMainClassInstance(mainClass, testClass, testInstance, instrumentingClassLoader);
                        if (mainInstance != null) {
                            mainClassField.set(testInstance, mainInstance);
                            System.out.println("   -> Ana sınıf instance'ı field'a enjekte edildi");
                        }
                    }
                } else {
                    // Test sınıfında field yok, yeni instance oluştur
                    System.out.println("   -> Test sınıfında ana sınıf field'ı yok, yeni instance oluşturuluyor...");
                    mainInstance = createMainClassInstance(mainClass, testClass, testInstance, instrumentingClassLoader);
                }
                
                if (mainInstance == null) {
                    System.err.println("   UYARI: Ana sınıf instance'ı oluşturulamadı. Testler çalışabilir ama coverage verisi eksik olabilir.");
                } else {
                    System.out.println("   Ana sınıf instance'ı hazır: " + mainInstance.getClass().getName());
                }

                // 10) Test metodlarını çalıştır
                System.out.println("\n10. Test metodları çalıştırılıyor...");
                Method[] methods = testClass.getMethods();
                System.out.println("    Toplam metod sayısı: " + methods.length);
                int testCount = 0;
                int successCount = 0;
                for (Method method : methods) {
                    System.out.println("    İncelenen metod: " + method.getName());
                    if (method.isAnnotationPresent(Test.class)) {
                        testCount++;
                        System.out.println("    -> @Test bulundu, çalıştırılıyor: " + method.getName());
                        try {
                            method.invoke(testInstance);
                            successCount++;
                            System.out.println("       Test başarılı: " + method.getName());
                        } catch (Exception e) {
                            System.err.println("       Test başarısız: " + method.getName());
                            System.err.println("       Hata: " + e.getMessage());
                            // Test başarısız olsa bile coverage verisi toplanmalı
                            // Exception'ı yazdır ama devam et
                            if (e.getCause() != null) {
                                System.err.println("       Root cause: " + e.getCause().getMessage());
                            }
                        }
                    }
                }
                System.out.println("    Test özeti: " + successCount + "/" + testCount + " başarılı");

                // 11) Coverage datası - Testler çalıştıktan sonra topla
                System.out.println("\n11. Coverage verisi toplanıyor...");
                ExecutionDataStore executionData = new ExecutionDataStore();
                SessionInfoStore sessionInfo = new SessionInfoStore();
                
                // Coverage verisini topla - testler başarısız olsa bile
                data.collect(executionData, sessionInfo, false);
                
                System.out.println("    Execution data store size: " + executionData.getContents().size());
                System.out.println("    Session info store size: " + sessionInfo.getInfos().size());
                
                // Eğer coverage verisi yoksa uyarı ver
                if (executionData.getContents().isEmpty()) {
                    System.err.println("    UYARI: Coverage verisi toplanamadı! Testler çalıştırılmış olabilir ama coverage verisi yok.");
                    System.err.println("    Bu durum genellikle testlerin exception fırlatması veya instrument edilmiş class'ların yüklenmemesi nedeniyle olur.");
                }

                // 12) Coverage analizi
                System.out.println("\n12. Coverage analizi yapılıyor...");
                CoverageBuilder coverageBuilder = new CoverageBuilder();
                Analyzer analyzer = new Analyzer(executionData, coverageBuilder);

                // Main class'ı analiz et
                if (mainClassFile.exists()) {
                    byte[] mainClassBytes = Files.readAllBytes(mainClassFile.toPath());
                    analyzer.analyzeClass(mainClassBytes, mainClassFullName);
                    System.out.println("    Main class analiz edildi: " + mainClassFullName);
                } else {
                    System.err.println("    HATA: Main class dosyası bulunamadı: " + mainClassFile.getAbsolutePath());
                }
                
                // Tüm bağımlılık class'larını da analiz et (opsiyonel - sadece main class için coverage hesaplanıyor)
                System.out.println("    Coverage builder'da " + coverageBuilder.getClasses().size() + " sınıf bulundu");

                // 13) Sonuçları dönüştür
                System.out.println("\n13. Sonuçlar dönüştürülüyor...");
                CoverageResult result = convertCoverage(coverageBuilder);
                System.out.println("    Coverage sonucu:");
                System.out.println("    - Yüzde: " + result.getCoveragePercentage());
                System.out.println("    - Kapsanan satır: " + result.getCoveredLines());
                System.out.println("    - Toplam satır: " + result.getTotalLines());
                System.out.println("    - Metod coverage: " + result.getMethodCoverage());

                return result;
            }
        } catch (Exception e) {
            System.err.println("\n=== HATA OLUŞTU ===");
            System.err.println("Hata mesajı: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Coverage analizi başarısız oldu", e);
        } finally {
            if (runtime != null) {
                try {
                    runtime.shutdown();
                    System.out.println("\nJaCoCo runtime kapatıldı");
                } catch (Exception ex) {
                    System.err.println("Runtime kapatılırken hata oluştu: " + ex.getMessage());
                }
            }
            System.out.println("\n=== COVERAGE ANALİZİ TAMAMLANDI ===\n");
        }
    }

    // CoverageBuilder -> CoverageResult (dto)
    private CoverageResult convertCoverage(CoverageBuilder coverageBuilder) {
        System.out.println("\n=== COVERAGE DÖNÜŞTÜRME BAŞLIYOR ===");
        
        if (coverageBuilder.getClasses().isEmpty()) {
            System.err.println("HATA: Coverage verisi toplanamadı - Sınıf bulunamadı");
            throw new RuntimeException("Coverage verisi toplanamadı");
        }

        IClassCoverage classCoverage = coverageBuilder.getClasses().iterator().next();
        System.out.println("Sınıf coverage bilgisi alındı: " + classCoverage.getName());
        
        // Satır sayımı için ICounter kullan
        ICounter lineCounter = classCoverage.getLineCounter();
        int covered = lineCounter.getCoveredCount();
        int total = lineCounter.getTotalCount();
        double percentage = total > 0 ? (covered * 100.0 / total) : 0.0;
        
        System.out.println("\nGenel coverage bilgisi (Counter'dan):");
        System.out.println("Toplam satır: " + total);
        System.out.println("Kapsanan satır: " + covered);
        System.out.println("Yüzde: " + percentage);

        // Metod coverage'ı
        Map<String, int[]> methodCoverage = new HashMap<>();
        for (IMethodCoverage method : classCoverage.getMethods()) {
            System.out.println("\nMetod: " + method.getName());
            
            // Metod için ICounter kullan
            ICounter methodLineCounter = method.getLineCounter();
            int mCovered = methodLineCounter.getCoveredCount();
            int mTotal = methodLineCounter.getTotalCount();
            
            System.out.println(String.format("  Counter'dan: %d/%d satır kapsandı", mCovered, mTotal));
            methodCoverage.put(method.getName(), new int[]{mCovered, mTotal});
        }

        System.out.println("\n=== COVERAGE DÖNÜŞTÜRME TAMAMLANDI ===");
        return new CoverageResult(percentage, covered, total, methodCoverage);
    }

    // Package bilgisini çıkarmak için metod
    private String extractPackage(String code) {
        Matcher pkgMatcher = PACKAGE_PATTERN.matcher(code);
        if (pkgMatcher.find()) {
            return pkgMatcher.group(1);
        }
        return null;
    }

    /**
     * Test koduna eksik standart Java import'larını ekler.
     * Date, List, ArrayList, Map, HashMap gibi yaygın kullanılan sınıfları kontrol eder.
     */
    private String addMissingImports(String code) {
        if (code == null || code.trim().isEmpty()) {
            return code;
        }

        StringBuilder sb = new StringBuilder();
        List<String> missingImports = new ArrayList<>();
        
        // Yaygın kullanılan Java standart kütüphanesi sınıflarını kontrol et
        String[] commonClasses = {
            "Date", "java.util.Date",
            "List", "java.util.List",
            "ArrayList", "java.util.ArrayList",
            "Map", "java.util.Map",
            "HashMap", "java.util.HashMap",
            "Set", "java.util.Set",
            "HashSet", "java.util.HashSet",
            "Optional", "java.util.Optional",
            "Collections", "java.util.Collections",
            "Arrays", "java.util.Arrays"
        };

        // Import'ları kontrol et
        boolean hasDateImport = code.contains("import java.util.Date") || code.contains("import java.util.*");
        boolean hasUtilImport = code.contains("import java.util.");

        // Date kullanılıyor mu ama import yok mu?
        if (code.contains("new Date()") || code.contains("Date ") || code.matches(".*\\bDate\\s*[^a-zA-Z].*")) {
            if (!hasDateImport && !hasUtilImport) {
                missingImports.add("import java.util.Date;");
            }
        }

        // List kullanılıyor mu ama import yok mu?
        if ((code.contains("List<") || code.contains("List ") || code.matches(".*\\bList\\s*<.*")) && !hasUtilImport) {
            if (!code.contains("import java.util.List")) {
                missingImports.add("import java.util.List;");
            }
        }

        // ArrayList kullanılıyor mu ama import yok mu?
        if ((code.contains("new ArrayList") || code.contains("ArrayList<") || code.contains("ArrayList ")) && !hasUtilImport) {
            if (!code.contains("import java.util.ArrayList")) {
                missingImports.add("import java.util.ArrayList;");
            }
        }

        // Eğer eksik import varsa ekle
        if (!missingImports.isEmpty()) {
            // Package statement'ından sonra import'ları ekle
            int packageEnd = code.indexOf(";");
            if (packageEnd > 0 && code.substring(0, packageEnd).contains("package")) {
                // Package'den sonraki ilk satırı bul
                int insertPos = code.indexOf('\n', packageEnd);
                if (insertPos < 0) {
                    insertPos = packageEnd + 1;
                } else {
                    insertPos++; // \n'den sonra
                }
                
                // Mevcut import'ları kontrol et
                String beforeImports = code.substring(0, insertPos);
                String afterImports = code.substring(insertPos);
                
                // Import'ları ekle
                sb.append(beforeImports);
                for (String imp : missingImports) {
                    sb.append(imp).append("\n");
                }
                sb.append(afterImports);
                
                System.out.println("Eksik import'lar eklendi: " + missingImports);
                return sb.toString();
            } else {
                // Package yoksa, en başa ekle
                for (String imp : missingImports) {
                    sb.append(imp).append("\n");
                }
                sb.append(code);
                System.out.println("Eksik import'lar eklendi (package yok): " + missingImports);
                return sb.toString();
            }
        }

        return code;
    }

    // Sınıf adını çıkarmak için basit metod
    private String extractClassName(String code) {
        // Önce "public class" ara, bulunamazsa "class" ara
        String marker = "public class ";
        int idx = code.indexOf(marker);
        
        if (idx < 0) {
            // "public class" bulunamadı, "class" ara
            marker = "class ";
            idx = code.indexOf(marker);
            if (idx < 0) {
                throw new RuntimeException("'public class' veya 'class' bulunamadı, sınıf adı tespit edilemiyor. Kod içeriği: " + 
                    (code.length() > 200 ? code.substring(0, 200) + "..." : code));
            }
        }
        
        String after = code.substring(idx + marker.length()).trim();
        int spaceIndex = after.indexOf(' ');
        int braceIndex = after.indexOf('{');
        int endIndex = -1;
        if (spaceIndex == -1 && braceIndex == -1) {
            return after;
        } else if (spaceIndex == -1) {
            endIndex = braceIndex;
        } else if (braceIndex == -1) {
            endIndex = spaceIndex;
        } else {
            endIndex = Math.min(spaceIndex, braceIndex);
        }
        return after.substring(0, endIndex).trim();
    }

    /**
     * Ana sınıf için bir instance oluşturur. Constructor parametrelerini test sınıfındaki field'lardan alır.
     */
    private Object createMainClassInstance(Class<?> mainClass, Class<?> testClass, Object testInstance, ClassLoader classLoader) {
        try {
            // Önce parametresiz constructor'ı dene
            try {
                Object instance = mainClass.getDeclaredConstructor().newInstance();
                System.out.println("   -> Parametresiz constructor kullanıldı");
                return instance;
            } catch (NoSuchMethodException e) {
                System.out.println("   -> Parametresiz constructor bulunamadı, parametreli constructor aranıyor...");
            }
            
            // Parametreli constructor'ları dene
            java.lang.reflect.Constructor<?>[] constructors = mainClass.getDeclaredConstructors();
            for (java.lang.reflect.Constructor<?> constructor : constructors) {
                Class<?>[] paramTypes = constructor.getParameterTypes();
                if (paramTypes.length == 0) {
                    continue; // Zaten denedik
                }
                
                System.out.println("   -> Constructor bulundu: " + constructor + " (parametre sayısı: " + paramTypes.length + ")");
                
                // Test sınıfındaki field'lardan parametreleri bul
                Object[] params = new Object[paramTypes.length];
                boolean allParamsFound = true;
                
                for (int i = 0; i < paramTypes.length; i++) {
                    Class<?> paramType = paramTypes[i];
                    Object paramValue = findFieldValue(testClass, testInstance, paramType, classLoader);
                    if (paramValue == null) {
                        System.out.println("     -> Parametre " + i + " (" + paramType.getName() + ") bulunamadı");
                        allParamsFound = false;
                        break;
                    }
                    params[i] = paramValue;
                    System.out.println("     -> Parametre " + i + " bulundu: " + paramValue.getClass().getName());
                }
                
                if (allParamsFound) {
                    constructor.setAccessible(true);
                    Object instance = constructor.newInstance(params);
                    System.out.println("   -> Parametreli constructor ile instance oluşturuldu");
                    return instance;
                }
            }
            
            System.err.println("   -> UYARI: Uygun constructor bulunamadı, null döndürülüyor");
            return null;
        } catch (Exception e) {
            System.err.println("   -> HATA: Instance oluşturulurken hata: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Test sınıfındaki field'lardan belirtilen tipte bir değer bulur.
     */
    private Object findFieldValue(Class<?> testClass, Object testInstance, Class<?> targetType, ClassLoader classLoader) {
        try {
            // Test sınıfındaki tüm field'ları kontrol et
            for (Field field : testClass.getDeclaredFields()) {
                if (targetType.isAssignableFrom(field.getType())) {
                    field.setAccessible(true);
                    Object value = field.get(testInstance);
                    if (value != null) {
                        System.out.println("     -> Field'dan değer alındı: " + field.getName());
                        return value;
                    }
                }
            }
            
            // Eğer field'da yoksa, yeni bir instance oluştur (basit tipler için)
            if (!targetType.isPrimitive() && !targetType.getName().startsWith("java.")) {
                try {
                    // Parametresiz constructor ile dene
                    Object instance = targetType.getDeclaredConstructor().newInstance();
                    System.out.println("     -> Yeni instance oluşturuldu: " + targetType.getName());
                    return instance;
                } catch (NoSuchMethodException e) {
                    // Parametresiz constructor yok, null döndür
                    System.out.println("     -> " + targetType.getName() + " için parametresiz constructor yok");
                }
            }
            
            return null;
        } catch (Exception e) {
            System.err.println("     -> Field değeri bulunurken hata: " + e.getMessage());
            return null;
        }
    }

    private File createTempDirectory() throws IOException {
        File temp = new File(System.getProperty("java.io.tmpdir"), "coverage-" + System.nanoTime());
        if (!temp.mkdir()) {
            throw new IOException("Temp klasör oluşturulamadı: " + temp);
        }
        return temp;
    }

    private void compileJavaFiles(File tempDir, File... javaFiles) throws IOException {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new RuntimeException("Java Compiler bulunamadı (JDK kurulu mu?).");
        }
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        try (StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnostics, null, null)) {
            Iterable<? extends JavaFileObject> compilationUnits = fileManager.getJavaFileObjects(javaFiles);

            // JUnit jar'ının yolunu bul
            String junitPath = findJUnitJarPath();
            
            List<String> options = new ArrayList<>();
            options.add("-source");
            options.add("17");
            options.add("-target");
            options.add("17");
            options.add("-d");
            options.add(tempDir.getAbsolutePath());
            options.add("-classpath");
            String classpath = System.getProperty("java.class.path") + 
                       File.pathSeparator + tempDir.getAbsolutePath() + 
                       File.pathSeparator + "/app/lib/junit-4.13.2.jar" +
                       File.pathSeparator + "/app/lib/hamcrest-core-1.3.jar";
            System.out.println("Derleme için classpath: " + classpath);
            options.add(classpath);
            options.add("-Xlint:none");
            options.add("-proc:none");

            JavaCompiler.CompilationTask task = compiler.getTask(
                    null, fileManager, diagnostics, options, null, compilationUnits);

            boolean success = task.call();
            if (!success) {
                List<String> errors = new ArrayList<>();
                for (Diagnostic<?> d : diagnostics.getDiagnostics()) {
                    System.err.println("Diagnostic: " + d.getMessage(null));
                    if (d.getKind() == Diagnostic.Kind.ERROR && 
                        !d.getMessage(null).contains("has private access")) {
                        errors.add(d.toString());
                    }
                }
                
                if (!errors.isEmpty()) {
                    StringBuilder sb = new StringBuilder("Derleme hatası:\n");
                    errors.forEach(error -> sb.append(error).append("\n"));
                    throw new RuntimeException(sb.toString());
                }
            }
        }
    }

    private String findJUnitJarPath() {
        try {
            // JUnit sınıfının lokasyonunu bul
            URL location = Test.class.getProtectionDomain().getCodeSource().getLocation();
            return location.getPath();
        } catch (Exception e) {
            System.err.println("JUnit jar yolu bulunamadı: " + e.getMessage());
            return "";
        }
    }

    private void writeFile(File file, String content) throws IOException {
        // İçeriği olduğu gibi yaz (ekstra import ekleyip package sırasını bozma)
        try (FileWriter fw = new FileWriter(file)) {
            fw.write(content);
        }
    }

    private static class InstrumentingClassLoader extends ClassLoader {
        private final IRuntime runtime;
        private final Instrumenter instrumenter;
        private final File tempDir;

        public InstrumentingClassLoader(ClassLoader parent, IRuntime runtime, File tempDir) {
            super(parent);
            this.runtime = runtime;
            this.instrumenter = new Instrumenter(runtime);
            this.tempDir = tempDir;
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            // JUnit ve Java core sınıflarını normal şekilde yükle
            if (name.startsWith("org.junit.") || 
                name.startsWith("junit.") || 
                name.startsWith("java.") || 
                name.startsWith("javax.") || 
                name.startsWith("sun.") || 
                name.startsWith("org.hamcrest.")) {
                return super.loadClass(name, resolve);
            }

            try {
                // Package yapısına göre class dosyası yolunu oluştur
                String classRelativePath = name.replace('.', '/') + ".class";
                File classFile = new File(tempDir, classRelativePath);
                
                if (!classFile.exists()) {
                    // Eğer dosya tempDir'de yoksa, parent ClassLoader'a bırak
                    return super.loadClass(name, resolve);
                }

                // Class dosyasını oku
                byte[] bytes = Files.readAllBytes(classFile.toPath());
                
                // Instrument et
                byte[] instrumentedBytes = instrumenter.instrument(bytes, name);
                
                // Yeni class'ı tanımla
                Class<?> c = defineClass(name, instrumentedBytes, 0, instrumentedBytes.length);
                if (resolve) {
                    resolveClass(c);
                }
                System.out.println("Sınıf başarıyla yüklendi ve instrument edildi: " + name);
                return c;
            } catch (Exception e) {
                System.err.println("Class yüklenirken hata (" + name + "): " + e.getMessage());
                e.printStackTrace();
                return super.loadClass(name, resolve);
            }
        }
    }
}
