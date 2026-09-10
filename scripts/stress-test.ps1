param (
    [int]$Start = 1,
    [int]$End = 10
)

for ($i = $Start; $i -le $End; $i++) {
    $num = $i.ToString("D2")
    $start = Get-Date
    npx vitest run | Out-Null
    $ec = $LASTEXITCODE
    $dur = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
    if ($ec -eq 0) {
        Write-Output ("Run " + $num + ": PASS (" + $dur + "s)")
    } else {
        Write-Output ("Run " + $num + ": FAIL (" + $dur + "s, exit code: " + $ec + ")")
        break
    }
}
