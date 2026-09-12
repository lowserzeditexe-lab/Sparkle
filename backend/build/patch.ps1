param([int]$WithPlugin = 1)

# Spark - patch headless : injecte Vencord dans Discord + active BdCompat/AutoQuest.
$ErrorActionPreference = "Continue"

$VencordDir   = Join-Path $env:APPDATA "Vencord"
$DistDst      = Join-Path $VencordDir "dist"
$SettingsDir  = Join-Path $VencordDir "settings"
$SettingsFile = Join-Path $SettingsDir "settings.json"
$PluginName   = "AutoQuest.plugin.js"
$flavors = @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")
$procNames = @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")

function Log($m) { Write-Host "[Spark] $m" }

# 1. Fermer Discord
foreach ($p in $procNames) {
    Get-Process -Name $p -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Milliseconds 900

# 1.5 Télécharger le build Vencord (dist) depuis la dernière release GitHub officielle
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
New-Item -ItemType Directory -Path $DistDst -Force | Out-Null
$wantFiles = @("patcher.js","patcher.js.map","preload.js","preload.js.map","renderer.js","renderer.js.map","renderer.css","renderer.css.map")
try {
    Log "Telechargement de Vencord..."
    $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/Vendicated/Vencord/releases/latest" -Headers @{ "User-Agent" = "SparkleInstaller"; "Accept" = "application/vnd.github+json" }
    foreach ($asset in $rel.assets) {
        if ($wantFiles -contains $asset.name) {
            $dest = Join-Path $DistDst $asset.name
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $dest -Headers @{ "User-Agent" = "SparkleInstaller" }
        }
    }
    if (Test-Path (Join-Path $DistDst "patcher.js")) { Log "Vencord telecharge." }
    else { Log "ATTENTION: patcher.js manquant apres telechargement." }
} catch {
    Log "Echec du telechargement de Vencord : $_"
}

# 2. Patch chaque installation Discord
$patcherPath = (Join-Path $DistDst "patcher.js") -replace '\\', '/'
$indexJs = "require(`"$patcherPath`");`nrequire(`"../_app.asar`");"
$anyPatched = $false

foreach ($flavor in $flavors) {
    $base = Join-Path $env:LOCALAPPDATA $flavor
    if (-not (Test-Path $base)) { continue }
    $appDirs = Get-ChildItem -Path $base -Directory -Filter "app-*" -ErrorAction SilentlyContinue
    foreach ($appDir in $appDirs) {
        $resources = Join-Path $appDir.FullName "resources"
        if (-not (Test-Path $resources)) { continue }
        $asar   = Join-Path $resources "app.asar"
        $backup = Join-Path $resources "_app.asar"
        $appFolder = Join-Path $resources "app"

        if (-not (Test-Path $backup)) {
            if (Test-Path $asar -PathType Leaf) {
                Move-Item -Path $asar -Destination $backup -Force
            } else { continue }
        }
        $unpacked = Join-Path $resources "app.asar.unpacked"
        $unpackedBak = Join-Path $resources "_app.asar.unpacked"
        if ((Test-Path $unpacked) -and (-not (Test-Path $unpackedBak))) {
            Move-Item -Path $unpacked -Destination $unpackedBak -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path $appFolder) { Remove-Item $appFolder -Recurse -Force }
        New-Item -ItemType Directory -Path $appFolder -Force | Out-Null
        Set-Content -Path (Join-Path $appFolder "index.js") -Value $indexJs -Encoding UTF8
        Set-Content -Path (Join-Path $appFolder "package.json") -Value '{ "name": "discord", "main": "index.js" }' -Encoding UTF8
        Log "$flavor $($appDir.Name) patche."
        $anyPatched = $true
    }
}
if (-not $anyPatched) { Log "Aucune installation Discord trouvee." }

# 3. settings.json : active BdCompat (+ AutoQuest si demande)
New-Item -ItemType Directory -Path $SettingsDir -Force | Out-Null
$obj = $null
if (Test-Path $SettingsFile) { try { $obj = Get-Content $SettingsFile -Raw | ConvertFrom-Json } catch { $obj = $null } }
if ($null -eq $obj) { $obj = [PSCustomObject]@{} }

if (-not ($obj.PSObject.Properties.Name -contains "plugins")) {
    $obj | Add-Member -NotePropertyName "plugins" -NotePropertyValue ([PSCustomObject]@{})
}
if (-not ($obj.plugins.PSObject.Properties.Name -contains "BdCompat")) {
    $obj.plugins | Add-Member -NotePropertyName "BdCompat" -NotePropertyValue ([PSCustomObject]@{})
}
$bd = $obj.plugins.BdCompat
if (-not ($bd.PSObject.Properties.Name -contains "enabled")) { $bd | Add-Member -NotePropertyName "enabled" -NotePropertyValue $true }
else { $bd.enabled = $true }

if ($WithPlugin -eq 1) {
    $list = @()
    if (($bd.PSObject.Properties.Name -contains "enabledBdPlugins") -and $bd.enabledBdPlugins) { $list = @($bd.enabledBdPlugins) }
    if ($list -notcontains $PluginName) { $list += $PluginName }
    if ($bd.PSObject.Properties.Name -contains "enabledBdPlugins") { $bd.enabledBdPlugins = $list }
    else { $bd | Add-Member -NotePropertyName "enabledBdPlugins" -NotePropertyValue $list }
}
($obj | ConvertTo-Json -Depth 12) | Set-Content -Path $SettingsFile -Encoding UTF8
Log "settings.json mis a jour."
exit 0
