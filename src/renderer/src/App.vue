<script setup lang="ts">
import { Ref, ref } from 'vue';

const close = () => window.electron.ipcRenderer.send('close');
const libraries = ref<{ name: string, items: { name: string; path: string; icon: string }[]}[]>([]);

let isRecording: Ref<boolean> = ref(false);
let showSettings: Ref<boolean> = ref(false);
let showLibraries: Ref<boolean> = ref(false);
let currentLibrary: Ref<string> = ref("default");

window.electron.ipcRenderer.send('getLibraries');
window.electron.ipcRenderer.on('getLibraries', (_, librariesList) => {
    libraries.value = librariesList;
});

window.electron.ipcRenderer.send('getCurrentLibrary');
window.electron.ipcRenderer.on('getCurrentLibrary', (_, pastCurrentList) => {
    currentLibrary.value = pastCurrentList;
});

const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
};

async function addFile(fileName: string, filePath: string) {
    if (!filePath.endsWith('.exe') && !filePath.endsWith('.url') && !filePath.endsWith('.lnk')) {
        alert('Please use an exe');
        return;
    }

    const library = libraries.value.find(l=>l.name==currentLibrary.value);
    if(!library) {
        alert('Library doesn\'t exist');
        return;
    }

    if (library.items.filter(i=>i.path==filePath).length > 0) {
        alert('File already exist');
        return;
    }

    try {
        const iconPath = await window.electron.ipcRenderer.invoke('getIcon', filePath);
        library.items.push({ name: fileName, path: filePath, icon: iconPath });
        window.electron.ipcRenderer.send("updateLibraries", JSON.stringify(libraries.value));
    } catch (error) {
        console.error(error);
    }
}

const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    
    const library = libraries.value.find(l=>l.name==currentLibrary.value);
    if(!library) {
        alert('Library doesn\'t exist');
        return;
    }
    
    const files = event.dataTransfer?.files;
    if (files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await addFile(file.name, file.path);
        }
    }
};

const addItemInLibrary = () => {
    window.electron.ipcRenderer.invoke('openFileDialog')
    .then(async ({fileName, filePath}) => {
        if (filePath && fileName) {
            await addFile(fileName, filePath);
        }
        })
        .catch((error) => {
            console.error('Error selecting file:', error);
        });
    }
    
    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

const selectLibrary = (libraryName: string) => {
    currentLibrary.value = libraryName;
    // showLibraries.value = false;
    window.electron.ipcRenderer.send("updateCurrentLibrary", currentLibrary.value);
}

const createLibrary = () => {
    libraries.value.push({name: `library_${uuidv4().slice(0, 7)}`, items: []});
    window.electron.ipcRenderer.send("updateLibraries", JSON.stringify(libraries.value));
}

const deleteItemFromList = (item: any) => {
    libraries.value = libraries.value.map(library => {
        if (library.name === currentLibrary.value) {
            return {
                ...library,
                items: library.items.filter(a => a.path !== item.path)
            };
        }
        return library;
    });
    
    window.electron.ipcRenderer.send("updateLibraries", JSON.stringify(libraries.value));
}

const deleteLibraryFromList = (libraryName: string) => {
    libraries.value = libraries.value.filter(library => library.name != libraryName);
    
    window.electron.ipcRenderer.send("updateLibraries", JSON.stringify(libraries.value));
}

let clicks = 0;
let timeout = null;
const handleClick = (path: string) => {
    timeout ? clearTimeout(timeout) : {};
    clicks++;
    if(clicks == 1) {
        setTimeout(()=> {
            // element.setAttribute("editable", "true");
            console.log("rename")
            clicks = 0;
        }, 500);
    } else if (clicks == 2) {
        clicks = 0;
        runProgram(path);
    }
}

const runProgram = (path: string) => {
    window.electron.ipcRenderer.send("runProgram", path);
}

const record = () => {
    isRecording.value = true;
}

const stopRecord = () => {
    isRecording.value = false;
}

</script>

<template>
    <div class="container" v-if="!showSettings">
        <div class="top-bar">
            <div class="libraries btn" v-if="!showLibraries" v-on:click="showLibraries = true" v-tooltip="{ value: 'Show libraries', showDelay: 600, hideDelay: 200 }">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-sitemap"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M15 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M6 15v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1" /><path d="M12 9l0 3" /></svg>
            </div>
            <div class="back btn" v-if="showLibraries" v-on:click="showLibraries = false" v-tooltip="{ value: 'Back', showDelay: 600, hideDelay: 200 }">
                <svg style="transform: translateX(-2px);"  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
            </div>
            <div class="search-bar" v-tooltip="{ value: 'Search a title in the current list', showDelay: 600, hideDelay: 200 }">
                <input type="text" placeholder="Search...">
            </div>
            <div class="buttons">
                <div class="add btn" v-on:click="showLibraries ? createLibrary() : addItemInLibrary()" v-tooltip="{ value: showLibraries ? 'Create new library' : 'Add a new item manually', showDelay: 600, hideDelay: 200 }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>                
                </div>
                <div class="voice-record btn" v-if="!isRecording" v-on:click="record()" v-tooltip.bottom="{ value: 'Voice command', showDelay: 600, hideDelay: 200 }">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-microphone"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 2m0 3a3 3 0 0 1 3 -3h0a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3z" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M8 21l8 0" /><path d="M12 17l0 4" /></svg>
                </div>
                <div class="voice-record-stop btn" v-if="isRecording" v-on:click="stopRecord()" v-tooltip.bottom="{ value: 'Stop', showDelay: 600, hideDelay: 200 }">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-player-stop"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 4h-10a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3 -3v-10a3 3 0 0 0 -3 -3z" /></svg>
                </div>
                <div class="settings btn" v-on:click="showSettings = true" v-tooltip.bottom="{ value: 'Show settings', showDelay: 600, hideDelay: 200 }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                </div>
                <div class="close btn" v-on:click="close()" v-tooltip.left="{ value: 'Minimize', showDelay: 600, hideDelay: 200 }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                </div>
            </div>
        </div>
        <div class="content" v-bind:class="!libraries.find(l=>l.name==currentLibrary) || libraries.find(l=>l.name==currentLibrary)?.items.length === 0 ? 'center' : ''" v-if="!showLibraries" @dragover="handleDragOver" @drop="handleDrop">
            <h3 v-if="!libraries.find(l=>l.name==currentLibrary) || libraries.find(l=>l.name==currentLibrary)?.items.length === 0" class="empty">Drag and drop or click the + to add your first item</h3>
            <ul v-else>
                <li v-for="(item, index) in libraries.find(l=>l.name==currentLibrary)?.items" :key="index" style="word-break: break-all;" v-on:click="handleClick(item.path)" v-on:contextmenu="deleteItemFromList(item)" v-tooltip="{ value: 'Click to open, Double click to rename, Right click to delete', showDelay: 600, hideDelay: 200 }">
                    <img :src="item.icon" width="40px">
                    <span editable="false">
                        {{ item.name.replace(".exe", "").replace(".url", "").replace(".lnk", "") }}
                    </span>
                </li>
            </ul>
        </div>
        
        <div class="content" v-if="showLibraries">
            <div class="libraries">
                <div class="library" v-bind:class="currentLibrary == library.name ? 'active' : ''" v-for="(library) in libraries" v-on:click="selectLibrary(library.name)" v-on:contextmenu="deleteLibraryFromList(library.name)" v-tooltip="{ value: 'Click to open, Right click to delete', showDelay: 600, hideDelay: 200 }">
                    {{ library.name.charAt(0).toUpperCase() + library.name.slice(1) }} - {{ library.items.length }} items
                </div>
            </div>
        </div>
    </div>

    <!-- settings -->
    <div class="container" v-if="showSettings">
        <div class="top-bar">
            <div class="back btn" v-on:click="showSettings = false" v-tooltip="{ value: 'Back', showDelay: 600, hideDelay: 200 }">
                <svg style="transform: translateX(-2px);"  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
            </div>
        </div>
        <div class="content">
            
        </div>
    </div>
</template>
