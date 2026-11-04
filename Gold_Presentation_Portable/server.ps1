# Pothys Swarna Mahal - Gold Training Program
# Portable Zero-Dependency Loopback Web Server with Byte-Range Video Streaming

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Determine base directory reliably
$baseDir = $PSScriptRoot
if (-not $baseDir) {
    if ($MyInvocation.MyCommand.Path) {
        $baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
}
if (-not $baseDir) {
    $baseDir = (Get-Location).Path
}
$baseDir = [System.IO.Path]::GetFullPath($baseDir)
if (-not $baseDir.EndsWith([System.IO.Path]::DirectorySeparatorChar.ToString())) {
    $baseDir += [System.IO.Path]::DirectorySeparatorChar
}
Set-Location -Path $baseDir

# 1. Verify existence of presentation files
$indexPath = Join-Path $baseDir "index.html"
$slidesDir = Join-Path $baseDir "slides"

if (-not (Test-Path $indexPath) -or -not (Test-Path $slidesDir)) {
    [System.Windows.Forms.MessageBox]::Show(
        "Gold Presentation files could not be found in:`n$baseDir`n`nPlease ensure all presentation files are in this folder.",
        "Pothys Swarna Mahal - Startup Error",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}

# 2. Prevent duplicate servers / single-instance mutex
$mutexName = "Local\PothysSwarnaMahalGoldPresentationMutex"
$createdNew = $false
$mutex = $null

try {
    $mutex = New-Object System.Threading.Mutex($true, $mutexName, [ref]$createdNew)
} catch {
    $createdNew = $true
}

$portFile = Join-Path $env:TEMP "psm_gold_presentation_port.txt"

if (-not $createdNew) {
    if (Test-Path $portFile) {
        try {
            $existingPort = [int]((Get-Content $portFile -ErrorAction Stop).Trim())
            $testClient = New-Object System.Net.Sockets.TcpClient
            $ar = $testClient.BeginConnect([System.Net.IPAddress]::Loopback, $existingPort, $null, $null)
            if ($ar.AsyncWaitHandle.WaitOne(300) -and $testClient.Connected) {
                $testClient.Close()
                Start-Process "http://127.0.0.1:$existingPort/index.html"
                exit 0
            }
            $testClient.Close()
        } catch {}
    }
}

# 3. Port auto-detection
$candidatePorts = @(8000, 8080, 8085, 8090, 8100, 8200, 8888, 3000, 5000, 5500, 9000)
$listener = $null
$selectedPort = 0

foreach ($p in $candidatePorts) {
    try {
        $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $p)
        $l.Start()
        $listener = $l
        $selectedPort = $p
        break
    } catch {}
}

if ($null -eq $listener) {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $selectedPort = $listener.LocalEndpoint.Port
}

Set-Content -Path $portFile -Value $selectedPort -Force

# 4. MIME Types Mapping
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".ttf"  = "font/ttf"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".otf"  = "font/otf"
    ".mp4"  = "video/mp4"
    ".webp" = "image/webp"
}

# 5. Tray Icon & Presentation URL Setup
$presentationUrl = "http://127.0.0.1:$selectedPort/index.html"

$trayIcon = $null
try {
    $iconPath = Join-Path $baseDir "app.ico"
    $icon = $null
    if (Test-Path $iconPath) {
        try { $icon = New-Object System.Drawing.Icon($iconPath) } catch {}
    }
    if ($null -eq $icon) {
        $icon = [System.Drawing.SystemIcons]::Application
    }

    $trayIcon = New-Object System.Windows.Forms.NotifyIcon
    $trayIcon.Icon = $icon
    $trayIcon.Text = "Gold Training Presentation (Port $selectedPort)"
    $trayIcon.Visible = $true

    $contextMenu = New-Object System.Windows.Forms.ContextMenu

    $titleItem = New-Object System.Windows.Forms.MenuItem("Gold Presentation (Running)")
    $titleItem.Enabled = $false
    $contextMenu.MenuItems.Add($titleItem) | Out-Null

    $portItem = New-Object System.Windows.Forms.MenuItem("Port: $selectedPort")
    $portItem.Enabled = $false
    $contextMenu.MenuItems.Add($portItem) | Out-Null

    $contextMenu.MenuItems.Add("-") | Out-Null

    $openItem = New-Object System.Windows.Forms.MenuItem("Open in Browser", {
        Start-Process $presentationUrl
    })
    $contextMenu.MenuItems.Add($openItem) | Out-Null

    $contextMenu.MenuItems.Add("-") | Out-Null

    $exitItem = New-Object System.Windows.Forms.MenuItem("Exit Presentation", {
        $script:isRunning = $false
    })
    $contextMenu.MenuItems.Add($exitItem) | Out-Null

    $trayIcon.ContextMenu = $contextMenu
    $trayIcon.add_DoubleClick({
        Start-Process $presentationUrl
    })

    $trayIcon.ShowBalloonTip(
        3000,
        "Gold Training Presentation Ready",
        "Serving presentation at $presentationUrl",
        [System.Windows.Forms.ToolTipIcon]::Info
    )
} catch {}

# 6. Verify socket listening readiness, then open browser
try {
    $checkClient = New-Object System.Net.Sockets.TcpClient
    $ar = $checkClient.BeginConnect([System.Net.IPAddress]::Loopback, $selectedPort, $null, $null)
    $null = $ar.AsyncWaitHandle.WaitOne(800)
    $checkClient.Close()
} catch {}
Start-Process $presentationUrl

# 7. Lifecycle Tracking
$startTime = [DateTime]::UtcNow
$lastHeartbeat = [DateTime]::UtcNow
$hasReceivedHeartbeat = $false
$script:isRunning = $true

function Send-StatusResponse($stream, $status, $msg) {
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes("<html><body><h1>$status</h1><p>$msg</p></body></html>")
    $header = "HTTP/1.1 $status`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($bodyBytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
    $hBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
    $stream.Write($hBytes, 0, $hBytes.Length)
    $stream.Write($bodyBytes, 0, $bodyBytes.Length)
    $stream.Flush()
}

$buffer = New-Object byte[] 8192

while ($script:isRunning) {
    [System.Windows.Forms.Application]::DoEvents()

    if ($listener.Pending()) {
        try {
            $client = $listener.AcceptTcpClient()
            $client.ReceiveTimeout = 2000
            $client.SendTimeout = 8000
            $stream = $client.GetStream()

            $waitIter = 0
            while (-not $stream.DataAvailable -and $waitIter -lt 25) {
                [System.Threading.Thread]::Sleep(10)
                $waitIter++
            }
            if (-not $stream.DataAvailable) {
                $stream.Close()
                $client.Close()
                continue
            }

            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -gt 0) {
                $reqStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
                $firstLine = $reqStr.Split([string[]]@("`r`n", "`n"), [StringSplitOptions]::None)[0]
                $parts = $firstLine.Split(' ')

                if ($parts.Length -ge 2) {
                    $method = $parts[0].ToUpperInvariant()
                    $rawUrl = $parts[1]

                    # API: Heartbeat
                    if ($rawUrl.StartsWith("/api/heartbeat")) {
                        $lastHeartbeat = [DateTime]::UtcNow
                        $hasReceivedHeartbeat = $true
                        $json = '{"status":"ok"}'
                        $jBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                        $resp = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nContent-Length: $($jBytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                        $rH = [System.Text.Encoding]::UTF8.GetBytes($resp)
                        $stream.Write($rH, 0, $rH.Length)
                        if ($method -ne "HEAD") { $stream.Write($jBytes, 0, $jBytes.Length) }
                        $stream.Flush()
                    }
                    # API: Shutdown
                    elseif ($rawUrl.StartsWith("/api/shutdown")) {
                        $json = '{"status":"stopping"}'
                        $jBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                        $resp = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nContent-Length: $($jBytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                        $rH = [System.Text.Encoding]::UTF8.GetBytes($resp)
                        $stream.Write($rH, 0, $rH.Length)
                        $stream.Write($jBytes, 0, $jBytes.Length)
                        $stream.Flush()
                        $script:isRunning = $false
                    }
                    else {
                        # Static File Serving
                        $cleanUrl = $rawUrl.Split('?')[0].Split('#')[0]
                        $cleanUrl = [System.Uri]::UnescapeDataString($cleanUrl).Replace('+', ' ').TrimStart('/')
                        if ([string]::IsNullOrEmpty($cleanUrl)) { $cleanUrl = "index.html" }
                        $cleanUrl = $cleanUrl.Replace('/', [System.IO.Path]::DirectorySeparatorChar)

                        $targetFile = [System.IO.Path]::GetFullPath((Join-Path $baseDir $cleanUrl))

                        # Security check: directory traversal defense
                        if (-not $targetFile.StartsWith($baseDir, [StringComparison]::OrdinalIgnoreCase)) {
                            Send-StatusResponse $stream "403 Forbidden" "Access denied."
                        }
                        elseif (-not [System.IO.File]::Exists($targetFile)) {
                            Send-StatusResponse $stream "404 Not Found" "File not found: $cleanUrl"
                        }
                        else {
                            $ext = [System.IO.Path]::GetExtension($targetFile).ToLowerInvariant()
                            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                            $fi = New-Object System.IO.FileInfo($targetFile)
                            $fileLen = $fi.Length
                            $cacheControl = if ($ext -match "^\.(html|htm|js|css)$") { "no-cache, no-store, must-revalidate" } else { "public, max-age=3600" }

                            # Check for Range header (HTTP 206 Partial Content for video streaming)
                            $rangeHeader = $null
                            foreach ($line in $reqStr.Split([string[]]@("`r`n", "`n"), [StringSplitOptions]::None)) {
                                if ($line.StartsWith("Range:", [StringComparison]::OrdinalIgnoreCase)) {
                                    $rangeHeader = $line.Substring(6).Trim()
                                    break
                                }
                            }

                            if ($null -ne $rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                                $rangeSpec = $rangeHeader.Substring(6).Trim()
                                $rParts = $rangeSpec.Split('-')
                                $startByte = 0L
                                $endByte = $fileLen - 1L

                                if (-not [string]::IsNullOrEmpty($rParts[0])) {
                                    $startByte = [int64]$rParts[0]
                                }
                                if ($rParts.Length -gt 1 -and -not [string]::IsNullOrEmpty($rParts[1])) {
                                    $endByte = [int64]$rParts[1]
                                }
                                if ($endByte -ge $fileLen) { $endByte = $fileLen - 1L }
                                $chunkLen = ($endByte - $startByte) + 1L

                                $header = "HTTP/1.1 206 Partial Content`r`nContent-Type: $mime`r`nContent-Length: $chunkLen`r`nContent-Range: bytes $startByte-$endByte/$fileLen`r`nAccept-Ranges: bytes`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: $cacheControl`r`nConnection: close`r`n`r`n"
                                $hBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                                $stream.Write($hBytes, 0, $hBytes.Length)

                                if ($method -ne "HEAD") {
                                    $fs = [System.IO.File]::OpenRead($targetFile)
                                    try {
                                        $fs.Seek($startByte, [System.IO.SeekOrigin]::Begin) | Out-Null
                                        $remaining = $chunkLen
                                        $chunkBuf = New-Object byte[] 65536
                                        while ($remaining -gt 0) {
                                            $toRead = [Math]::Min($remaining, [int64]$chunkBuf.Length)
                                            $read = $fs.Read($chunkBuf, 0, [int]$toRead)
                                            if ($read -le 0) { break }
                                            $stream.Write($chunkBuf, 0, $read)
                                            $remaining -= $read
                                        }
                                    } finally {
                                        $fs.Close()
                                    }
                                }
                                $stream.Flush()
                            }
                            else {
                                $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $fileLen`r`nAccept-Ranges: bytes`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: $cacheControl`r`nConnection: close`r`n`r`n"
                                $hBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                                $stream.Write($hBytes, 0, $hBytes.Length)

                                if ($method -ne "HEAD") {
                                    $fs = [System.IO.File]::OpenRead($targetFile)
                                    try {
                                        $fs.CopyTo($stream)
                                    } finally {
                                        $fs.Close()
                                    }
                                }
                                $stream.Flush()
                            }
                        }
                    }
                }
            }
            $stream.Close()
            $client.Close()
        } catch {}
    } else {
        [System.Threading.Thread]::Sleep(30)
    }

    # Watchdog Check
    $now = [DateTime]::UtcNow
    if ($hasReceivedHeartbeat) {
        if (($now - $lastHeartbeat).TotalSeconds -gt 90) {
            $script:isRunning = $false
        }
    } else {
        if (($now - $startTime).TotalSeconds -gt 120) {
            $script:isRunning = $false
        }
    }
}

# Cleanup on exit
if ($null -ne $trayIcon) {
    try {
        $trayIcon.Visible = $false
        $trayIcon.Dispose()
    } catch {}
}
try { $listener.Stop() } catch {}
try { if (Test-Path $portFile) { Remove-Item $portFile -Force -ErrorAction SilentlyContinue } } catch {}
if ($null -ne $mutex) {
    try {
        if ($createdNew) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    } catch {}
}
