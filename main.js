'use strict';

const config = require('./config.json');

const electron = require('electron');

const { app } = electron;
const { protocol } = electron;
const { ipcMain } = electron;
const { dialog } = electron;
const { shell } = electron;
const { webContents } = electron;
const { contextBridge } = electron;

const BrowserWindow = electron.BrowserWindow;

const mime = require('mime');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const pug = require('pug');

const locals = {};

var mainWindow = null;

function createWindow() {
    var extend = config.mode == "debug" ? 500 : 0;

    mainWindow = new BrowserWindow({
        width: 128 * 3 + 24 + extend, 
        height: 128 * 3 + 99,
        resizable: false,
        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            nativeWindowOpen: true,
            preload: path.join(__dirname, "preload.js")
        }

    });

    mainWindow.setMenu(null);

    if (config.mode == "debug") {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.pug'),
        protocol: 'pug',
        slashes: true
    }))

    mainWindow.on('closed', () => {

        mainWindow = null

    })

}

app.allowRendererProcessReuse = true;

app.on('ready', function () {

    protocol.registerBufferProtocol('pug', function (request, callback) {
        let parsedUrl = require('url').parse(request.url);
        var url = path.normalize(request.url.replace(os.type() == 'Windows_NT' ? 'pug:///' : 'pug://', ''));
        let ext = path.extname(url);

        console.log(url);

        switch (ext) {
            case '.pug':
                var content = pug.renderFile(url);

                callback({
                    mimeType: 'text/html',
                    data: new Buffer.from(content)
                });
                break;

            default:
                let output = fs.readFileSync(url);

                return callback({ data: output, mimeType: mime.getType(ext) });
        }

    });

    createWindow();

});

app.on('window-all-closed', () => {

    app.quit()

})

app.on('activate', () => {

    if (mainWindow === null) {
        createWindow()
    }

})