# Money Cash - Build signed APK for Production Testing
$ProjectPath  = "$env:USERPROFILE\Desktop\money-cash"
$KeystorePath = "C:\Keys\money-cash.jks"
$KeyAlias     = "alias"
$ApkPath      = "$ProjectPath\android\app\build\outputs\apk\release\app-release.apk"
$Password     = "Custom.247"

$ErrorActionPreference = "Stop"
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Cleaning previous builds..."
if (Test-Path $ApkPath) { Remove-Item $ApkPath -Force }

Step "Building Web App..."
Set-Location $ProjectPath
npm install
npm run build

Step "Syncing Capacitor..."
npx cap sync android

Step "Building Android APK..."
Set-Location "$ProjectPath\android"
& .\gradlew.bat clean
& .\gradlew.bat assembleRelease "-Pandroid.injected.signing.store.file=$KeystorePath" "-Pandroid.injected.signing.store.password=$Password" "-Pandroid.injected.signing.key.alias=$KeyAlias" "-Pandroid.injected.signing.key.password=$Password"

Set-Location $ProjectPath
if (Test-Path $ApkPath) {
    Write-Host "`n  SUCCESS! APK Ready: $ApkPath" -ForegroundColor Green
    Start-Process explorer.exe "/select,`"$ApkPath`""
}
