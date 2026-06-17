Place the favicon image provided in the project root here and name it `favicon.png`.

Path to save:
frontend/src/assets/images/favicon.png

How to save from your local machine (PowerShell):
1. Download the attached image file from the chat.
2. Move or copy it into this folder and rename it:

```powershell
Move-Item -Path C:\Users\You\Downloads\the-image.png -Destination .\favicon.png
```

Optional: to generate `.ico` from the PNG, use an online converter or ImageMagick:

```powershell
magick convert favicon.png -define icon:auto-resize=64,48,32,16 favicon.ico
```

After placing `favicon.png`, reload the dev server. The favicon link in `index.html` points to `/src/assets/images/favicon.png`.
