import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import getFileIcon from 'extract-file-icon';
import fs from 'fs';
import { exec } from 'child_process';

let mainWindow : BrowserWindow | null = null;

// TODO: hide window in the windows bottom nav bar
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

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// TODO: implement tray
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    const saveIconToFile = (iconBuffer: Buffer, exePath: string): string => {
        if (!iconBuffer || !iconBuffer.length) {
            throw new Error('Invalid icon buffer');
        }
    
        const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
        const isyLauncherFolder = path.join(appDataPath, 'IsyLauncher');

        const outputDir = path.join(isyLauncherFolder, 'icons');
        
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
    

    // TODO: put it in another file
    // IPC
    ipcMain.on('close', () => mainWindow?.close()); // TODO: close will minimize

    ipcMain.handle('getIcon', async (_, exePath) => {
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
        exec(`"${path}"`, function(err, _) {
            console.log(err)
        });
    });

    ipcMain.on('updateLibraries', (_, libraries) => {
        const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
        const isyLauncherFolder = path.join(appDataPath, 'IsyLauncher');
        
        if (!fs.existsSync(isyLauncherFolder)) {
            fs.mkdirSync(isyLauncherFolder, { recursive: true });
        }
        
        const filePath = path.join(isyLauncherFolder, `libraries.json`);
        fs.writeFileSync(filePath, libraries);
    });

    ipcMain.on('getLibraries', () => {
        const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
        const isyLauncherFolder = path.join(appDataPath, 'IsyLauncher');
        const filePath = path.join(isyLauncherFolder, `libraries.json`);
    
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            mainWindow?.webContents.send("getLibraries", JSON.parse(data));
        } else {
            mainWindow?.webContents.send("getLibraries", [{name: 'default', items: []}]);
        }
    });

    ipcMain.on('updateCurrentLibrary', (_, currentLibrary) => {
        const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
        const isyLauncherFolder = path.join(appDataPath, 'IsyLauncher');
        
        if (!fs.existsSync(isyLauncherFolder)) {
            fs.mkdirSync(isyLauncherFolder, { recursive: true });
        }
        
        const filePath = path.join(isyLauncherFolder, `currentLibrary.json`);
        fs.writeFileSync(filePath, JSON.stringify({currentLibrary}));
    });

    ipcMain.on('getCurrentLibrary', () => {
        const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
        const isyLauncherFolder = path.join(appDataPath, 'IsyLauncher');
        const filePath = path.join(isyLauncherFolder, `currentLibrary.json`);
    
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            mainWindow?.webContents.send("getCurrentLibrary", JSON.parse(data).currentLibrary);
        } else {
            mainWindow?.webContents.send("getCurrentLibrary", 'default');
        }
    });

    ipcMain.handle('openFileDialog', async () => {
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
