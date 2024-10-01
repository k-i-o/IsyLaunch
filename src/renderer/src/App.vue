<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Tooltip from 'primevue/tooltip';

const close = () => window.electron.ipcRenderer.send('close');
const items = ref<File[]>([]);

const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
};

const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
        for (let i = 0; i < files.length; i++) {
            items.value.push(files[i]);
        }
    }
};

// Ensure the application allows files to be dropped
onMounted(() => {
    window.addEventListener('dragover', (event) => event.preventDefault());
    window.addEventListener('drop', (event) => event.preventDefault());
});
</script>

<template>
    <div class="container">
        <div class="top-bar">
            <div class="libraries btn" v-tooltip="{ value: 'Show libraries', showDelay: 600, hideDelay: 200 }">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-sitemap"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M15 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M6 15v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1" /><path d="M12 9l0 3" /></svg>
            </div>
            <div class="search-bar" v-tooltip="{ value: 'Search a title in the current list', showDelay: 600, hideDelay: 200 }">
                <input type="text" placeholder="Search...">
            </div>
            <div class="buttons">
                <div class="add btn" v-tooltip="{ value: 'Add a new item manually', showDelay: 600, hideDelay: 200 }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>                
                </div>
                <div class="settings btn" v-tooltip.bottom="{ value: 'Show settings', showDelay: 600, hideDelay: 200 }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                </div>
                <div class="close btn" v-on:click="close()" v-tooltip.left="{ value: 'Minimize', showDelay: 600, hideDelay: 200 }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                </div>
            </div>
        </div>
        <div class="content" @dragover="handleDragOver" @drop="handleDrop">
            <h3 v-if="items.length === 0" class="empty">Drag and drop or click the + to add your first item</h3>
            <ul v-else>
                <li v-for="(file, index) in items" :key="index">{{ file.name }}</li>
            </ul>
        </div>
    </div>
</template>
