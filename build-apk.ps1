# Empire Gold - Ultra Stable Build Script (Local Cache Edition)
$ProjectPath  = "$env:USERPROFILE\Desktop\money-cash"
$KeystorePath = "C:\Keys\money-cash.jks"
$KeyAlias     = "alias"
$ApkPath      = "$ProjectPath\android\app\build\outputs\apk\release\app-release.apk"
$Password     = "Custom.247"

# This bypasses the corrupted global cache by creating a local one
$env:GRADLE_USER_HOME = "$ProjectPath\android\.gradle_home"

$ErrorActionPreference = "Stop"
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Ensuring Local Build Environment..."
if (!(Test-Path $env:GRADLE_USER_HOME)) { New-Item -ItemType Directory -Path $env:GRADLE_USER_HOME -Force }

Step "Force Stopping Gradle..."
Set-Location "$ProjectPath\android"
if (Test-Path ".\gradlew.bat") {
    & .\gradlew.bat --stop
}

Step "Building Web App..."
Set-Location $ProjectPath
npm install
npm run build

Step "Syncing Capacitor..."
npx cap sync android

Step "Building Android APK (Isolated Build)..."
Set-Location "$ProjectPath\android"
& .\gradlew.bat clean
& .\gradlew.bat assembleRelease "-Pandroid.injected.signing.store.file=$KeystorePath" "-Pandroid.injected.signing.store.password=$Password" "-Pandroid.injected.signing.key.alias=$KeyAlias" "-Pandroid.injected.signing.key.password=$Password" --no-daemon

Set-Location $ProjectPath
if (Test-Path $ApkPath) {
    Write-Host "`n  SUCCESS! APK Ready: $ApkPath" -ForegroundColor Green
    Start-Process explorer.exe "/select,`"$ApkPath`""
}
