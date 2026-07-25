# Empire Gold - Ultra Stable Build Script (Direct Path Edition)
$ProjectPath  = "$env:USERPROFILE\Desktop\money-cash"
$KeystorePath = "C:\Keys\money-cash.jks"
$KeyAlias     = "alias"
$ApkPath      = "$ProjectPath\android\app\build\outputs\apk\release\app-release.apk"
$Password     = "Custom.247"

# Move the cache to a very short path to avoid Windows path limits
$env:GRADLE_USER_HOME = "C:\gradle_cache"

$ErrorActionPreference = "Stop"
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Ensuring Clean Cache Directory..."
if (!(Test-Path "C:\gradle_cache")) { New-Item -ItemType Directory -Path "C:\gradle_cache" -Force }

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

Step "Building Android APK (Direct Path Build)..."
Set-Location "$ProjectPath\android"
# Added --refresh-dependencies and --no-daemon for maximum stability
& .\gradlew.bat clean
& .\gradlew.bat assembleRelease "-Pandroid.injected.signing.store.file=$KeystorePath" "-Pandroid.injected.signing.store.password=$Password" "-Pandroid.injected.signing.key.alias=$KeyAlias" "-Pandroid.injected.signing.key.password=$Password" --no-daemon --refresh-dependencies

Set-Location $ProjectPath
if (Test-Path $ApkPath) {
    Write-Host "`n  SUCCESS! APK Ready: $ApkPath" -ForegroundColor Green
    Start-Process explorer.exe "/select,`"$ApkPath`""
}
