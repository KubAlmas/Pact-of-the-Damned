param([int]$Port = 5173)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Pact of the Damned -> $prefix"

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
}

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        try {
            $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
            if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
            $file = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
            if ((Test-Path $file -PathType Leaf)) {
                $ext = [IO.Path]::GetExtension($file).ToLower()
                $ct = $mime[$ext]
                if (-not $ct) { $ct = 'application/octet-stream' }
                $bytes = [IO.File]::ReadAllBytes($file)
                $res.ContentType = $ct
                $res.ContentLength64 = $bytes.Length
                $res.Headers.Add('Cache-Control', 'no-store')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.StatusCode = 200
                Write-Host ("200 {0}" -f $path)
            } else {
                $res.StatusCode = 404
                $body = [Text.Encoding]::UTF8.GetBytes("404: $path")
                $res.OutputStream.Write($body, 0, $body.Length)
                Write-Host ("404 {0}" -f $path)
            }
        } catch {
            Write-Host ("ERR {0}" -f $_.Exception.Message)
            $res.StatusCode = 500
        } finally {
            $res.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
}
