<template>
    <div id="global-side" :class="displayClass">
        <div class="row">
            <label for="color-input" title="Background Color">{{ $t('globalSide.backgroundColor') }}</label>
            <span class="bg-wrap">
                <span title="Transparent">{{ $t('globalSide.transparent') }}</span>
                <span class="i-checkbox-wrap">
                    <input type="checkbox" id="bg-transparent" class="i-checkbox"
                           v-model="sceneStore.transparent">
                    <label for="bg-transparent" class="i-label"></label>
                </span>
                <input type="color" id="color-input"
                       v-model="sceneStore.backgroundColor"
                       v-bind:disabled="sceneStore.transparent">
            </span>
        </div>
        <div class="row">
            <button @click="addContainer" title="Add" class="side-button-small">{{ $t('globalSide.add') }}</button>
            <button @click="removeContainer" title="Remove" class="side-button-small">{{
                    $t('globalSide.remove')
                }}
            </button>
            <button @click="resetAll" title="Reset All" class="side-button-small">{{
                    $t('globalSide.resetAll')
                }}
            </button>
        </div>
        <div class="row">
            <button @click="shiftUpContainer" title="Shift Up" class="side-button-small">{{
                    $t('globalSide.shiftUp')
                }}
            </button>
            <button @click="shiftDownContainer" title="Shift Down" class="side-button-small">
                {{ $t('globalSide.shiftDown') }}
            </button>
            <span class="bg-wrap">
                <span title="Superposition" style="white-space: nowrap">{{ $t('globalSide.superposition') }}</span>
                <span class="i-checkbox-wrap">
                    <input type="checkbox" id="superposition" class="i-checkbox"
                           v-model="appStore.superposition">
                    <label for="superposition" class="i-label"></label>
                </span>
             </span>
        </div>
        <div class="row">
            <span title="Current Selection">{{ $t('globalSide.currentSelection') }}:</span>
            <span>{{ appStore.activeIndex }}</span>
        </div>
        <ItemBar/>
        <div class="row">
            <button @click="playAllAnimationQueue" title="Play Queue" class="side-button-big">
                {{ $t('globalSide.playQueue') }}
            </button>
            <button @click="exportStore.show" title="Export Animation" class="side-button-big">
                {{ $t('globalSide.exportAnimation') }}
            </button>
        </div>
        <div class="row">
            <button @click="cancelAllHidden" title="Unhide" class="side-button-big">{{
                    $t('globalSide.unhide')
                }}
            </button>
            <button @click="saveImage" title="Save Image" class="side-button-big">{{
                    $t('globalSide.saveImage')
                }}
            </button>
        </div>
        <div class="tips">
            <span title="Press Ctrl+Shift+I to open the console">{{ $t('globalSide.checkConsole') }}</span>
            <span title="Middle mouse button collapse/expand">{{ $t('globalSide.tips') }}</span>
        </div>
    </div>
</template>

<script setup>
import ItemBar from "@/components/ItemList.vue";
import {inject, ref} from "vue";
import {useSceneStore} from "@/stores/scene";
import {useAppStore} from "@/stores/app";
import useApp from "@/hooks/useApp";
import {useExportStore} from "@/stores/export";
import {getById} from "@/utils/util";

const pixiApp = inject('pixiApp')
const appStore = useAppStore()
const sceneStore = useSceneStore()
const exportStore = useExportStore()

let displayClass = ref('show')

const {
    addContainer,
    removeContainer,
    shiftUpContainer,
    shiftDownContainer,
    resetAll,
    cancelAllHidden,
    playAllAnimationQueue
} = useApp(appStore, pixiApp)

defineExpose({
    displayClass
})

const saveImage = () => {
    pixiApp.view.toBlob(async (blob) => {
        if (blob) {
            const ab = await blob.arrayBuffer()
            const result = await ipcRenderer.invoke('save-image', ab, appStore.getActive().name)
            console.log(result)
        } else {
            console.log('Generate blob failed')
        }
    })
}

</script>

<style scoped>
#global-side {
    right: 0;
    top: 75px;
    height: 75%;
    width: 200px;
    color: white;
    padding: 10px;
    display: flex;
    transition: .5s;
    font-size: 15px;
    overflow: scroll;
    position: absolute;
    background: #333333;
    flex-direction: column;
    border-radius: 10px 0 0 10px;
}

#global-side.show {
    transform: translateX(0);
}

#global-side.hidden {
    transform: translateX(100%);
}

#global-side button {
    border: none;
    color: black;
    padding: 3px 7px;
    cursor: pointer;
    border-radius: 5px;
    box-shadow: gray 0 0 3px;
    background-color: rgb(240, 240, 240);
}

#global-side button:hover {
    background-color: #d5d5d5;
}

#global-side button:active {
    background-color: #bbbbbb;
}

.side-button-small {
    width: 60px;
    white-space: nowrap;
}

.side-button-big {
    width: 80px;
    height: 25px;
    white-space: nowrap;
}

.tips {
    display: flex;
    margin-top: auto;
    align-items: center;
    flex-direction: column;
    font-size: 12px;
    text-align: center;
    gap: 3px;
}
</style>