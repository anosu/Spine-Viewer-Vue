<template>
    <HeaderBar/>
    <main id="main">
        <div id="mask" v-show="isShowMask">拖拽骨架文件到此</div>
        <ControlBar ref="controlBar" @load="loadFiles"/>
        <MainStage ref="mainStage"/>
        <GlobalSide ref="globalSide"/>
        <ExportModal ref="exportModal" v-show="exportStore.display" @exportAnimation="exportAnimation"/>
    </main>
</template>

<script setup>
import HeaderBar from "@/components/Header.vue";
import MainStage from "@/components/Scene.vue";
import ExportModal from "@/components/Export.vue";
import ControlBar from "@/components/Control.vue";
import GlobalSide from "@/components/GlobalSide.vue";
import * as PIXI from 'pixi.js'
import {Spine} from "pixi-spine";
import {getById, getUrlsByPaths, makeSwitcher} from "@/utils/util";
import {computed, onMounted, provide, ref, toRefs, watch} from "vue";
import {useExportStore} from "@/stores/export";
import {useSceneStore} from "@/stores/scene";
import {useAppStore} from "@/stores/app";
import useApp from "@/hooks/useApp";

ipcRenderer.on('logs-out', (_ev, logs) => {
    console.log('logs: ', logs)
})

// 子组件
const controlBar = ref()
const mainStage = ref()
const globalSide = ref()
const exportModal = ref()

// Store
const appStore = useAppStore()
const exportStore = useExportStore()
const sceneStore = useSceneStore()

// Switcher
const switchSide = makeSwitcher(true, () => {
    globalSide.value.displayClass = 'hidden'
}, () => {
    globalSide.value.displayClass = 'show'
})

// 响应式变量
let isShowMask = ref(false)

const pixiApp = new PIXI.Application({
    antialias: true,
    autoDensity: true,
    backgroundAlpha: 0,
    preserveDrawingBuffer: true,
    resolution: window.devicePixelRatio
});

provide('pixiApp', pixiApp)

const {addContainer, cancelAllHidden} = useApp(appStore, pixiApp)

addContainer()

const exportAnimation = () => {
    const standard = {
        index: 0,
        duration: 0
    }
    appStore.containers.forEach((c, i) => {
        const info = c.getQueueInfo()
        if (info.totalDuration > standard.duration) {
            standard.index = i
            standard.duration = info.totalDuration
        }
        c.setAutoUpdate(false)
    })

    let {format, framerate, filename, path} = exportStore.options

    if (!standard.duration || !path) return
    if (Number.isNaN(framerate) || framerate < 1 || framerate > 60) {
        framerate = format === 'MP4' ? 30 : 20
    }
    filename = filename.trim() === '' ? 'out' : filename
    const delta = 1 / framerate

    exportStore.running = true
    exportStore.setProgress(0, Math.floor(standard.duration / delta))
    exportStore.setStatus('渲染中')

    ipcRenderer.invoke('prepare-export', filename).then(() => {
        appStore.containers.forEach((c, i) => {
            const callback = i === standard.index ? onComplete : console.log
            c.playAnimationQueue(callback)
            c.update(0)
        })
        setTimeout(animate, 100)
    })

    function animate() {
        if (exportStore.renderComplete()) {
            ipcRenderer.invoke('ffmpeg', {format, framerate, filename, path})
            exportStore.setStatus('合成中')
            appStore.containers.forEach(c => {
                c.update(standard.duration)
            })
            return
        }
        const index = exportStore.progress.current
        const imageData = pixiApp.view.toDataURL('image/png')
        ipcRenderer.invoke('save-image-cache', {
            index: String(index).padStart(5, '0'),
            data: imageData
        }).then(() => {
            exportStore.setProgress(index + 1)
            appStore.containers.forEach(c => {
                c.update(delta)
            })
            animate()
        })

    }

    function onComplete() {
        cancelAllHidden()
        appStore.containers.forEach(c => {
            c.setAutoUpdate(true)
        })
    }

}

ipcRenderer.on('export-complete', () => {
    exportStore.setStatus('导出')
    exportStore.setProgress(0, 1)
    exportStore.running = false
})

window.onerror = function (message) {
    if (message.includes('Texture Error')) {
        console.error(message)
        alert('贴图尺寸与图集不符合！')
        location.reload()
    }
};

function loadFiles(fileUrls) {
    pixiApp.loader
        .reset()
        .add(fileUrls)
        .load(onLoaded)
}

function onLoaded(loader, res) {
    const activeContainer = appStore.getActive()

    const {alphaMode, zoom, timeScale, defaultMix, position} = activeContainer.data
    const {skins, animations, slots} = toRefs(activeContainer.data)

    const newSkins = appStore.superposition ? [...skins.value] : []
    const newAnimations = appStore.superposition ? [...animations.value] : []
    const newSlots = appStore.superposition ? [...slots.value] : []
    const newTextures = appStore.superposition ? activeContainer.textures : []

    const validSkeletonAnimations = []

    for (const key in res) {
        if (key.endsWith('skel') || key.endsWith('json')) {
            const splitText = key.split('/')
            activeContainer.name = splitText[splitText.length - 1].split('.')[0]
            try {
                res[key].spineAtlas.pages.forEach(p => {
                    p.baseTexture.alphaMode = alphaMode
                    newTextures.push(p.baseTexture)
                });
                const skeletonAnimation = new Spine(res[key].spineData);
                skeletonAnimation.position.set(position.x, position.y)
                skeletonAnimation.scale.set(zoom)
                skeletonAnimation.state.timeScale = timeScale
                skeletonAnimation.state.data.defaultMix = defaultMix
                skeletonAnimation.autoUpdate = true

                const currentSkins = skeletonAnimation.spineData.skins.map(s => s.name);
                const currentAnimations = skeletonAnimation.spineData.animations.map(a => {
                    return {
                        name: a.name,
                        duration: a.duration
                    }
                });

                [].push.apply(newSkins, currentSkins.filter(s => !newSkins.includes(s)))
                if (newAnimations.length === 0) {
                    [].push.apply(newAnimations, currentAnimations)
                } else {
                    const toRemoveIndex = []
                    for (let i = 0; i < newAnimations.length; i++) {
                        if (!currentAnimations.map(a => a.name).includes(newAnimations[i].name)) {
                            toRemoveIndex.push(i)
                        }
                    }
                    for (let i = toRemoveIndex.length - 1; i > -1; i--) {
                        newAnimations.splice(toRemoveIndex[i], 1);
                    }
                }
                [].push.apply(newSlots, skeletonAnimation.skeleton.slots)
                validSkeletonAnimations.push(skeletonAnimation)
            } catch (e) {
                console.error(e)
                const splitText = key.split('/')
                alert('Load failed: ' + splitText[splitText.length - 1])
            }
        }
    }
    if (validSkeletonAnimations.length > 0) {
        if (!appStore.superposition) {
            activeContainer.stage.removeChildren()
            if (activeContainer.background) activeContainer.stage.addChild(activeContainer.background)
        }
        validSkeletonAnimations.forEach(a => activeContainer.stage.addChild(a))
        skins.value = newSkins;
        animations.value = newAnimations;
        slots.value = newSlots.sort(slotCompare)
        activeContainer.textures = newTextures
        activeContainer.data.tracks.length = 0
        activeContainer.data.queue.forEach(q => q.length = 0)
        appStore.items[appStore.activeIndex] = activeContainer.name
    }

    function slotCompare(slot1, slot2) {
        if (!slot1?.data.name || !slot2?.data.name) {
            return 0
        }
        if (slot1.data.name > slot2.data.name) {
            return 1
        }
        if (slot1.data.name < slot2.data.name) {
            return -1
        }
        return 0
    }

}


onMounted(() => {
    getById('main').addEventListener('mousedown', (ev) => {
        if (ev.button === 1) {
            ev.preventDefault()
            switchSide()
        }
    })
    getById('main').addEventListener('dragover', (ev) => {
        ev.preventDefault()
        isShowMask.value = true

    })
    getById('mask').addEventListener('dragleave', (ev) => {
        ev.preventDefault()
        isShowMask.value = false
    })
    getById('main').addEventListener('drop', (ev) => {
        ev.preventDefault()
        isShowMask.value = false
        const filePaths = Array.from(ev.dataTransfer.files).map(f => f.path).filter(p => p.endsWith('skel') || p.endsWith('json'))
        if (filePaths.length > 0) {
            const fileUrls = getUrlsByPaths(filePaths)
            loadFiles(fileUrls)
        }
    })
})

watch(() => sceneStore.transparent, (transparent) => {
    if (transparent) {
        pixiApp.renderer.backgroundColor = 0
        pixiApp.renderer.backgroundAlpha = 0
    } else {
        const savedColor = sceneStore.getSavedColor()
        pixiApp.renderer.backgroundColor = +savedColor.replace('#', '0x')
        pixiApp.renderer.backgroundAlpha = 1
    }
})

watch(() => sceneStore.backgroundColor, (color) => {
    pixiApp.renderer.backgroundColor = +color.replace('#', '0x')
    sceneStore.saveColor(color)
})

</script>

<style scoped>
main {
    flex-grow: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    align-items: self-start;
    justify-content: space-between;
}

#mask {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
    color: white;
    display: flex;
    font-size: 48px;
    position: absolute;
    align-items: center;
    justify-content: center;
    background-color: rgba(111, 111, 111, .5);
}
</style>
