const {
    contextBridge,
    ipcRenderer
} = require("electron");

const fs = require('fs');
const path = require('path');

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
        getContent: (url) => { 
            /**
             * Buffer to Array Buffer
             * @param {*} buf the input buffer
             * @return an Array Buffer
             * 
             */
            function toArrayBuffer(buf) {
                var ab = new ArrayBuffer(buf.length);
                var view = new Uint8Array(ab);

                for (var i = 0; i < buf.length; ++i) {
                    view[i] = buf[i];
                }

                return ab;

            }
            
            let parsedUrl = new URL(url);
            let pathname = path.normalize(path.toNamespacedPath(parsedUrl.pathname).startsWith("\\\\?\\") 
                         ? parsedUrl.pathname.replace(/^\/*/, '')
                         : parsedUrl.pathname);

            return toArrayBuffer(fs.readFileSync(pathname));

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