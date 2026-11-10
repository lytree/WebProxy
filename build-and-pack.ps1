# use PowerShell 7 or later for correct zip file format
# run this in powershell to enable scripts
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$global:Success = $true
$global:version = ""

Write-Output "Creating Browser Markets Release Packs..."

# Copy IP2Location database to assets
Write-Output "Copying IP2Location database..."
$csvSource = "IPCountryDB\IP2LOCATION-LITE-DB1.CSV"
$csvDestination = "src\assets\IPCountryDB\IP2LOCATION-LITE-DB1.CSV"

if (Test-Path $csvSource) {
    $csvDestinationDir = Split-Path -Parent $csvDestination
    if (!(Test-Path $csvDestinationDir)) {
        New-Item -Path $csvDestinationDir -ItemType Directory -Force | Out-Null
    }
    Copy-Item -Path $csvSource -Destination $csvDestination -Force
    Write-Output "IP2Location database copied successfully."
} else {
    Write-Warning "IP2Location database not found at '$csvSource'. Build will continue without country code database."
}

Function BuildAndPack($Build, $BuildName) {

 if(!$global:Success) {
    return;
 }

 & pnpm run "build-$Build"
 $global:Success = ($LASTEXITCODE -eq 0)

 if($global:Success)
 {
    $manifest = Get-Content .\extension\manifest.json | ConvertFrom-Json
    $global:version = $manifest.version
	if (!(Test-Path "..\!Releases\$global:version\")) {
		New-Item -Path "..\!Releases\$global:version\" -ItemType Directory
	}
    $zipfile = "..\!Releases\$global:version\WebProxy-v$global:version-$BuildName.zip"
    $compress = @{
        Path = ".\extension\*"
        DestinationPath = $zipfile
    }
    Compress-Archive @compress
    Write-Output "Created release in $zipfile"
 }
 else
 {
    Write-Output "Build has failed for $BuildName"
 }
}


BuildAndPack "ff" "Firefox"
BuildAndPack "ch"  "Chrome-ManifestV3"
BuildAndPack "ed"  "Edge"
BuildAndPack "th"  "Thunderbird"
BuildAndPack "op"  "Opera"
BuildAndPack "ff-unlisted" "firefox-unlisted"

if ($global:Success -and $global:version) {
    git archive --format zip -o "..\!Releases\$global:version\WebProxy-$global:version-sources.zip" HEAD
    Write-Output "Sources are saved in WebProxy-$global:version-sources.zip"
} else {
    Write-Warning "Skipping source archive because the build did not produce a version."
}