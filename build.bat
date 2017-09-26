cd /d %~dp0
pushd userscript\chromeExtension
7z a chromeExtension.zip *.*
move chromeExtension.zip chromeExtension.crx
popd
move /y "userscript\chromeExtension\chromeExtension.crx" "dist\chromeExtension.crx"