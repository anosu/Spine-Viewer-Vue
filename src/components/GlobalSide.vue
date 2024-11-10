<template>
    <div id="global-side" :class="displayClass">
        <div class="row">
            <label for="color-input" title="Background Color">背景</label>
            <span class="bg-wrap">
                <span title="Transparent">透明</span>
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
            <button @click="addContainer" title="Add">新增</button>
            <button @click="removeContainer" title="Remove">删除</button>
            <button @click="resetAll" title="Reset All">重置所有</button>
        </div>
        <div class="row">
            <button @click="shiftUpContainer" title="Shift Up">上移</button>
            <button @click="shiftDownContainer" title="Shift Down">下移</button>
            <span class="bg-wrap">
                <span title="Superposition">叠加</span>
                <span class="i-checkbox-wrap">
                    <input type="checkbox" id="superposition" class="i-checkbox"
                           v-model="appStore.superposition">
                    <label for="superposition" class="i-label"></label>
                </span>
             </span>
        </div>
        <div class="row">
            <span title="Current Selection">当前选中：</span>
            <span>{{ appStore.activeIndex }}</span>
        </div>
        <ItemBar/>
        <div class="row">
            <button @click="playAllAnimationQueue" title="Play Queue">播放队列</button>
            <button @click="exportStore.show" title="Export Animation">导出动画</button>
        </div>
        <div class="row">
            <button @click="cancelAllHidden" title="Unhide">取消隐藏</button>
            <button @click="saveImage" title="Save Image">保存图片</button>
        </div>
        <div class="tips">
            <span >Hover over text to get English</span>
            <span title="Press Ctrl+Shift+I to open the console to check errors">Ctrl+Shift+I打开控制台检查报错</span>
            <span title="Middle mouse button collapse/expand">鼠标中键收起/展开</span>
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
            const result = await ipcRenderer.invoke('save-image', ab)
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

.tips {
    display: flex;
    margin-top: auto;
    align-items: center;
    flex-direction: column;
    font-size: 12px;
    gap: 3px;
}
</style>