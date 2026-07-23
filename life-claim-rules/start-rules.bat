@echo off
cd /d "%~dp0"
if not exist "target\life-claim-rules-0.0.1-SNAPSHOT.jar" (
  echo Building life-claim-rules...
  call ".tools\apache-maven-3.9.6\bin\mvn.cmd" -q package -DskipTests
  if errorlevel 1 exit /b 1
)
echo Starting life-claim-rules on port 8095...
java -jar target\life-claim-rules-0.0.1-SNAPSHOT.jar
