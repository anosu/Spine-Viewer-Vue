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
        <div class="row">
            <button @click="reloadTexture" title="Reload Texture" class="side-button-big">
                {{ $t('globalSide.reloadTexture') }}
            </button>
        </div>
        <div class="row">
            <span title="Runtime Version" class="side-button-big">{{ $t('globalSide.runtimeVersion') }}: </span>
            <ol class="option-bar">
                <li class="option-item">
                    <input type="radio" name="runtime-version"
                           id="runtime-auto" value="0"
                           v-model.number="runtime.version"
                           class="list-option">
                    <label for="runtime-auto" class="alpha-mode-radio">Auto</label>
                </li>
            </ol>
        </div>
        <div class="row">
            <ol class="option-bar">
                <li v-for="(version, alias) in versions" class="option-item">
                    <input type="radio" name="runtime-version"
                           :id="`runtime-${alias}`" :value="version"
                           v-model.number="runtime.version"
                           class="list-option">
                    <label :for="`runtime-${alias}`" class="alpha-mode-radio">{{ alias }}</label>
                </li>
            </ol>
        </div>
        <div class="tips">
            <span title="Press Ctrl+Shift+I to open the console">{{ $t('globalSide.checkConsole') }}</span>
            <span title="Middle mouse button collapse/expand">{{ $t('globalSide.tips') }}</span>
        </div>
    </div>
</template>

<script setup>
import {inject, ref} from "vue";
import useApp from "@/hooks/useApp";
import {runtime} from "@/utils/patch";
import ItemBar from "@/components/ItemList.vue";
import {useSceneStore} from "@/stores/scene";
import {useAppStore} from "@/stores/app";
import {useExportStore} from "@/stores/export";
import {SPINE_VERSION} from "@pixi-spine/loader-uni";

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

const versions = {
    '3.7': SPINE_VERSION.VER37,
    '3.8': SPINE_VERSION.VER38,
    '4.1': SPINE_VERSION.VER41,
}

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

const reloadTexture = () => {
    const baseTextures = {}
    const container = appStore.getActive()
    container.textures.forEach(texture => {
        const url = texture.resource.url
        baseTextures[url] = url.split('?')[0]
    })
    pixiApp.loader.reset().add(Object.values(baseTextures).map(path => ({
        name: path,
        url: path
    }))).load((loader, resources) => {
        container.textures = Object.values(resources).map(res => res.texture.baseTexture)
        container.textures.forEach(texture => {
            texture.alphaMode = container.data.alphaMode
            texture.update()
        })
        for (const url in baseTextures) {
            const path = baseTextures[url]
            baseTextures[url] = resources[path].texture.baseTexture
        }
        container.stage.children.forEach(spine => {
            spine.skeleton.slots.forEach(slot => {
                const region = slot.attachment?.region
                if (region && region.texture) {
                    const {url} = region.texture.baseTexture.resource
                    const baseTexture = baseTextures[url]
                    if (!baseTexture) return
                    region.page.baseTexture = baseTexture
                    region.texture.baseTexture = baseTexture
                    region.texture.update()
                }
            })
        })
    })

    // container.stage.children.forEach(a => {
    //     const baseTextures = {}
    //     const slots = a.skeleton.slots
    //     slots.forEach(slot => {
    //         const resource = slot.attachment?.region?.texture.baseTexture.resource
    //         if (resource) {
    //             textures[resource.url] = resource.url.split('?')[0]
    //         }
    //     })
    //     pixiApp.loader.reset().add(Object.values(baseTextures).map(path => ({
    //         name: path,
    //         url: path
    //     }))).load((loader, resources) => {
    //         slots.forEach(slot => {
    //             const region = slot.attachment?.region
    //             if (region && region.texture) {
    //                 const textureUrl = baseTextures[region.texture.baseTexture.resource.url]
    //                 if (!textureUrl) return
    //                 const baseTexture = resources[textureUrl].texture.baseTexture
    //                 region.page.baseTexture = baseTexture
    //                 region.texture.baseTexture = baseTexture
    //                 region.texture.update()
    //             }
    //         })
    //     })
    // })
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

.option-bar {
    width: 100%;
    display: flex;
    overflow: hidden;
    font-size: 12px;
    border-radius: 5px;
    background-color: #666666;
    justify-content: space-evenly;
}

.option-bar .alpha-mode-radio {
    width: 100%;
    height: 100%;
    padding: 5px;
    cursor: pointer;
    border-radius: 0;
    overflow: visible;
    transition: all .15s;
    display: inline-block;
}

.option-bar .alpha-mode-radio:hover {
    background-color: #777777;
}

.option-bar input:checked + .alpha-mode-radio {
    background-color: #748d6f;
}

.option-item {
    width: 100%;
    font-size: 13px;
    text-align: center;
}

</style>