' Pothys Swarna Mahal — Silent Background Presentation Launcher
Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
If CreateObject("Scripting.FileSystemObject").FileExists(strPath & "\Launch_Presentation.exe") Then
    WshShell.Run """" & strPath & "\Launch_Presentation.exe""", 1, False
Else
    WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPath & "\server.ps1""", 0, False
End If
Set WshShell = Nothing

