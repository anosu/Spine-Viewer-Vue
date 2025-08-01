<template>
    <HeaderBar/>
    <main id="main">
        <div id="mask" v-show="isShowMask">
            {{ $t('app.dragTip') }}
            <br>
            .skel/.json
        </div>
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
import {getById, getUrlsByPaths, highlight, makeSwitcher} from "@/utils/util";
import {onMounted, provide, ref, toRefs, watch} from "vue";
import {useExportStore} from "@/stores/export";
import {useSceneStore} from "@/stores/scene";
import {useAppStore} from "@/stores/app";
import useApp from "@/hooks/useApp";
import i18n from "@/utils/lang";
import {OutlineFilter} from "@pixi/filter-outline";

document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
        e.preventDefault();
        ipcRenderer.send('open-devtools');
    }
})

ipcRenderer.on('logging', (_ev, logs) => {
    console.log('[INFO] ', logs)
})

const {global: {t}} = i18n

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
pixiApp.loader.pre((resource, next) => {
    pixiApp.loader.defaultQueryString = `t=${Date.now()}`
    next()
})
pixiApp.loader.use((resource, next) => {
    for (const key of [resource.name, resource.url]) {
        PIXI.Texture.removeFromCache(key)
        PIXI.BaseTexture.removeFromCache(key)
    }
    next()
})

const outlineFilter = new OutlineFilter(2, 0x00ff00)

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
    })

    let {format, framerate, filename, path} = exportStore.options

    if (!standard.duration || !path) return

    appStore.containers.forEach(c => c.setAutoUpdate(false))
    if (Number.isNaN(framerate) || framerate < 1 || framerate > 60) {
        framerate = format === 'MP4' ? 30 : 20
    }
    filename = filename.trim() === '' ? 'out' : filename
    const delta = 1 / framerate

    exportStore.running = true
    exportStore.setProgress(0, Math.floor(standard.duration / delta))
    exportStore.setStatus(t('export.rendering'))

    ipcRenderer.invoke('prepare-export').then(() => {
        appStore.containers.forEach((c, i) => {
            const callback = i === standard.index ? onComplete : console.log
            c.playAnimationQueue(callback)
            c.update(0)
        })
        setTimeout(animate, 100)
    })

    function animate() {
        if (exportStore.renderComplete()) {
            ipcRenderer.invoke('compose', {format, framerate, filename, path})
            exportStore.setStatus(t('export.composing'))
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
    exportStore.setStatus(t('export.export'))
    exportStore.setProgress(0, 1)
    exportStore.running = false
})

window.onerror = function (message) {
    if (message.includes('Texture Error')) {
        alert(t('error.textureSizeError'))
        location.reload()
    } else if (message.includes('Region not found')) {
        alert(t('error.spineFileError'))
        location.reload()
    } else if (message.includes("TypeError: Cannot set properties of null (setting 'scale')")) {
        alert(t('error.unsupportedVersionError'))
        location.reload()
    } else if (message.includes('ResizeObserver loop completed')) {
    } else {
        alert(message)
    }
}

function loadFiles(fileUrls) {
    pixiApp.loader
        .reset()
        .add(fileUrls)
        .load(onLoaded)
}

function onLoaded(loader, res) {
    const activeContainer = appStore.getActive()

    const {alphaMode, scaleMode, zoom, timeScale, defaultMix, position} = activeContainer.data
    const {skins, animations, slots} = toRefs(activeContainer.data)

    const newSkins = appStore.superposition ? [...skins.value] : []
    const newAnimations = appStore.superposition ? [...animations.value] : []
    const newSlots = appStore.superposition ? [...slots.value] : []
    const newTextures = appStore.superposition ? activeContainer.textures : []
    const newAtlases = appStore.superposition ? activeContainer.atlases : []

    const validSkeletonAnimations = []

    for (const key in res) {
        if (key.endsWith('skel') || key.endsWith('json')) {
            const splitText = key.split('/')
            activeContainer.name = splitText[splitText.length - 1].split('.')[0]
            try {
                newAtlases.push(res[key].spineAtlas)
                res[key].spineAtlas.pages.forEach(p => {
                    p.baseTexture.alphaMode = alphaMode
                    if (scaleMode !== -1) p.baseTexture.scaleMode = scaleMode
                    newTextures.push(p.baseTexture)
                });
                const skeletonAnimation = new Spine(res[key].spineData)
                skeletonAnimation.position.set(position.x, position.y)
                skeletonAnimation.scale.set(zoom)
                skeletonAnimation.state.timeScale = timeScale
                skeletonAnimation.state.data.defaultMix = defaultMix
                skeletonAnimation.autoUpdate = true

                const currentSkins = skeletonAnimation.spineData.skins.map(s => s.name)
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
                        newAnimations.splice(toRemoveIndex[i], 1)
                    }
                }
                [].push.apply(newSlots, skeletonAnimation.skeleton.slots)

                // 选中插槽
                skeletonAnimation.slotContainers.forEach((slotContainer, index) => {
                    slotContainer.interactive = true
                    slotContainer.buttonMode = true
                    const slot = skeletonAnimation.skeleton.slots[index]
                    slotContainer.on('mouseover', () => {
                        if (!appStore.inspection) return
                        slotContainer.filters = [outlineFilter]
                        document.getElementById('slot-info-name').innerText = `Slot: ${slot.data.name}`
                        document.getElementById('slot-info-attachment').innerText = `Attachment: ${slot.data.attachmentName}`
                    })
                    slotContainer.on('mouseout', () => {
                        slotContainer.filters = null
                        if (!appStore.inspection) return
                        document.getElementById('slot-info-name').innerText = 'Slot:'
                        document.getElementById('slot-info-attachment').innerText = 'Attachment:'
                    })
                    slotContainer.on('click', ev => {
                        if (!appStore.inspection) return
                        const slotIndex = slots.value.indexOf(slot)
                        if (!slotIndex) return
                        const slotId = `${slotIndex}-slot-item`
                        const e = document.getElementById(slotId)
                        if (!e) return
                        e.scrollIntoView({behavior: 'smooth', block: 'center'})
                        highlight(e)
                    })
                })

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
        activeContainer.spineVersion.value = validSkeletonAnimations[0].spineData.version
        validSkeletonAnimations.forEach(a => activeContainer.addSpine(a))
        skins.value = newSkins
        animations.value = newAnimations
        slots.value = newSlots.sort(slotCompare)
        activeContainer.textures = newTextures
        activeContainer.atlases = newAtlases
        activeContainer.data.checkedSkins.length = 0
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
