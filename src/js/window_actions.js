const { ipcRenderer } = require('electron');
const shell = require('electron').shell;

module.exports = {
    doWin: function (e, action) {
        if (action == 'minimize') { ipcRenderer.send('minimize-app'); }
        else if (action == 'maximize') { ipcRenderer.send('maximize-app'); }
        else if (action == 'close') { ipcRenderer.send('close-app'); }
        else if (action == 'devtools') { ipcRenderer.send('devtools'); }
        
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    },

    openInBrowser: function (link) {
        shell.openExternal(link);
    }
}