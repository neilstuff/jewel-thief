const {
    contextBridge,
    ipcRenderer
} = require("electron");

const fs = require('fs');
const os = require('os');

contextBridge.exposeInMainWorld(
    "api", {
        quit: () => {
            ipcRenderer.send('quit');
        },
        maximize: () => {
            ipcRenderer.send('maximize');
        },
        unmaximize: () => {
            ipcRenderer.send('unmaximize');
        },
        minimize: () => {
            ipcRenderer.send('minimize');
        },
        isMaximized: () => {
            return ipcRenderer.sendSync('isMaximized');;
        },
        showOpenDialog: () => {
            return ipcRenderer.sendSync('showOpenDialog');
        },
        showSaveDialog: (filename) => {
            return ipcRenderer.sendSync('showSaveDialog', filename);
        },
        showPrintDialog: () => {
            return ipcRenderer.sendSync('showPrintDialog');
        },
        printToPdf: (filename) => {
            return ipcRenderer.send('printToPdf', filename);
        },
        openUrl: (url) => {
            return ipcRenderer.send('openUrl', url);
        },
        fs: () => {
            return fs;
        },
        os: () => {
            return os;
        },
        on: (message, callback) => {
            ipcRenderer.on(message, (event, path) => {
                console.log("received message");
                callback()
            });
        },
        log: (message) => {
            console.log(message);
        }
    }

);