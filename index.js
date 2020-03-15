const electron = require('electron');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const {app, BrowserWindow, Menu, ipcMain} = electron;

let todayWindow;
let createWindow;
let listWindow;

let allAppointments = [];

fs.readFile('appointments.json', (err, jsonAppointments) => {
    if (!err) {
        const oldAppointments = JSON.parse(jsonAppointments);
        allAppointments = oldAppointments;
    }
});

app.allowRendererProcessReuse = true;
app.on('ready', () => {
    todayWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        title: "Doctor Appointment"
    });
    todayWindow.loadURL(`file://${__dirname}/today.html`);

    todayWindow.on('closed', () => {
        const jsonAppointments = JSON.stringify(allAppointments);
        fs.writeFileSync('appointments.json', jsonAppointments);
        app.quit();
        todayWindow = null;
    });

    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);

});

ipcMain.on('appointment:create', (event, appointment) => {
    appointment['id'] = uuidv4();
    appointment['done'] = 0;
    allAppointments.push(appointment);

    // update today window
    sendTodayAppointments();
    createWindow.close();
});

ipcMain.on('appointment:request:list', event => {
    listWindow.webContents.send('appointment:response:list', allAppointments);
});

ipcMain.on('appointment:request:today', event => {
    sendTodayAppointments();
});

ipcMain.on('appointment:done', (event, id) => {
    allAppointments.forEach(app => {
        if (app.id === id) app.done = 1;
    });
    sendTodayAppointments();
});

const createWindowCreator = () => {
    createWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 600,
        height: 400,
        title: "Create new Appointment"
    });

    createWindow.setMenu(null);

    createWindow.loadURL(`file://${__dirname}/create.html`);

    createWindow.on('closed', () => {
        createWindow = null;
    });
};

const sendTodayAppointments = () => {
    const today = new Date().toISOString().slice(0, 10);
    const filteredAppointments = allAppointments.filter(appointment => appointment.date === today);
    todayWindow.webContents.send('appointment:response:today', filteredAppointments);
}

const createWindowList = () => {
    listWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 600,
        height: 400,
        title: "List Appointments"
    });

    listWindow.setMenu(null);

    listWindow.loadURL(`file://${__dirname}/list.html`);

    listWindow.on('closed', () => {
        listWindow = null;
    });
};



const menuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label: "New Appointment",
                click() {
                    createWindowCreator();
                }
            },  
            {
                label: "All Appointments",
                click() {
                    createWindowList();
                }
            },
            {
                label: "Quit",
                accelerator: process.platform === "darwin" ? "Command+Q" : "Ctrl+Q",
                click() {
                    app.quit();
                }
            },
                        
        ]
    },
    {
        label: "View",
        submenu: [
            {
                role: "reload"
            },  
            {
                role: "toggledevtools"
            },                          
        ]
    },

]