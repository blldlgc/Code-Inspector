package com.codeinspector.backend.service;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/**
 * Java AST analizi ile sınıf ve metot bağımlılıklarını tespit eden servis.
 * JavaParser kullanarak detaylı bağımlılık analizi yapar.
 */
@Service
public class JavaASTDependencyAnalyzer {
    private static final Logger logger = LoggerFactory.getLogger(JavaASTDependencyAnalyzer.class);

    /**
     * Bir Java dosyasındaki sınıf bağımlılıklarını analiz eder.
     * Import'lar, new Object() ifadeleri, method call scope'ları ve type kullanımlarını tespit eder.
     *
     * @param javaFile Analiz edilecek Java dosyası
     * @return className -> Set<dependencyClassNames> map'i
     */
    public Map<String, Set<String>> analyzeClassDependencies(File javaFile) {
        Map<String, Set<String>> dependencies = new HashMap<>();
        logger.debug("Analyzing class dependencies in file: {}", javaFile.getAbsolutePath());

        try (FileInputStream in = new FileInputStream(javaFile)) {
            CompilationUnit cu = StaticJavaParser.parse(in);

            Optional<ClassOrInterfaceDeclaration> classDecl = cu.findFirst(ClassOrInterfaceDeclaration.class);
            if (classDecl.isPresent()) {
                String className = classDecl.get().getNameAsString();
                Set<String> classDeps = new HashSet<>();

                // Import ifadelerini analiz et - hem full name hem simple name ekle
                for (ImportDeclaration importDecl : cu.getImports()) {
                    String importName = importDecl.getNameAsString();
                    // Java standart kütüphanelerini ve Spring/Hibernate gibi framework'leri hariç tut
                    if (!importName.startsWith("java.") && 
                        !importName.startsWith("javax.") &&
                        !importName.startsWith("org.springframework.") &&
                        !importName.startsWith("org.hibernate.") &&
                        !importName.startsWith("com.sun.") &&
                        !importName.startsWith("sun.")) {
                        // Full qualified name'i ekle
                        classDeps.add(importName);
                        // Simple name'i de ekle (eşleştirme için)
                        String importedClass = importName.substring(importName.lastIndexOf('.') + 1);
                        classDeps.add(importedClass);
                        logger.debug("Added import dependency: {} (full: {}, simple: {})", importName, importName, importedClass);
                    }
                }

                // Sınıf içindeki bağımlılıkları analiz et - new Object() ifadeleri
                cu.findAll(ObjectCreationExpr.class).forEach(expr -> {
                    if (expr.getType().isClassOrInterfaceType()) {
                        com.github.javaparser.ast.type.ClassOrInterfaceType type = expr.getType().asClassOrInterfaceType();
                        String typeName = type.getNameAsString();
                        classDeps.add(typeName);
                        
                        // Scope varsa (qualified name), onu da ekle
                        type.getScope().ifPresent(scope -> {
                            String qualifiedName = scope.getNameAsString() + "." + typeName;
                            classDeps.add(qualifiedName);
                            logger.debug("Added ObjectCreation dependency: {} (qualified: {})", typeName, qualifiedName);
                        });
                    }
                });

                // Method call scope'larını analiz et
                cu.findAll(MethodCallExpr.class).forEach(expr -> {
                    expr.getScope().ifPresent(scope -> {
                        if (scope instanceof NameExpr) {
                            String scopeName = ((NameExpr) scope).getNameAsString();
                            classDeps.add(scopeName);
                        } else if (scope instanceof FieldAccessExpr) {
                            // obj.method() durumunda obj'in tipini bulmaya çalış
                            FieldAccessExpr fieldAccess = (FieldAccessExpr) scope;
                            // FieldAccessExpr.getScope() Expression döndürür (null olabilir)
                            Expression innerScope = fieldAccess.getScope();
                            if (innerScope != null && innerScope instanceof NameExpr) {
                                String innerScopeName = ((NameExpr) innerScope).getNameAsString();
                                classDeps.add(innerScopeName);
                            }
                        }
                    });
                });

                // ClassOrInterfaceType kullanımlarını analiz et (field tipleri, parametre tipleri vb.)
                cu.findAll(ClassOrInterfaceType.class).forEach(type -> {
                    String typeName = type.getNameAsString();
                    // Primitive tipleri ve standart kütüphaneleri hariç tut
                    if (!isPrimitiveOrStandardType(typeName)) {
                        classDeps.add(typeName);
                        
                        // Scope varsa (qualified name), onu da ekle
                        type.getScope().ifPresent(scope -> {
                            String qualifiedName = scope.getNameAsString() + "." + typeName;
                            classDeps.add(qualifiedName);
                        });
                    }
                });

                dependencies.put(className, classDeps);
                logger.info("Found {} dependencies for class {}: {}", classDeps.size(), className, classDeps);
            }
        } catch (Exception e) {
            logger.warn("Error analyzing class dependencies in file {}: {}", javaFile.getAbsolutePath(), e.getMessage());
        }

        return dependencies;
    }

    /**
     * Bir Java dosyasındaki metot bağımlılıklarını analiz eder.
     * Metot içindeki çağrıları, if-else, loop, switch içindeki çağrıları tespit eder.
     *
     * @param javaFile Analiz edilecek Java dosyası
     * @return className -> (methodName -> Set<calledMethodNames>) map'i
     */
    public Map<String, Map<String, Set<String>>> analyzeMethodDependencies(File javaFile) {
        Map<String, Map<String, Set<String>>> methodDependencies = new HashMap<>();
        logger.debug("Analyzing method dependencies in file: {}", javaFile.getAbsolutePath());

        try (FileInputStream in = new FileInputStream(javaFile)) {
            CompilationUnit cu = StaticJavaParser.parse(in);

            Optional<ClassOrInterfaceDeclaration> classDecl = cu.findFirst(ClassOrInterfaceDeclaration.class);
            if (classDecl.isPresent()) {
                String className = classDecl.get().getNameAsString();
                Map<String, Set<String>> classMethodDeps = new HashMap<>();

                // Her metodu analiz et
                for (MethodDeclaration method : classDecl.get().getMethods()) {
                    String methodName = method.getNameAsString();
                    Set<String> deps = new HashSet<>();

                    // Metot çağrılarını bul
                    method.findAll(MethodCallExpr.class).forEach(expr -> {
                        String calledMethod = expr.getNameAsString();
                        deps.add(calledMethod);

                        // Metot çağrısının scope'unu kontrol et
                        expr.getScope().ifPresent(scope -> {
                            if (scope instanceof NameExpr) {
                                String scopeName = ((NameExpr) scope).getNameAsString();
                                deps.add(scopeName + "." + calledMethod);
                            } else if (scope instanceof FieldAccessExpr) {
                                // obj.method() durumunda
                                FieldAccessExpr fieldAccess = (FieldAccessExpr) scope;
                                String fieldName = fieldAccess.getNameAsString();
                                deps.add(fieldName + "." + calledMethod);
                            }
                        });
                    });

                    // If-else bloklarını analiz et
                    method.findAll(IfStmt.class).forEach(ifStmt -> {
                        // If koşulundaki metot çağrılarını bul
                        ifStmt.getCondition().findAll(MethodCallExpr.class).forEach(expr -> {
                            deps.add(expr.getNameAsString());
                        });

                        // Then bloğundaki metot çağrılarını bul
                        ifStmt.getThenStmt().findAll(MethodCallExpr.class).forEach(expr -> {
                            deps.add(expr.getNameAsString());
                        });

                        // Else bloğundaki metot çağrılarını bul
                        ifStmt.getElseStmt().ifPresent(elseStmt -> {
                            elseStmt.findAll(MethodCallExpr.class).forEach(expr -> {
                                deps.add(expr.getNameAsString());
                            });
                        });
                    });

                    // While döngülerini analiz et
                    method.findAll(WhileStmt.class).forEach(whileStmt -> {
                        whileStmt.getBody().findAll(MethodCallExpr.class).forEach(expr -> {
                            deps.add(expr.getNameAsString());
                        });
                    });

                    // For döngülerini analiz et
                    method.findAll(ForStmt.class).forEach(forStmt -> {
                        forStmt.getBody().findAll(MethodCallExpr.class).forEach(expr -> {
                            deps.add(expr.getNameAsString());
                        });
                    });

                    // ForEach döngülerini analiz et
                    method.findAll(ForEachStmt.class).forEach(forEachStmt -> {
                        forEachStmt.getBody().findAll(MethodCallExpr.class).forEach(expr -> {
                            deps.add(expr.getNameAsString());
                        });
                    });

                    // Switch ifadelerini analiz et
                    method.findAll(SwitchStmt.class).forEach(switchStmt -> {
                        switchStmt.getEntries().forEach(entry -> {
                            entry.findAll(MethodCallExpr.class).forEach(expr -> {
                                deps.add(expr.getNameAsString());
                            });
                        });
                    });

                    if (!deps.isEmpty()) {
                        classMethodDeps.put(methodName, deps);
                        logger.debug("Found {} method dependencies for {}.{}", deps.size(), className, methodName);
                    }
                }

                if (!classMethodDeps.isEmpty()) {
                    methodDependencies.put(className, classMethodDeps);
                }
            }
        } catch (Exception e) {
            logger.warn("Error analyzing method dependencies in file {}: {}", javaFile.getAbsolutePath(), e.getMessage());
        }

        return methodDependencies;
    }

    /**
     * Bir dizindeki tüm Java dosyalarını recursive olarak analiz eder.
     *
     * @param directory Analiz edilecek dizin
     * @return className -> Set<dependencyClassNames> map'i
     */
    public Map<String, Set<String>> analyzeDirectoryDependencies(Path directory) {
        Map<String, Set<String>> dependencies = new HashMap<>();
        logger.debug("Analyzing dependencies in directory: {}", directory.toAbsolutePath());

        try {
            Files.walk(directory)
                    .filter(p -> p.toString().endsWith(".java"))
                    .limit(2000) // Güvenlik sınırı
                    .forEach(path -> {
                        try {
                            File javaFile = path.toFile();
                            dependencies.putAll(analyzeClassDependencies(javaFile));
                        } catch (Exception e) {
                            logger.warn("Error analyzing file {}: {}", path, e.getMessage());
                        }
                    });
        } catch (IOException e) {
            logger.error("Error walking directory {}: {}", directory, e.getMessage());
        }

        return dependencies;
    }

    /**
     * Bir dizindeki tüm Java dosyalarının metot bağımlılıklarını recursive olarak analiz eder.
     *
     * @param directory Analiz edilecek dizin
     * @return className -> (methodName -> Set<calledMethodNames>) map'i
     */
    public Map<String, Map<String, Set<String>>> analyzeDirectoryMethodDependencies(Path directory) {
        Map<String, Map<String, Set<String>>> methodDependencies = new HashMap<>();
        logger.debug("Analyzing method dependencies in directory: {}", directory.toAbsolutePath());

        try {
            Files.walk(directory)
                    .filter(p -> p.toString().endsWith(".java"))
                    .limit(2000) // Güvenlik sınırı
                    .forEach(path -> {
                        try {
                            File javaFile = path.toFile();
                            methodDependencies.putAll(analyzeMethodDependencies(javaFile));
                        } catch (Exception e) {
                            logger.warn("Error analyzing method dependencies in file {}: {}", path, e.getMessage());
                        }
                    });
        } catch (IOException e) {
            logger.error("Error walking directory {}: {}", directory, e.getMessage());
        }

        return methodDependencies;
    }

    /**
     * Bir tipin primitive veya standart Java kütüphanesi tipi olup olmadığını kontrol eder.
     */
    private boolean isPrimitiveOrStandardType(String typeName) {
        return typeName.equals("String") ||
               typeName.equals("Integer") ||
               typeName.equals("Long") ||
               typeName.equals("Double") ||
               typeName.equals("Float") ||
               typeName.equals("Boolean") ||
               typeName.equals("Byte") ||
               typeName.equals("Short") ||
               typeName.equals("Character") ||
               typeName.equals("Object") ||
               typeName.equals("List") ||
               typeName.equals("Map") ||
               typeName.equals("Set") ||
               typeName.equals("Collection");
    }
}

