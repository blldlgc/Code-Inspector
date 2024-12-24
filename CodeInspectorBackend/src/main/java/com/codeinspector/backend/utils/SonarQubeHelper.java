package com.codeinspector.backend.utils;

import java.io.*;
import java.nio.file.*;

public class SonarQubeHelper {
    public File createProjectFile(String sourceCode, String fileName) {
        try {
            // Temp klasöründe çalışma klasörü oluştur
            File tempDir = new File(System.getProperty("java.io.tmpdir"), "project_sources");
            if (!tempDir.exists()) {
                tempDir.mkdirs();
            }

            // .java uzantılı dosyayı oluştur
            File javaFile = new File(tempDir, fileName + ".java");
            Files.writeString(javaFile.toPath(), sourceCode);

            // Klasörün path'ini döndür
            System.out.println("Project folder created at: " + tempDir.getAbsolutePath());

            return tempDir; // Return the directory, not the file
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to create project file", e);
        }
    }
}
