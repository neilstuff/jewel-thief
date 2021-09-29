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

    mainWindow.loadURL(`pug:///${path.join(__dirname, 'index.pug')}`);


    mainWindow.on('closed', () => {

        mainWindow = null

    })

}

app.allowRendererProcessReuse = true;

app.on('ready', function () {

    protocol.registerBufferProtocol('pug', function (request, callback) {
        let parsedUrl = new URL(request.url);
        let pathname = path.normalize(path.toNamespacedPath(parsedUrl.pathname).startsWith("\\\\?\\") ?
                                parsedUrl.pathname.replace('/', '') :  parsedUrl.pathname);
        let ext = path.extname(pathname);

        switch (ext) {
            case '.pug':
                var content = pug.renderFile(pathname);

                callback({
                    mimeType: 'text/html',
                    data: new Buffer.from(content)
                });
                break;

            default:
                let output = fs.readFileSync(pathname);

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