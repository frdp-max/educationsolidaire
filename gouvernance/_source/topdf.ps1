param([string]$In, [string]$Out, [string]$Filter = "*.docx")
New-Item -ItemType Directory -Force $Out | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  Get-ChildItem -Path $In -Filter $Filter | ForEach-Object {
    $doc = $word.Documents.Open($_.FullName, $false, $true)
    $pdf = Join-Path $Out ($_.BaseName + ".pdf")
    $doc.ExportAsFixedFormat($pdf, 17)
    $doc.Close($false)
    Write-Output $_.BaseName
  }
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
