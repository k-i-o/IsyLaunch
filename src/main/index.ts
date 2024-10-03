import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import getFileIcon from 'extract-file-icon';
import fs from 'fs';
import { exec } from 'child_process';

let mainWindow : BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 300,
        minHeight: 200,
        minWidth: 500,
        show: false,
        frame: false,
        transparent: true,
        autoHideMenuBar: true,
        alwaysOnTop: true,
        icon,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            // contextIsolation: true,
            webSecurity: false,
            // nodeIntegration: true,
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    const saveIconToFile = (iconBuffer: Buffer, exePath: string): string => {
        if (!iconBuffer || !iconBuffer.length) {
            throw new Error('Invalid icon buffer');
        }
    
        const outputDir = path.join(__dirname, 'icons');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    
        const filePath = path.join(outputDir, `${path.basename(exePath, path.extname(exePath))}_icon.png`);
    
        try {
            fs.writeFileSync(filePath, iconBuffer);
            return filePath;
        } catch (error) {
            console.error(`Failed to save icon: ${error}`);
            throw new Error('Could not save icon file');
        }
    };
    

    // IPC
    ipcMain.on('close', () => mainWindow?.close());

    ipcMain.handle('get-icon', async (_, exePath) => {
        try {
            const iconBuffer = getFileIcon(exePath, 32);
            const savedFilePath = saveIconToFile(iconBuffer, exePath);
            return savedFilePath;
        } catch (error) {
            console.error(error);
            throw new Error('Could not retrieve icon');
        }
    });

    ipcMain.on('runProgram', (_, path) => {
        exec(`start '${path}'`, function(err, _) {
            console.log(err)
        });
    });

    ipcMain.handle('open-file-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Files', extensions: ['exe', 'url', 'lnk'] },
            ]
        });
    
        if (result.canceled) {
            return null;
        } else {
            return {fileName: path.basename(result.filePaths[0]), filePath: result.filePaths[0]};
        }
    });

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
