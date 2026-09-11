<#
    Vencord BdCompat + AutoQuest - Installeur Windows
    -------------------------------------------------
    - Injecte Vencord (build BdCompat) dans Discord
    - Depose le plugin AutoQuest dans %APPDATA%\Vencord\bdPlugins
    - Active BdCompat et AutoQuest par defaut
    Genere par le portail d'installation.
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# ---- Charge la configuration (options choisies dans le portail) ----
$Config = @{
    installAutoQuest = $true
    enableByDefault  = $true
    closeDiscord     = $true
    targets          = @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")
}
$cfgPath = Join-Path $ScriptDir "config.json"
if (Test-Path $cfgPath) {
    try {
        $loaded = Get-Content $cfgPath -Raw | ConvertFrom-Json
        foreach ($k in @("installAutoQuest", "enableByDefault", "closeDiscord")) {
            if ($null -ne $loaded.$k) { $Config[$k] = $loaded.$k }
        }
        if ($loaded.targets) { $Config.targets = @($loaded.targets) }
    } catch {}
}

$VencordDir   = Join-Path $env:APPDATA "Vencord"
$DistSrc      = Join-Path $ScriptDir "dist"
$DistDst      = Join-Path $VencordDir "dist"
$BdPluginsDir = Join-Path $VencordDir "bdPlugins"
$SettingsDir  = Join-Path $VencordDir "settings"
$SettingsFile = Join-Path $SettingsDir "settings.json"
$PluginSrc    = Join-Path $ScriptDir "AutoQuest.plugin.js"
$PluginName   = "AutoQuest.plugin.js"

# ============================================================
#  Logique d'installation
# ============================================================
function Write-Log {
    param([string]$Msg, [string]$Level = "info")
    $ts = (Get-Date).ToString("HH:mm:ss")
    $line = "[$ts] $Msg"
    if ($global:LogBox) {
        $color = switch ($Level) {
            "ok"   { [System.Drawing.Color]::FromArgb(120, 235, 160) }
            "warn" { [System.Drawing.Color]::FromArgb(255, 205, 100) }
            "err"  { [System.Drawing.Color]::FromArgb(255, 120, 120) }
            default { [System.Drawing.Color]::FromArgb(190, 195, 220) }
        }
        $global:LogBox.SelectionStart = $global:LogBox.TextLength
        $global:LogBox.SelectionColor = $color
        $global:LogBox.AppendText($line + "`n")
        $global:LogBox.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    } else {
        Write-Host $line
    }
}

function Stop-DiscordProcesses {
    param([string[]]$Flavors)
    foreach ($f in $Flavors) {
        $procs = Get-Process -Name $f -ErrorAction SilentlyContinue
        if ($procs) {
            Write-Log "Fermeture de $f..." "warn"
            $procs | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 800
        }
    }
}

function Patch-Discord {
    param([string]$BaseDir, [string]$Flavor)
    if (-not (Test-Path $BaseDir)) {
        Write-Log "$Flavor introuvable, ignore." "warn"
        return $false
    }
    $appDirs = Get-ChildItem -Path $BaseDir -Directory -Filter "app-*" -ErrorAction SilentlyContinue |
               Sort-Object Name -Descending
    if (-not $appDirs) {
        Write-Log "$Flavor : aucune version installee." "warn"
        return $false
    }
    $patched = $false
    foreach ($appDir in $appDirs) {
        $resources = Join-Path $appDir.FullName "resources"
        if (-not (Test-Path $resources)) { continue }

        $asar   = Join-Path $resources "app.asar"
        $backup = Join-Path $resources "_app.asar"
        $appFolder = Join-Path $resources "app"

        # Rename original app.asar -> _app.asar (idempotent)
        if (-not (Test-Path $backup)) {
            if (Test-Path $asar -PathType Leaf) {
                Move-Item -Path $asar -Destination $backup -Force
            } else {
                Write-Log "$Flavor $($appDir.Name) : app.asar absent, ignore." "warn"
                continue
            }
        }
        # unpacked resources
        $unpacked = Join-Path $resources "app.asar.unpacked"
        $unpackedBak = Join-Path $resources "_app.asar.unpacked"
        if ((Test-Path $unpacked) -and (-not (Test-Path $unpackedBak))) {
            Move-Item -Path $unpacked -Destination $unpackedBak -Force -ErrorAction SilentlyContinue
        }

        # Create shim app folder
        if (Test-Path $appFolder) { Remove-Item $appFolder -Recurse -Force }
        New-Item -ItemType Directory -Path $appFolder -Force | Out-Null

        $patcherPath = (Join-Path $DistDst "patcher.js") -replace '\\', '/'
        $indexJs = "require(`"$patcherPath`");`nrequire(`"../_app.asar`");"
        Set-Content -Path (Join-Path $appFolder "index.js") -Value $indexJs -Encoding UTF8
        Set-Content -Path (Join-Path $appFolder "package.json") -Value '{ "name": "discord", "main": "index.js" }' -Encoding UTF8

        Write-Log "$Flavor $($appDir.Name) : Vencord injecte." "ok"
        $patched = $true
    }
    return $patched
}

function Ensure-Settings {
    New-Item -ItemType Directory -Path $SettingsDir -Force | Out-Null
    $obj = $null
    if (Test-Path $SettingsFile) {
        try { $obj = Get-Content $SettingsFile -Raw | ConvertFrom-Json } catch { $obj = $null }
    }
    if ($null -eq $obj) { $obj = [PSCustomObject]@{} }

    if (-not ($obj.PSObject.Properties.Name -contains "plugins")) {
        $obj | Add-Member -NotePropertyName "plugins" -NotePropertyValue ([PSCustomObject]@{})
    }
    if (-not ($obj.plugins.PSObject.Properties.Name -contains "BdCompat")) {
        $obj.plugins | Add-Member -NotePropertyName "BdCompat" -NotePropertyValue ([PSCustomObject]@{})
    }
    $bd = $obj.plugins.BdCompat
    if (-not ($bd.PSObject.Properties.Name -contains "enabled")) {
        $bd | Add-Member -NotePropertyName "enabled" -NotePropertyValue $true
    } else { $bd.enabled = $true }

    if ($Config.installAutoQuest -and $Config.enableByDefault) {
        $list = @()
        if ($bd.PSObject.Properties.Name -contains "enabledBdPlugins" -and $bd.enabledBdPlugins) {
            $list = @($bd.enabledBdPlugins)
        }
        if ($list -notcontains $PluginName) { $list += $PluginName }
        if ($bd.PSObject.Properties.Name -contains "enabledBdPlugins") {
            $bd.enabledBdPlugins = $list
        } else {
            $bd | Add-Member -NotePropertyName "enabledBdPlugins" -NotePropertyValue $list
        }
    }
    ($obj | ConvertTo-Json -Depth 12) | Set-Content -Path $SettingsFile -Encoding UTF8
    Write-Log "Parametres Vencord mis a jour (BdCompat active)." "ok"
}

function Run-Install {
    param([System.Windows.Forms.ProgressBar]$Bar, [System.Windows.Forms.Label]$Status)

    function Step($p, $t) {
        if ($Bar) { $Bar.Value = [Math]::Min(100, $p) }
        if ($Status) { $Status.Text = $t }
        [System.Windows.Forms.Application]::DoEvents()
    }

    try {
        Write-Log "Demarrage de l'installation..." "info"
        Step 5 "Preparation"

        # 1. Copy dist
        Write-Log "Copie du build Vencord (BdCompat)..." "info"
        New-Item -ItemType Directory -Path $VencordDir -Force | Out-Null
        if (Test-Path $DistDst) { Remove-Item $DistDst -Recurse -Force }
        Copy-Item -Path $DistSrc -Destination $DistDst -Recurse -Force
        Write-Log "Build copie dans $DistDst" "ok"
        Step 30 "Build Vencord installe"

        # 2. Plugin
        if ($Config.installAutoQuest) {
            New-Item -ItemType Directory -Path $BdPluginsDir -Force | Out-Null
            Copy-Item -Path $PluginSrc -Destination (Join-Path $BdPluginsDir $PluginName) -Force
            Write-Log "Plugin AutoQuest depose dans bdPlugins." "ok"
        }
        Step 45 "Plugin AutoQuest installe"

        # 3. Close Discord
        if ($Config.closeDiscord) {
            Stop-DiscordProcesses -Flavors @("Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment")
        }
        Step 55 "Discord ferme"

        # 4. Patch each target
        $anyPatched = $false
        foreach ($flavor in $Config.targets) {
            $base = Join-Path $env:LOCALAPPDATA $flavor
            if (Patch-Discord -BaseDir $base -Flavor $flavor) { $anyPatched = $true }
        }
        Step 80 "Injection terminee"

        if (-not $anyPatched) {
            Write-Log "Aucune installation Discord patchee. Verifie que Discord est installe." "err"
        }

        # 5. Settings
        Ensure-Settings
        Step 100 "Termine"

        Write-Log "Installation terminee ! Relance Discord pour activer AutoQuest." "ok"
        return $true
    } catch {
        Write-Log ("Erreur: " + $_.Exception.Message) "err"
        return $false
    }
}

# ============================================================
#  Interface graphique (WinForms)
# ============================================================
$GuiOk = $true
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
} catch { $GuiOk = $false }

if (-not $GuiOk) {
    # Mode console (fallback)
    Run-Install -Bar $null -Status $null
    Read-Host "Appuie sur Entree pour fermer"
    return
}

[System.Windows.Forms.Application]::EnableVisualStyles()

$bgDark   = [System.Drawing.Color]::FromArgb(13, 11, 33)
$bgPanel  = [System.Drawing.Color]::FromArgb(20, 17, 46)
$accent   = [System.Drawing.Color]::FromArgb(90, 60, 240)
$textCol  = [System.Drawing.Color]::White
$mutedCol = [System.Drawing.Color]::FromArgb(160, 165, 200)

$form = New-Object System.Windows.Forms.Form
$form.Text = "Vencord BdCompat + AutoQuest"
$form.Size = New-Object System.Drawing.Size(620, 540)
$form.StartPosition = "CenterScreen"
$form.BackColor = $bgDark
$form.ForeColor = $textCol
$form.FormBorderStyle = "FixedSingle"
$form.MaximizeBox = $false

# Logo
$logoPath = Join-Path $ScriptDir "logo.png"
if (Test-Path $logoPath) {
    $pic = New-Object System.Windows.Forms.PictureBox
    $pic.Image = [System.Drawing.Image]::FromFile($logoPath)
    $pic.SizeMode = "Zoom"
    $pic.Size = New-Object System.Drawing.Size(72, 72)
    $pic.Location = New-Object System.Drawing.Point(28, 24)
    $pic.BackColor = [System.Drawing.Color]::Transparent
    $form.Controls.Add($pic)
}

$title = New-Object System.Windows.Forms.Label
$title.Text = "BdCompat Installer"
$title.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 18, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = $textCol
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(112, 32)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Vencord + plugin AutoQuest pour Discord"
$subtitle.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$subtitle.ForeColor = $mutedCol
$subtitle.AutoSize = $true
$subtitle.Location = New-Object System.Drawing.Point(114, 66)
$form.Controls.Add($subtitle)

$status = New-Object System.Windows.Forms.Label
$status.Text = "Pret a installer"
$status.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$status.ForeColor = $textCol
$status.AutoSize = $false
$status.Size = New-Object System.Drawing.Size(560, 22)
$status.Location = New-Object System.Drawing.Point(28, 120)
$form.Controls.Add($status)

$bar = New-Object System.Windows.Forms.ProgressBar
$bar.Location = New-Object System.Drawing.Point(28, 148)
$bar.Size = New-Object System.Drawing.Size(560, 16)
$bar.Style = "Continuous"
$bar.Minimum = 0
$bar.Maximum = 100
$form.Controls.Add($bar)

$global:LogBox = New-Object System.Windows.Forms.RichTextBox
$global:LogBox.Location = New-Object System.Drawing.Point(28, 180)
$global:LogBox.Size = New-Object System.Drawing.Size(560, 260)
$global:LogBox.BackColor = $bgPanel
$global:LogBox.ForeColor = $mutedCol
$global:LogBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$global:LogBox.ReadOnly = $true
$global:LogBox.BorderStyle = "None"
$form.Controls.Add($global:LogBox)

$btnInstall = New-Object System.Windows.Forms.Button
$btnInstall.Text = "Installer"
$btnInstall.Size = New-Object System.Drawing.Size(160, 40)
$btnInstall.Location = New-Object System.Drawing.Point(428, 452)
$btnInstall.FlatStyle = "Flat"
$btnInstall.FlatAppearance.BorderSize = 0
$btnInstall.BackColor = $accent
$btnInstall.ForeColor = [System.Drawing.Color]::White
$btnInstall.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 10, [System.Drawing.FontStyle]::Bold)
$btnInstall.Cursor = "Hand"
$form.Controls.Add($btnInstall)

$btnClose = New-Object System.Windows.Forms.Button
$btnClose.Text = "Fermer"
$btnClose.Size = New-Object System.Drawing.Size(120, 40)
$btnClose.Location = New-Object System.Drawing.Point(28, 452)
$btnClose.FlatStyle = "Flat"
$btnClose.FlatAppearance.BorderColor = $accent
$btnClose.BackColor = $bgPanel
$btnClose.ForeColor = $mutedCol
$btnClose.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$btnClose.Cursor = "Hand"
$btnClose.Add_Click({ $form.Close() })
$form.Controls.Add($btnClose)

$btnInstall.Add_Click({
    $btnInstall.Enabled = $false
    $ok = Run-Install -Bar $bar -Status $status
    if ($ok) {
        $btnInstall.Text = "Fini"
        $status.Text = "Installation reussie - relance Discord."
    } else {
        $btnInstall.Text = "Reessayer"
        $btnInstall.Enabled = $true
    }
})

Write-Log "Installeur pret. Clique sur Installer." "info"
[void]$form.ShowDialog()
