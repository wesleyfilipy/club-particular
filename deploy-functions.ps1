# Publica as Edge Functions do Escala Swipe no Supabase.
# Uso (no terminal do VS Code, na pasta do projeto):  .\deploy-functions.ps1
#
# Antes: cadastre os secrets em Supabase > Edge Functions > Secrets
# (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
#  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET).

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host ''
Write-Host 'O "Project ref" fica em Supabase > Project Settings > General (ex: abcdefghijklmnopqrst).' -ForegroundColor Yellow
$ref = Read-Host 'Cole o Project ref do seu projeto Supabase'

Write-Host ''
Write-Host 'Fazendo login no Supabase (vai abrir o navegador)...' -ForegroundColor Yellow
npx --yes supabase login

$functions = @('get-upload-url', 'get-download-url', 'cancel-subscription')
foreach ($fn in $functions) {
  Write-Host "Publicando $fn..." -ForegroundColor Yellow
  npx --yes supabase functions deploy $fn --project-ref $ref --use-api
}

# O webhook do Stripe não recebe login de usuário, por isso --no-verify-jwt
Write-Host 'Publicando stripe-webhook...' -ForegroundColor Yellow
npx --yes supabase functions deploy stripe-webhook --project-ref $ref --use-api --no-verify-jwt

Write-Host ''
Write-Host 'Pronto! Funções publicadas.' -ForegroundColor Green
Write-Host "URL do webhook para o Stripe: https://$ref.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Green
