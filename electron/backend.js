const {app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, session} = require('electron/main')
const {exec} = require('child_process')
const path = require('path')
// const http = require("http");
const fs = require("fs");

app.commandLine.appendSwitch('charset', 'utf-8');
process.env.CACHE_PATH = path.join(__dirname, 'cache')
process.env.FFMPEG_PATH = path.join(__dirname, 'ffmpeg', 'ffmpeg.exe');

let win;
let filename;

const createWindow = (log) => {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        minWidth: 400,
        minHeight: 140,
        fullscreenable: false,
        autoHideMenuBar: true,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.on('maximize', () => {
        win.webContents.send('set-maximized-icon')
    })

    win.on('unmaximize', () => {
        win.webContents.send('set-unmaximized-icon')
    })

    if (process.env.IS_DEV) {
        win.loadURL('http://localhost:8192').then(() => {
            win.webContents.send('logs-out', log)
        })
        win.openDevTools()
    } else {
        win.loadFile('./dist/index.html').then(() => {
            win.webContents.send('logs-out', log)
        })
    }
}

// const server = http.createServer((req, res) => {
//     let filePath = decodeURIComponent(req.url.slice(1))
//     let fileExists;
//     if (filePath.endsWith('.atlas')) {
//         let txtPath = filePath + '.txt'
//         filePath = (fs.existsSync(filePath) && filePath) || (fs.existsSync(txtPath) && txtPath)
//         fileExists = !!filePath
//     } else {
//         fileExists = fs.existsSync(filePath)
//     }
//     if (!fileExists) {
//         res.writeHead(404);
//         res.end('File not found');
//         return;
//     }
//
//     fs.readFile(filePath, (err, data) => {
//         if (err) {
//             res.writeHead(500);
//             res.end('Error loading file');
//             return;
//         }
//         res.writeHead(200);
//         res.end(data);
//     });
// });
//
// server.listen(0, 'localhost', () => {
// });


app.whenReady().then(() => {
    let log = {
        error: ''
    }
    if (!fs.existsSync(process.env.CACHE_PATH)) {
        fs.mkdirSync(process.env.CACHE_PATH, {recursive: true});
    }
    if (!fs.existsSync(process.env.FFMPEG_PATH)) {
        log.error = 'ffmpeg not found!'
    }

    createWindow(log)

    session.defaultSession.webRequest.onBeforeRequest({urls: ['file://*']}, (details, callback) => {
        let reqUrl = details.url
        const filePath = decodeURIComponent(reqUrl.slice(8))

        if (filePath.endsWith('.atlas') && !fs.existsSync(filePath)) {
            reqUrl = reqUrl + '.txt'
            callback({redirectURL: reqUrl})
        } else {
            callback({cancel: false})
        }
    })

    ipcMain.handle('port', () => server.address().port)
    ipcMain.on('minimize', () => win.minimize())
    ipcMain.on('toggle-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize())
    ipcMain.on('close', () => win.close())
    ipcMain.on('show-context-menu', (ev) => {
        const contextMenu = new Menu();
        contextMenu.append(new MenuItem({
            label: '复制图像',
            click: () => {
                win.webContents.send('copy-image')
            }
        }));
        contextMenu.popup(win, ev.x, ev.y);
    })

    ipcMain.handle('save-image', (ev, ab) => {
        const imagePath = dialog.showSaveDialogSync(win, {
            title: '保存图片',
            defaultPath: 'save.png',
            properties: ['createDirectory']
        })
        if (imagePath) {
            try {
                fs.writeFileSync(imagePath, Buffer.from(ab))
            } catch (e) {
                return e
            }
            return true
        }
        return false
    })

    // 导出gif相关
    ipcMain.handle('select-export-path', () => {
        const exportPath = dialog.showOpenDialogSync(win, {
            title: '输出文件夹',
            properties: ['openDirectory']
        })
        return exportPath ? exportPath[0] : ''
    })
    ipcMain.handle('prepare-export', (ev, name) => {
        filename = name.replace(/[\\/:"*?<>|]/g, '_')
        fs.mkdirSync(path.join(process.env.CACHE_PATH, filename), {recursive: true});
    })
    ipcMain.handle('save-image-cache', (ev, image) => saveBase64Image(image))
    ipcMain.handle('ffmpeg', (ev, options) => {
        const imagePath = path.join(process.env.CACHE_PATH, filename)
        const outputPath = options.path
        let instruction;
        switch (options.format) {
            case 'MP4':
                instruction = `"${process.env.FFMPEG_PATH}" -y -r ${options.framerate} -i "${path.join(imagePath, '%05d.png')}" -vf "crop=if(mod(iw\\,2)\\,iw-1\\,iw):if(mod(ih\\,2)\\,ih-1\\,ih)" -crf 17 -pix_fmt yuv420p "${path.join(outputPath, options.filename + '.mp4')}"`
                break
            case 'GIF':
            default:
                instruction = `"${process.env.FFMPEG_PATH}" -y -r ${options.framerate} -i "${path.join(imagePath, '%05d.png')}" "${path.join(outputPath, options.filename + '.gif')}"`
                break
        }
        exec(instruction, (error, stdout, stderr) => {
            fs.readdir(imagePath, (err, files) => {
                    files.forEach(file => {
                        const filePath = path.join(imagePath, file);
                        fs.unlinkSync(filePath)
                    })
                    fs.rmdirSync(imagePath)
                }
            )
            win.webContents.send('export-complete')
            win.webContents.send('logs-out', {stdout, stderr})
        })
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


// 将 base64 格式的图片保存为本地文件
function saveBase64Image(image) {
    const base64Image = image.data.split(';base64,').pop();
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(path.join(process.env.CACHE_PATH, filename, `${image.index}.png`), imageBuffer)
    return true
}