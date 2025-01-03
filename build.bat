@echo off
echo Creating zip file for Chrome extension...

if exist workflowy-extension.zip del workflowy-extension.zip

powershell -command "Compress-Archive -Path manifest.json, background, src, popup, icons -DestinationPath workflowy-master.zip -Force"

echo Zip file created successfully!
echo Location: workflowy-master.zip
pause
