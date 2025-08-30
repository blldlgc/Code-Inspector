# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# JUnit bağımlılıklarını indir ve kopyala
RUN mvn clean package dependency:copy-dependencies -DskipTests -DincludeArtifactIds=junit,hamcrest-core

# Run stage
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Simian JAR dosyasını özel olarak kopyala
COPY src/main/java/com/codeinspector/backend/libs/simian-4.0.0/simian-4.0.0.jar /app/src/main/java/com/codeinspector/backend/libs/simian-4.0.0/
# JAR dosyasına çalıştırma izni ver
RUN chmod +x /app/src/main/java/com/codeinspector/backend/libs/simian-4.0.0/simian-4.0.0.jar

# JUnit JAR'ları için lib klasörünü oluştur
RUN mkdir -p /app/lib

# JUnit JAR'larını build aşamasından kopyala
COPY --from=build /app/target/dependency/junit-4.13.2.jar /app/lib/
COPY --from=build /app/target/dependency/hamcrest-core-1.3.jar /app/lib/

# Çalışma zamanı classpath'e JUnit'i ekle
ENV CLASSPATH=/app/lib/*:${CLASSPATH}

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
