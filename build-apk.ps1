# Empire Gold - Build signed APK for Testing
# Usage: cd Desktop\money-cash ; .\build-apk.ps1

$ProjectPath  = "$env:USERPROFILE\Desktop\money-cash"
$KeystorePath = "C:\Keys\money-cash.jks"
$KeyAlias     = "alias"
$ApkPath      = "$ProjectPath\android\app\build\outputs\apk\release\app-release.apk"
$Password     = "Custom.247"

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Cleaning old build files..."
if (Test-Path $ApkPath) { Remove-Item $ApkPath -Force }

Step "Switching to project: $ProjectPath"
Set-Location $ProjectPath

Step "npm install"
npm install

Step "Building web app"
npm run build

Step "Capacitor sync (Android)"
npx cap sync android

Step "Building signed release APK"
if (Test-Path -Path "$ProjectPath\android\gradlew.bat") {
    Set-Location "$ProjectPath\android"

    # Force stop daemons to prevent file locking
    & .\gradlew.bat --stop

    # Run clean before assemble
    & .\gradlew.bat clean

    $gradleArgs = @(
        "assembleRelease",
        "-Pandroid.injected.signing.store.file=$KeystorePath",
        "-Pandroid.injected.signing.store.password=$Password",
        "-Pandroid.injected.signing.key.alias=$KeyAlias",
        "-Pandroid.injected.signing.key.password=$Password"
    )
    & .\gradlew.bat @gradleArgs
} else {
    Write-Error "gradlew.bat not found."
}

Set-Location $ProjectPath

if (Test-Path $ApkPath) {
    $time = (Get-Item $ApkPath).LastWriteTime
    Write-Host "`n  SUCCESS" -ForegroundColor Green
    Write-Host "  Signed APK: $ApkPath" -ForegroundColor Green
    Write-Host "  Timestamp: $time" -ForegroundColor Yellow
    Write-Host "  Send this file to your phone to test the final version.`n"
    Start-Process explorer.exe "/select,`"$ApkPath`""
} else {
    Write-Error "Build finished but APK not found at $ApkPath. Please check for Gradle errors above."
}
