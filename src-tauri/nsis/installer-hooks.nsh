; SilentWatch NSIS Installer Setup Hook
; Asks monitoring & tray preferences during installation so the app launches directly to the dashboard.

!macro NSIS_HOOK_POSTINSTALL
  CreateDirectory "$LOCALAPPDATA\SilentWatch"

  ; Ask background tray monitoring preference during setup
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Keep SilentWatch monitoring in the Windows System Tray when you close the window?$\r$\n$\r$\n• Yes: Closing the window hides SilentWatch to the tray so background monitoring continues (you can stop services or quit anytime from the tray icon).$\r$\n• No: Closing the window stops monitoring and exits immediately." \
    IDYES sw_tray_yes IDNO sw_tray_no

  sw_tray_yes:
    StrCpy $0 "hide_to_tray"
    Goto sw_write_prefs
  sw_tray_no:
    StrCpy $0 "stop_and_quit"

  sw_write_prefs:
    FileOpen $1 "$LOCALAPPDATA\SilentWatch\installer_prefs.json" w
    FileWrite $1 '{"close_behavior":"$0","privilege_mode":"standard_per_user","show_release_video":true}'
    FileClose $1
!macroend
