'use strict';

const config = require('./config.json');

const electron = require('electron');

const { app } = electron;
const { protocol } = electron;

const BrowserWindow = electron.BrowserWindow;

const mime = require('mime');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os')

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
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }))

    mainWindow.on('closed', () => {

        mainWindow = null

    })

}

app.allowRendererProcessReuse = true;

app.on('ready', () => {

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