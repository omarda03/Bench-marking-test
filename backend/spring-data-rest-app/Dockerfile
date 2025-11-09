FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -q -DskipTests clean package

FROM eclipse-temurin:17-jre

WORKDIR /app

ENV JAVA_OPTS=""

COPY --from=build /app/target/rest-benchmark-spring-data-rest-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8083

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

