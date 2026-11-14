<#
  Installs the NSIS installer silently on the Windows CI runner and checks what a user
  would get: the program files, the Start-menu shortcut, the uninstall entry and the
  .drawnix file association (opening a document launches the installed app with its path).

  Usage (pwsh):
    scripts/ci-verify-installer.ps1 -Phase install     # sets ZN_EXECUTABLE for later steps
    scripts/ci-verify-installer.ps1 -Phase uninstall

  Findings are written as GitHub Actions annotations so they are visible on the run page.
#>
param(
  [Parameter(Mandatory = $true)][ValidateSet('install', 'uninstall')][string]$Phase
)

$ErrorActionPreference = 'Stop'
$UninstallRoot = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
$ExeName = 'ZehnNegar.exe'

function Escape-Annotation([string]$Text) {
  return $Text.Replace('%', '%25').Replace("`r", '%0D').Replace("`n", '%0A')
}

function Write-Notice([string]$Text) {
  Write-Host "::notice title=installer::$(Escape-Annotation $Text)"
}

function Fail([string]$Text) {
  Write-Host "::error title=installer::$(Escape-Annotation $Text)"
  exit 1
}

function Get-UninstallEntry {
  if (-not (Test-Path $UninstallRoot)) { return $null }
  return Get-ChildItem $UninstallRoot |
    ForEach-Object { Get-ItemProperty $_.PSPath } |
    Where-Object { $_.DisplayName -like '*ZehnNegar*' } |
    Select-Object -First 1
}

# The install folder: InstallLocation when present, otherwise the folder of the icon or
# of the uninstaller recorded in the entry.
function Get-InstallLocation($Entry) {
  if ($Entry.InstallLocation) { return $Entry.InstallLocation.Trim('"') }
  foreach ($value in @($Entry.DisplayIcon, $Entry.UninstallString)) {
    if ($value -and $value -match '([A-Za-z]:\\[^"]+?\.exe)') {
      return Split-Path -Parent $Matches[1]
    }
  }
  return $null
}

# Shortcuts (with their targets) under a folder. Shell.Application is used because the
# older WScript.Shell COM object cannot open .lnk files with non-ANSI (Persian) names.
function Get-Shortcuts([string]$Folder) {
  $shellApp = New-Object -ComObject Shell.Application
  $result = @()
  foreach ($file in Get-ChildItem -LiteralPath $Folder -Filter '*.lnk' -Recurse) {
    $target = $null
    try {
      $item = $shellApp.Namespace($file.DirectoryName).ParseName($file.Name)
      if ($item -and $item.IsLink) { $target = $item.GetLink.Path }
    } catch {
      $target = "<unreadable: $($_.Exception.Message)>"
    }
    $result += [pscustomobject]@{ File = $file; Target = $target }
  }
  return $result
}

# File name as ASCII (code points) so that it survives any console encoding.
function Format-Name([string]$Name) {
  return (($Name.ToCharArray() | ForEach-Object { if ([int]$_ -lt 128) { [string]$_ } else { 'U+{0:X4}' -f [int]$_ } }) -join '')
}

function Stop-App {
  Get-Process -Name 'ZehnNegar' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

if ($Phase -eq 'install') {
  $installer = Get-ChildItem -Path 'release' -Filter 'ZehnNegar-Setup-*.exe' | Select-Object -First 1
  if (-not $installer) { Fail 'installer not found in release/' }

  $process = Start-Process -FilePath $installer.FullName -ArgumentList '/S' -Wait -PassThru
  if ($process.ExitCode -ne 0) { Fail "silent install exited with code $($process.ExitCode)" }

  # --- uninstall entry and program files -------------------------------------------------
  $entry = Get-UninstallEntry
  if (-not $entry) { Fail 'no uninstall entry (HKCU ...\Uninstall) with a ZehnNegar display name' }
  $location = Get-InstallLocation $entry
  if (-not $location) { Fail "cannot tell the install folder from the uninstall entry: $($entry | Out-String)" }
  $exe = Join-Path $location $ExeName
  if (-not (Test-Path $exe)) { Fail "installed executable not found: $exe" }
  $native = Join-Path $location 'resources\app.asar.unpacked\node_modules\better-sqlite3\prebuilds\win32-x64.node'
  if (-not (Test-Path $native)) { Fail "native SQLite module missing from the installation: $native" }
  if ($entry.DisplayVersion -ne '1.0.0') { Fail "unexpected DisplayVersion: $($entry.DisplayVersion)" }

  # --- Start-menu shortcut pointing at the installed executable --------------------------
  $programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
  $all = Get-Shortcuts $programs
  $shortcuts = @($all | Where-Object { $_.Target -ieq $exe })
  if ($shortcuts.Count -eq 0) {
    $listing = ($all | ForEach-Object { "$(Format-Name $_.File.Name) -> $($_.Target)" }) -join "`n"
    Fail "no Start-menu shortcut targets $exe. Shortcuts found:`n$listing"
  }
  $shortcutName = [System.IO.Path]::GetFileNameWithoutExtension($shortcuts[0].File.Name)
  $expectedName = -join ([char[]](0x0630, 0x0647, 0x0646, 0x200C, 0x0646, 0x06AF, 0x0627, 0x0631))
  if ($shortcutName -ne $expectedName) {
    Fail "Start-menu shortcut name is '$(Format-Name $shortcutName)', expected the Persian app name '$(Format-Name $expectedName)'"
  }

  # --- .drawnix association ---------------------------------------------------------------
  $progId = (Get-ItemProperty -Path 'HKCU:\Software\Classes\.drawnix' -ErrorAction SilentlyContinue).'(default)'
  if (-not $progId) { Fail '.drawnix is not registered under HKCU\Software\Classes' }
  $command = (Get-ItemProperty -Path "HKCU:\Software\Classes\$progId\shell\open\command" -ErrorAction SilentlyContinue).'(default)'
  if (-not $command -or $command -notlike "*$ExeName*") { Fail "open command for $progId does not point at the app: $command" }

  # Opening a document through the shell (what a double-click does) must start the
  # installed app with the document path as its argument.
  $document = Join-Path $env:RUNNER_TEMP 'sample document.drawnix'
  Set-Content -Path $document -Encoding utf8 -Value '{"type":"drawnix","version":1,"source":"web","elements":[],"viewport":{"zoom":1}}'
  Stop-App
  Start-Process -FilePath $document
  $launched = $null
  for ($i = 0; $i -lt 30 -and -not $launched; $i++) {
    Start-Sleep -Seconds 1
    $launched = Get-CimInstance Win32_Process -Filter "Name='$ExeName'" |
      Where-Object { $_.CommandLine -like '*sample document.drawnix*' } |
      Select-Object -First 1
  }
  if (-not $launched) { Fail 'opening a .drawnix document through the shell did not start the app with the document path' }
  if ($launched.ExecutablePath -ine $exe) { Fail "the document was opened by $($launched.ExecutablePath), not by $exe" }
  Stop-App

  Add-Content -Path $env:GITHUB_ENV -Value "ZN_EXECUTABLE=$exe"
  $sizeMb = [math]::Round($installer.Length / 1MB, 1)
  Write-Notice "installed to $location; installer $sizeMb MB; uninstall entry '$($entry.DisplayName)'; shortcut '$(Format-Name $shortcutName)'; .drawnix -> $progId; double-click launch OK"
  exit 0
}

# ----------------------------------------------------------------------------- uninstall
$entry = Get-UninstallEntry
if (-not $entry) { Fail 'nothing to uninstall: no uninstall entry found' }
$location = Get-InstallLocation $entry
if (-not $location) { Fail "cannot tell the install folder from the uninstall entry: $($entry | Out-String)" }
$exe = Join-Path $location $ExeName
$uninstaller = Get-ChildItem -Path $location -Filter 'Uninstall*.exe' | Select-Object -First 1
if (-not $uninstaller) { Fail "uninstaller not found in $location" }

Stop-App
# NSIS uninstallers re-launch themselves from a temp folder, so wait for the files to go.
Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -Wait
for ($i = 0; $i -lt 60 -and (Test-Path $exe); $i++) { Start-Sleep -Seconds 1 }

if (Test-Path $exe) { Fail "executable still present after uninstall: $exe" }
if (Get-UninstallEntry) { Fail 'uninstall entry still present after uninstall' }
$programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$left = @(Get-Shortcuts $programs | Where-Object { $_.Target -ieq $exe })
if ($left.Count -gt 0) { Fail "Start-menu shortcut left behind: $(Format-Name $left[0].File.Name)" }

Write-Notice 'uninstall removed the program files, the uninstall entry and the Start-menu shortcut'
