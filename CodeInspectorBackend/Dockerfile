# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Simian JAR dosyasını özel olarak kopyala
COPY src/main/java/com/codeinspector/backend/libs/simian-4.0.0/simian-4.0.0.jar /app/src/main/java/com/codeinspector/backend/libs/simian-4.0.0/
# JAR dosyasına çalıştırma izni ver
RUN chmod +x /app/src/main/java/com/codeinspector/backend/libs/simian-4.0.0/simian-4.0.0.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
