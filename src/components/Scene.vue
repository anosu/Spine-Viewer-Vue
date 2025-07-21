<template>
    <div id="display">
        <div id="resolution" v-show="data.resolution.show">
            <div>Width: {{ data.resolution.width }}px</div>
            <div>Height:{{ data.resolution.height }}px</div>
        </div>
        <div id="coordinate" v-show="data.coordinate.show">
            <div>X: {{ data.coordinate.x.toFixed() }}px</div>
            <div>Y: {{ data.coordinate.y.toFixed() }}px</div>
        </div>
        <div id="spine-version" v-show="data.spineVersion">
            <span>Spine {{ data.spineVersion }}</span>
        </div>
        <div id="slot-info" v-show="appStore.inspection">
            <div id="slot-info-name">Slot:</div>
            <div id="slot-info-attachment">Attachment:</div>
        </div>
    </div>
</template>

<script setup>
import {inject, onMounted, reactive, watch} from "vue";
import {getById} from "@/utils/util";
import {useAppStore} from "@/stores/app";

const appStore = useAppStore()

const pixiApp = inject('pixiApp')

const data = reactive({
    resolution: {
        show: false,
        width: 0,
        height: 0
    },
    coordinate: {
        show: true,
        x: appStore.active.container.data.position.x,
        y: appStore.active.container.data.position.y
    },
    spineVersion: null
})

let resizeTimer, resizeTimer2;
const displayObserver = new ResizeObserver((entry) => {
    pixiApp.renderer.resize(entry[0].contentRect.width, entry[0].contentRect.height)
    clearTimeout(resizeTimer)
    clearTimeout(resizeTimer2)
    pixiApp.view.style.opacity = '0'
    data.resolution.show = true
    data.resolution.width = pixiApp.renderer.width
    data.resolution.height = pixiApp.renderer.height
    resizeTimer = setTimeout(() => {
        data.resolution.show = false
    }, 1500)
    resizeTimer2 = setTimeout(() => {
        pixiApp.view.style.opacity = '1'
    }, 100)
});

watch(() => appStore.active.container.data.position.x, x => {
    data.coordinate.x = x
}, {immediate: true})

watch(() => appStore.active.container.data.position.y, y => {
    data.coordinate.y = y
}, {immediate: true})

watch(() => appStore.active.container.spineVersion.value, version => {
    data.spineVersion = version
})

onMounted(() => {
    const display = getById('display')
    // pixiApp.resizeTo = display.value
    display.append(pixiApp.view)
    displayObserver.observe(display);
    appStore.getActive().data.position.x = pixiApp.view.clientWidth / 2
    appStore.getActive().data.position.y = pixiApp.view.clientHeight / 2

    display.addEventListener('contextmenu', (ev) => {
        ev.preventDefault()
        ipcRenderer.send('show-context-menu', {x: ev.x, y: ev.y})
    })
    ipcRenderer.on('copy-image', () => {
        pixiApp.view.toBlob(blob => {
            navigator.clipboard.write([new ClipboardItem({'image/png': blob})])
        })
    })
})

pixiApp.view.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const minScale = 0.01, maxScale = 10;
    const active = appStore.getActive()
    if (ev.ctrlKey) {
        if (!active.background) return
        const originalScale = active.background.scale.x
        const scaleFactor = ev.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.min(Math.max(originalScale * scaleFactor, minScale), maxScale)

        active.background.scale.set(newScale)
        active.background.x -= (ev.offsetX - active.background.x) * (newScale / originalScale - 1);
        active.background.y -= (ev.offsetY - active.background.y) * (newScale / originalScale - 1);
    } else {
        if (active.textures.length <= 0) return
        const originalScale = active.data.zoom
        const scaleFactor = ev.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.min(Math.max(originalScale * scaleFactor, minScale), maxScale)

        active.data.zoom = newScale
        active.data.position.x -= (ev.offsetX - active.data.position.x) * (newScale / originalScale - 1);
        active.data.position.y -= (ev.offsetY - active.data.position.y) * (newScale / originalScale - 1);
    }
})

let isDragging = false;
let mouseX, mouseY, deltaX, deltaY;
pixiApp.view.addEventListener('pointerdown', (ev) => {
    if (appStore.getActive().textures.length === 0 && !appStore.getActive().background) return
    if (ev.button === 0) {
        isDragging = true;
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    }
});
pixiApp.view.addEventListener('pointermove', (ev) => {
    if (isDragging) {
        deltaX = ev.clientX - mouseX;
        deltaY = ev.clientY - mouseY;

        const active = appStore.getActive()
        if (ev.ctrlKey) {
            if (!active.background) return;
            active.background.position.x += deltaX
            active.background.position.y += deltaY
        } else {
            if (active.textures.length === 0) return
            active.data.position.x += deltaX
            active.data.position.y += deltaY
        }

        mouseX = ev.clientX;
        mouseY = ev.clientY;
    }
});
pixiApp.view.addEventListener('pointerup', () => {
    isDragging = false;
});
pixiApp.view.addEventListener('pointerout', () => {
    isDragging = false;
});


</script>

<style scoped>
#display {
    flex-grow: 1;
    overflow: hidden;
    position: relative;
    height: 100% !important;
    background-repeat: no-repeat;
}

#display::before,
#display::after {
    z-index: -1;
    content: "";
    position: absolute;
    background-color: #c8c8c8;
}

#display::before {
    top: 50%;
    width: 100%;
    height: 1px;
}

#display::after {
    left: 50%;
    width: 1px;
    height: 100%;
}

#resolution {
    top: 5px;
    left: 10px;
    z-index: 8;
    color: #d2d2d2;
    position: absolute;
}

#coordinate {
    top: 5px;
    right: 10px;
    z-index: 8;
    color: #d2d2d2;
    position: absolute;
}

#spine-version {
    color: #d2d2d2;
    position: fixed;
    right: 5px;
    bottom: 5px;
}

#slot-info {
    color: #d2d2d2;
    position: absolute;
    z-index: 8;
    left: 10px;
    bottom: 5px;
}
</style>