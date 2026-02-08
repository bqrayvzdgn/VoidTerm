# VoidTerm Shell Integration for PowerShell
# Emits OSC 633 sequences for command tracking

if ($env:VOIDTERM_SHELL_INTEGRATION) { return }
$env:VOIDTERM_SHELL_INTEGRATION = "1"

$Global:__voidterm_last_exit = 0

function Global:prompt {
    $exitCode = if ($?) { 0 } else { $Global:__voidterm_last_exit }
    $Global:__voidterm_last_exit = $LASTEXITCODE
    if ($null -eq $Global:__voidterm_last_exit) { $Global:__voidterm_last_exit = 0 }

    [Console]::Write("`e]633;D;$exitCode`a")
    [Console]::Write("`e]633;P;Cwd=$($PWD.Path)`a")
    [Console]::Write("`e]633;A`a")

    # Call the original prompt or default
    $promptResult = "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) "
    [Console]::Write("`e]633;B`a")
    return $promptResult
}

# Use PSReadLine handler for preexec
if (Get-Module PSReadLine) {
    $__voidterm_original_handler = (Get-PSReadLineKeyHandler -Bound | Where-Object { $_.Key -eq 'Enter' }).Function
    Set-PSReadLineKeyHandler -Key Enter -ScriptBlock {
        $line = $null
        $cursor = $null
        [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)
        [Console]::Write("`e]633;E;$line`a")
        [Console]::Write("`e]633;C`a")
        [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
    }
}
