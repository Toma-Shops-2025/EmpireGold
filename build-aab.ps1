# Empire Gold - Build signed AAB for Google Play
# Usage: cd Desktop\money-cash ; .\build-aab.ps1

$ProjectPath  = "$env:USERPROFILE\Desktop\money-cash"
$KeystorePath = "C:\Keys\money-cash.jks"
$KeyAlias     = "alias"
$AabPath      = "$ProjectPath\android\app\build\outputs\bundle\release\app-release.aab"
$Password     = "Custom.247"

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Cleaning old build files..."
if (Test-Path $AabPath) { Remove-Item $AabPath -Force }

Step "Switching to project: $ProjectPath"
Set-Location $ProjectPath

Step "npm install"
npm install

Step "Building web app"
npm run build

Step "Regenerating Android launcher icon + splash from resources/"
npm run assets:generate

Step "Capacitor sync (Android)"
if (Test-Path "android/app/src/main/assets/public") {
    Remove-Item "android/app/src/main/assets/public" -Recurse -Force
}
npx cap sync android

Step "Bumping versionCode..."
$gradle = "android/app/build.gradle"
$content = Get-Content $gradle -Raw
if ($content -match 'versionCode\s+(\d+)') {
    $old = [int]$Matches[1]
    $new = $old + 1
    $content = $content -replace "versionCode\s+$old", "versionCode $new"
    Set-Content $gradle $content -NoNewline
    Write-Host "    versionCode: $old -> $new" -ForegroundColor Green
}

Step "Building signed release AAB"
if (Test-Path -Path "$ProjectPath\android\gradlew.bat") {
    Set-Location "$ProjectPath\android"

    # Force stop daemons to prevent file locking
    & .\gradlew.bat --stop

    # Run clean before bundle
    & .\gradlew.bat clean

    $gradleArgs = @(
        "bundleRelease",
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

if (Test-Path $AabPath) {
    Write-Host "`n  SUCCESS" -ForegroundColor Green
    Write-Host "  Signed AAB: $AabPath" -ForegroundColor Green
    Write-Host "  Upload to Play Console -> Production -> Create new release.`n"
    Start-Process explorer.exe "/select,`"$AabPath`""
} else {
    Write-Error "Build finished but AAB not found at $AabPath. Please check for Gradle errors above."
}
