@echo off
title Enviar Escala Swipe para o GitHub
echo.
echo Enviando as alteracoes para github.com/wesleyfilipy/club-particular ...
echo Se abrir uma janela do GitHub, clique em "Sign in with your browser" e autorize.
echo.
"C:\Program Files\Git\cmd\git.exe" -C "C:\Users\Pichau\AppData\Local\Temp\claude\c--Users-Pichau-Downloads-club-particular-main-club-particular-main\553077bf-5143-46bc-b5d1-415fac60cc97\scratchpad\repo" push origin main
echo.
if %errorlevel%==0 (
  echo PRONTO! Codigo enviado. A Vercel vai publicar o site em 1 a 2 minutos.
) else (
  echo Deu erro no envio. Copie a mensagem acima e mande para o Claude.
)
echo.
pause
