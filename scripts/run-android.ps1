<#
.SYNOPSIS
Builds the app and installs it on the connected Android device.

.DESCRIPTION
Points the Android SDK and the JDK that ships with Android Studio at this one
process, so nothing has to be set in the shell or stored permanently, and then
hands over to `expo run:android`. Any argument is passed straight through, so
`--device`, `--variant release` and the rest still work.

Only needed when something native changes: a dependency with native code, the
plugins or permissions in app.json, or the splash screen. For JavaScript and
TypeScript changes, run `npx expo start` and open the app already installed on
the device.
#>
$ErrorActionPreference = 'Stop'

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

<#
.DESCRIPTION
Devices that are connected and authorised, which is every line of `adb devices`
ending in `device`: one waiting for the authorisation dialog reads
`unauthorized` and does not count. Stopping here when there is none saves the
whole Gradle build, which would only fail at the end, when installing.
#>
$connected = & adb devices |
  Select-Object -Skip 1 |
  Where-Object { $_ -match "`tdevice$" }

if (-not $connected) {
  throw 'No authorised Android device. Turn wireless debugging on and pair it again (Android Studio > Device Manager > Pair using Wi-Fi), or plug the cable in and accept the dialog on the phone.'
}

npx expo run:android @args
