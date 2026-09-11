# Spark - désinstallation : restaure Discord.
$ErrorActionPreference = "Continue"
$flavors = @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")
foreach ($p in $flavors) { Get-Process -Name $p -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 800

foreach ($flavor in $flavors) {
    $base = Join-Path $env:LOCALAPPDATA $flavor
    if (-not (Test-Path $base)) { continue }
    foreach ($appDir in (Get-ChildItem -Path $base -Directory -Filter "app-*" -ErrorAction SilentlyContinue)) {
        $resources = Join-Path $appDir.FullName "resources"
        $backup = Join-Path $resources "_app.asar"
        $asar   = Join-Path $resources "app.asar"
        $appFolder = Join-Path $resources "app"
        if (Test-Path $appFolder) { Remove-Item $appFolder -Recurse -Force -ErrorAction SilentlyContinue }
        if ((Test-Path $backup) -and (-not (Test-Path $asar))) { Move-Item -Path $backup -Destination $asar -Force -ErrorAction SilentlyContinue }
        $unpackedBak = Join-Path $resources "_app.asar.unpacked"
        $unpacked = Join-Path $resources "app.asar.unpacked"
        if ((Test-Path $unpackedBak) -and (-not (Test-Path $unpacked))) { Move-Item -Path $unpackedBak -Destination $unpacked -Force -ErrorAction SilentlyContinue }
    }
}
Write-Host "[Spark] Discord restaure."
exit 0
