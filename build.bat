@echo off
echo Creating zip file for Chrome extension...

if exist workflowy-extension.zip del workflowy-extension.zip

powershell -command "Compress-Archive -Path manifest.json, background, content, popup, icons -DestinationPath workflowy-extension.zip -Force"

echo Zip file created successfully!
echo Location: workflowy-extension.zip
pause
