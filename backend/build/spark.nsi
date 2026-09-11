; Spark - Installeur Vencord BdCompat (+ plugin AutoQuest)
; Compile: makensis -DWITHPLUGIN=1 -DOUTFILE=Spark-Setup.exe spark.nsi

Unicode true
!include "MUI2.nsh"

!ifndef WITHPLUGIN
  !define WITHPLUGIN 1
!endif
!ifndef OUTFILE
  !define OUTFILE "Spark-Setup.exe"
!endif

Name "Spark"
OutFile "${OUTFILE}"
InstallDir "$APPDATA\Vencord"
RequestExecutionLevel user
BrandingText "Spark · Vencord BdCompat"
SetCompressor /SOLID lzma

!define MUI_ICON "spark.ico"
!define MUI_UNICON "spark.ico"
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "Spark est installe"
!if ${WITHPLUGIN} == 1
  !define MUI_FINISHPAGE_TEXT "Vencord BdCompat et le plugin AutoQuest sont installes et actives.$\r$\n$\r$\nRelance Discord pour en profiter."
!else
  !define MUI_FINISHPAGE_TEXT "Vencord BdCompat est installe et active.$\r$\n$\r$\nRelance Discord pour en profiter."
!endif
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_LANGUAGE "English"

Section "Spark" SEC01
  SetOutPath "$INSTDIR\dist"
  File /r "payload\dist\*.*"

  SetOutPath "$INSTDIR"
  File "patch.ps1"
  File "unpatch.ps1"

!if ${WITHPLUGIN} == 1
  SetOutPath "$INSTDIR\bdPlugins"
  File "payload\AutoQuest.plugin.js"
!endif

  DetailPrint "Injection de Vencord dans Discord..."
  SetOutPath "$INSTDIR"
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\patch.ps1" -WithPlugin ${WITHPLUGIN}'
  Pop $0
  DetailPrint "patch.ps1 code: $0"

  WriteUninstaller "$INSTDIR\Uninstall-Spark.exe"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark" "DisplayName" "Spark (Vencord BdCompat)"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark" "UninstallString" "$\"$INSTDIR\Uninstall-Spark.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark" "DisplayIcon" "$INSTDIR\dist\patcher.js"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark" "Publisher" "Spark"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark" "NoModify" "1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark" "NoRepair" "1"
SectionEnd

Section "Uninstall"
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\unpatch.ps1"'
  Pop $0
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\bdPlugins"
  Delete "$INSTDIR\patch.ps1"
  Delete "$INSTDIR\unpatch.ps1"
  Delete "$INSTDIR\Uninstall-Spark.exe"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Spark"
SectionEnd
