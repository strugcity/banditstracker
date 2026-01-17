# Dev Server Management Script for Bandits Training Tracker
# Usage: .\dev-server.ps1 [command]
# Commands: start, stop, status, restart

param(
    [Parameter(Position=0)]
    [string]$Command = "start"
)

$Port = 3000

function Get-ServerStatus {
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "✓ Dev server is RUNNING on port $Port" -ForegroundColor Green
        Write-Host "  URL: http://localhost:$Port" -ForegroundColor Cyan
        $pid = $process.OwningProcess
        Write-Host "  Process ID: $pid" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "✗ Dev server is NOT running on port $Port" -ForegroundColor Red
        return $false
    }
}

function Stop-Server {
    Write-Host "Stopping dev server on port $Port..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($process) {
        $pid = $process.OwningProcess
        Stop-Process -Id $pid -Force
        Write-Host "✓ Server stopped (PID: $pid)" -ForegroundColor Green
    } else {
        Write-Host "No server running on port $Port" -ForegroundColor Gray
    }
}

function Start-Server {
    if (Get-ServerStatus) {
        Write-Host ""
        Write-Host "Server is already running. Stop it first with: .\dev-server.ps1 stop" -ForegroundColor Yellow
        return
    }

    Write-Host "Starting dev server..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    npm run dev
}

function Restart-Server {
    Stop-Server
    Start-Sleep -Seconds 2
    Start-Server
}

switch ($Command.ToLower()) {
    "start" { Start-Server }
    "stop" { Stop-Server }
    "status" { Get-ServerStatus }
    "restart" { Restart-Server }
    default {
        Write-Host "Usage: .\dev-server.ps1 [command]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Cyan
        Write-Host "  start   - Start the dev server (default)"
        Write-Host "  stop    - Stop the dev server"
        Write-Host "  status  - Check if server is running"
        Write-Host "  restart - Restart the dev server"
        Write-Host ""
        Write-Host "Example: .\dev-server.ps1 status" -ForegroundColor Gray
    }
}
