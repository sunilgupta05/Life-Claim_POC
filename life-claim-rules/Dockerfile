# syntax=docker/dockerfile:1
# Life Claims rules engine (roadmap 4.2). Java 17 / Spring Boot 3.2 / Drools.
# Multi-stage: build the fat JAR with Maven, then run it on a slim JRE.

# ---- build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Cache dependencies first (only re-downloads when pom.xml changes). Non-fatal:
# go-offline can't always resolve every Drools plugin, and `package` below fetches
# whatever is missing — so a partial cache warm-up must not break the build.
COPY pom.xml .
# maven.test.skip=true skips test COMPILATION too, so test-only deps (mockito /
# byte-buddy etc.) are never resolved — avoids fetching them for a runtime image.
RUN mvn -B -Dmaven.test.skip=true dependency:go-offline || true
COPY src ./src
RUN mvn -B -Dmaven.test.skip=true clean package

# ---- runtime ----
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
# Non-root for defense-in-depth.
RUN addgroup -S app && adduser -S app -G app
# Spring Boot repackaged fat JAR (excludes the *.jar.original).
COPY --from=build /app/target/life-claim-rules-*.jar app.jar
RUN chown -R app:app /app
USER app
EXPOSE 8095
# /api/health is open (ApiKeyInterceptor only guards /api/rules/**).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8095/api/health >/dev/null 2>&1 || exit 1
# Container-friendly JVM defaults; override with JAVA_OPTS.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
