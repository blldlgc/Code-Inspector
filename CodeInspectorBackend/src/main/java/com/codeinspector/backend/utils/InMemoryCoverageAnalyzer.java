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

    public CoverageResult analyzeCoverage(String sourceCode, String testCode) {
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

            // 3) .java dosyalarına yaz
            File sourceFile = new File(tempDir, mainClassName + ".java");
            File testFile   = new File(tempDir, testClassName + ".java");
            writeFile(sourceFile, sourceCode);
            writeFile(testFile, testCode);
            System.out.println("3. Kaynak kodlar dosyalara yazıldı:");
            System.out.println("   - Kaynak dosya: " + sourceFile.getAbsolutePath());
            System.out.println("   - Test dosyası: " + testFile.getAbsolutePath());
            System.out.println("\nKAYNAK KOD:");
            System.out.println(sourceCode);
            System.out.println("\nTEST KODU:");
            System.out.println(testCode);

            // 4) Derleme
            System.out.println("\n4. Derleme başlıyor...");
            compileJavaFiles(tempDir, sourceFile, testFile);
            System.out.println("   Derleme başarılı!");

            // Derleme sonrası kontrol
            File mainClassFile = new File(tempDir, mainClassName + ".class");
            File testClassFile = new File(tempDir, testClassName + ".class");

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

                // 7) Sınıfları yükle
                System.out.println("\n7. Sınıflar yükleniyor...");
                Class<?> mainClass = instrumentingClassLoader.loadClass(mainClassName);
                System.out.println("   Ana sınıf yüklendi: " + mainClass.getName());
                Class<?> testClass = instrumentingClassLoader.loadClass(testClassName);
                System.out.println("   Test sınıfı yüklendi: " + testClass.getName());

                // 8) Test instance
                System.out.println("\n8. Test instance'ı oluşturuluyor...");
                Object testInstance = testClass.getDeclaredConstructor().newInstance();
                System.out.println("   Test instance oluşturuldu: " + testInstance);

                // 9) mainClass'ı test'e enjekte et
                System.out.println("\n9. Ana sınıf instance'ı enjekte ediliyor...");
                Object mainInstance = mainClass.getDeclaredConstructor().newInstance();
                System.out.println("   Ana sınıf instance'ı: " + mainInstance);
                
                for (Field field : testClass.getDeclaredFields()) {
                    System.out.println("   Field inceleniyor: " + field.getName() + " (tip: " + field.getType() + ")");
                    if (field.getType().equals(mainClass)) {
                        System.out.println("   -> Field bulundu, enjekte ediliyor: " + field.getName());
                        field.setAccessible(true);
                        field.set(testInstance, mainInstance);
                    }
                }

                // 10) Test metodlarını çalıştır
                System.out.println("\n10. Test metodları çalıştırılıyor...");
                Method[] methods = testClass.getMethods();
                System.out.println("    Toplam metod sayısı: " + methods.length);
                for (Method method : methods) {
                    System.out.println("    İncelenen metod: " + method.getName());
                    if (method.isAnnotationPresent(Test.class)) {
                        System.out.println("    -> @Test bulundu, çalıştırılıyor: " + method.getName());
                        try {
                            method.invoke(testInstance);
                            System.out.println("       Test başarılı: " + method.getName());
                        } catch (Exception e) {
                            System.err.println("       Test başarısız: " + method.getName());
                            e.printStackTrace();
                        }
                    }
                }

                // 11) Coverage datası
                System.out.println("\n11. Coverage verisi toplanıyor...");
                ExecutionDataStore executionData = new ExecutionDataStore();
                SessionInfoStore sessionInfo = new SessionInfoStore();
                data.collect(executionData, sessionInfo, false);

                // 12) Coverage analizi
                System.out.println("\n12. Coverage analizi yapılıyor...");
                CoverageBuilder coverageBuilder = new CoverageBuilder();
                Analyzer analyzer = new Analyzer(executionData, coverageBuilder);

                byte[] mainClassBytes = Files.readAllBytes(mainClassFile.toPath());
                analyzer.analyzeClass(mainClassBytes, mainClassName);

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

    // Sınıf adını çıkarmak için basit metod
    private String extractClassName(String code) {
        String marker = "public class ";
        int idx = code.indexOf(marker);
        if (idx < 0) {
            throw new RuntimeException("'public class' bulunamadı, sınıf adı tespit edilemiyor.");
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

    // Test sınıfına mainClass enjekte etmek isterseniz
    private void injectMainClassIfNeeded(Object testInstance, Class<?> mainClass) throws Exception {
        Object mainObj = mainClass.getDeclaredConstructor().newInstance();
        for (Field f : testInstance.getClass().getDeclaredFields()) {
            if (f.getType().equals(mainClass)) {
                f.setAccessible(true);
                f.set(testInstance, mainObj);
            }
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
            options.add(System.getProperty("java.class.path") + 
                       File.pathSeparator + tempDir.getAbsolutePath() + 
                       File.pathSeparator + junitPath);
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
        // Test sınıfı için gerekli importları ekle
        if (file.getName().endsWith("Test.java")) {
            content = "import java.io.PrintStream;\n" +
                     "import java.io.OutputStream;\n" +
                     "import java.io.ByteArrayOutputStream;\n" +
                     content;
        }
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
                // Önce .class dosyasını bul
                File classFile = new File(tempDir, name + ".class");
                if (!classFile.exists()) {
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
