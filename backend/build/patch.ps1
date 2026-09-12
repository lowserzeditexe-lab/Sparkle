param([int]$WithPlugin = 1)

# Spark - installe BDVencord (Vencord + compatibilite plugins BetterDiscord)
# puis depose le plugin AutoQuest. Non interactif.
$ErrorActionPreference = "Continue"

$VencordDir  = Join-Path $env:APPDATA "Vencord"
$PluginsDir  = Join-Path $VencordDir "plugins"
$PluginName  = "AutoQuest.plugin.js"
$CliUrl      = "https://github.com/TheLazySquid/BDVencord/releases/download/installer/BDVencordInstallerCli.exe"
$procNames   = @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")

function Log($m) { Write-Host "[Spark] $m" }

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
New-Item -ItemType Directory -Path $VencordDir -Force | Out-Null

# 1. Fermer Discord
foreach ($p in $procNames) {
    Get-Process -Name $p -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Milliseconds 900

# 2. Telecharger l'installeur CLI BDVencord
$cli = Join-Path $env:TEMP "BDVencordInstallerCli.exe"
try {
    Log "Telechargement de l'installeur BDVencord..."
    Invoke-WebRequest -Uri $CliUrl -OutFile $cli -Headers @{ "User-Agent" = "SparkleInstaller" }
} catch {
    Log "Echec du telechargement de BDVencord : $_"
    exit 1
}

# 3. Installer BDVencord (telecharge le build + patche Discord automatiquement)
try {
    Log "Installation de BDVencord dans Discord..."
    $proc = Start-Process -FilePath $cli -ArgumentList @("-install", "-branch", "auto") -Wait -PassThru -WindowStyle Hidden
    Log "Installeur BDVencord code: $($proc.ExitCode)"
} catch {
    Log "Echec de l'installation de BDVencord : $_"
}

# 4. Deposer le plugin AutoQuest dans le dossier des plugins BetterDiscord
if ($WithPlugin -eq 1) {
    New-Item -ItemType Directory -Path $PluginsDir -Force | Out-Null
    $src = Join-Path $PSScriptRoot "bdPlugins\$PluginName"
    if (-not (Test-Path $src)) { $src = Join-Path $PSScriptRoot $PluginName }
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $PluginsDir $PluginName) -Force
        Log "Plugin AutoQuest depose dans $PluginsDir."
    } else {
        Log "ATTENTION: $PluginName introuvable dans le paquet."
    }
}

# 5. Nettoyage
try { Remove-Item $cli -Force -ErrorAction SilentlyContinue } catch {}
Log "Termine."
exit 0
