$ErrorActionPreference = "Stop"
$automationDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $automationDir ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python virtual environment not found. Complete the setup steps in automation/README.md first."
}

Set-Location -LiteralPath $automationDir
& $python "keep_alive.py"
exit $LASTEXITCODE
