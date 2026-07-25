# Empire Gold - Ultra Stable Build Script
$ProjectPath  = "$env:USERPROFILE\Desktop\money-cash"
$KeystorePath = "C:\Keys\money-cash.jks"
$KeyAlias     = "alias"
$ApkPath      = "$ProjectPath\android\app\build\outputs\apk\release\app-release.apk"
$Password     = "Custom.247"

$ErrorActionPreference = "Stop"
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Force Stopping Gradle & Cleaning Caches..."
Set-Location "$ProjectPath\android"
if (Test-Path ".\gradlew.bat") {
    & .\gradlew.bat --stop
}
# Delete local gradle and build folders
if (Test-Path "$ProjectPath\android\.gradle") { Remove-Item -Recurse -Force "$ProjectPath\android\.gradle" }
if (Test-Path "$ProjectPath\android\app\build") { Remove-Item -Recurse -Force "$ProjectPath\android\app\build" }

Step "Building Web App..."
Set-Location $ProjectPath
npm install
npm run build

Step "Syncing Capacitor..."
npx cap sync android

Step "Building Android APK (Release)..."
Set-Location "$ProjectPath\android"
& .\gradlew.bat clean
& .\gradlew.bat assembleRelease "-Pandroid.injected.signing.store.file=$KeystorePath" "-Pandroid.injected.signing.store.password=$Password" "-Pandroid.injected.signing.key.alias=$KeyAlias" "-Pandroid.injected.signing.key.password=$Password" --no-daemon

Set-Location $ProjectPath
if (Test-Path $ApkPath) {
    Write-Host "`n  SUCCESS! APK Ready: $ApkPath" -ForegroundColor Green
    Start-Process explorer.exe "/select,`"$ApkPath`""
}
