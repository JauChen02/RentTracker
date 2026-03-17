Set oShell = CreateObject("WScript.Shell")

' Get the folder this script is sitting in
strFolder = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Create shortcut on the desktop
strDesktop = oShell.SpecialFolders("Desktop")
Set oLink = oShell.CreateShortcut(strDesktop & "\Rent Ledger.lnk")

oLink.TargetPath   = strFolder & "RentLedger.html"
oLink.IconLocation = strFolder & "RentLedger.ico"
oLink.Description  = "Rent Ledger"
oLink.Save

MsgBox "Done! A Rent Ledger shortcut has been added to your desktop.", 64, "Rent Ledger Setup"
