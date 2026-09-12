# Spark - desinstallation : retire BDVencord de Discord et restaure le client.
$ErrorActionPreference = "Continue"
$flavors = @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")
$CliUrl  = "https://github.com/TheLazySquid/BDVencord/releases/download/installer/BDVencordInstallerCli.exe"

function Log($m) { Write-Host "[Spark] $m" }

foreach ($p in $flavors) { Get-Process -Name $p -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 800

# 1. Desinstallation propre via le CLI BDVencord
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$cli = Join-Path $env:TEMP "BDVencordInstallerCli.exe"
try {
    Invoke-WebRequest -Uri $CliUrl -OutFile $cli -Headers @{ "User-Agent" = "SparkleInstaller" }
    Start-Process -FilePath $cli -ArgumentList @("-uninstall", "-branch", "auto") -Wait -WindowStyle Hidden
    Remove-Item $cli -Force -ErrorAction SilentlyContinue
    Log "BDVencord desinstalle via CLI."
} catch {
    Log "CLI indisponible, restauration manuelle : $_"
}

# 2. Restauration manuelle de secours
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
Log "Discord restaure."
exit 0
