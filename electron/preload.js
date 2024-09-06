const {ipcRenderer} = require('electron')

window.ipcRenderer = ipcRenderer;

// (async ()=>{
//     window.port = await ipcRenderer.invoke('port')
// })()