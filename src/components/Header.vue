<template>
    <header id="header">
    <span class="title icon">
        <img src="../assets/image/otogi.ico" alt="">
        Spine Viewer
    </span>
        <button class="control-button minimize" @click="minimize">一</button>
        <button class="control-button maximize" @click="toggleMaximize" id="maximize-icon">{{ maximizeIcon }}</button>
        <button class="control-button close" @click="close">✖</button>
    </header>
</template>

<script setup>
import {ref} from "vue";

let maximizeIcon = ref('▢')
const minimize = () => {
    ipcRenderer.send('minimize')
}

const toggleMaximize = () => {
    ipcRenderer.send('toggle-maximize')
}

const close = () => {
    ipcRenderer.send('close')
}

ipcRenderer.on('set-maximized-icon', () => maximizeIcon.value = '❐')
ipcRenderer.on('set-unmaximized-icon', () => maximizeIcon.value = '▢')
</script>

<style scoped>
header {
    z-index: 1;
    color: white;
    height: 40px;
    display: flex;
    position: relative;
    align-items: center;
    justify-content: flex-end;
    background-color: #333333;
    box-shadow: #252525 0 0 2px 1px;
    -webkit-app-region: drag
}

.title.icon {
    left: 7px;
    gap: 10px;
    height: 100%;
    padding: 3px;
    display: flex;
    font-size: 20px;
    position: absolute;
    align-items: center;
}

.title.icon img {
    height: 100%;
    border-radius: 7px
}

.control-button {
    width: 50px;
    height: 40px;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    background-color: transparent;
    -webkit-app-region: no-drag
}

.control-button:hover {
    background-color: #666666;
}

.control-button:active {
    background-color: #505050;
}

.control-button.close:hover {
    background-color: #de5757;
}

.control-button.close:active {
    background-color: #f11111;
}
</style>