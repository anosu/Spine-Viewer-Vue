<template>
    <div id="side" ref="controlBar">
        <div class="row">
            <input type="file" ref="fileInput" id="fileInput" multiple accept=".json,.skel" placeholder="">
            <button @click="switchControl" title="Switch collapse/expand">{{ $t('control.collapse') }}</button>
        </div>
        <div class="row">
            <label style="width: 70px" title="Language"> Language </label>
            <select class="select-list" v-model="language">
                <option v-for="(lang, code) in $i18n.messages" :value="code">{{ lang.name }}</option>
            </select>
        </div>
        <div class="row">
            <label for="zoom" class="option-label" title="Zoom">{{ $t('control.zoom') }}</label>
            <input type="range" id="zoom" v-model.number="data.zoom" min="0.1" max="5"
                   step="0.01">
            <span class="option-value">{{ (data.zoom * 100).toFixed() }}%</span>
            <button @click="resetZoom" title="Reset">{{ $t('control.reset') }}</button>
        </div>
        <div class="row">
            <label for="time-scale" class="option-label" title="Speed">{{ $t('control.speed') }}</label>
            <input type="range" id="time-scale" v-model.number="data.timeScale" min="0"
                   max="5"
                   step="0.01">
            <span id="speed-show" class="option-value">{{ data.timeScale.toFixed(2) }}x</span>
            <button @click="resetSpeed" title="Reset">{{ $t('control.reset') }}</button>
        </div>
        <div class="row">
            <label for="default-mix" class="option-label" title="MixTime">{{ $t('control.defaultMix') }}</label>
            <input type="range" id="default-mix" v-model.number="data.defaultMix" min="0"
                   max="2"
                   step="0.1">
            <span id="default-mix-show" class="option-value">
                {{ data.defaultMix.toFixed(1) }}s
            </span>
            <button @click="resetMix" title="Reset">{{ $t('control.reset') }}</button>
        </div>
        <div class="row">
            <span title="Alpha Mode">{{ $t('control.alphaMode') }}</span>
            <ol class="option-bar">
                <li v-for="(alias, mode) in ['NPM', 'UNPACK', 'PMA']">
                    <input type="radio" name="alpha-mode"
                           :id="alias" :value="mode"
                           v-model.number="data.alphaMode"
                           class="list-option">
                    <label :for="alias" class="alpha-mode-radio">{{ alias }}</label>
                </li>
            </ol>
        </div>
        <div class="row">
            <button @click="resetPosition" style="width: 80px" title="Reset Position">
                {{ $t('control.resetPosition') }}
            </button>
            <button @click="pauseAnimation" style="width: 80px" title="Pause Animation">
                {{ $t('control.pauseAnimation') }}
            </button>
        </div>
        <div class="row">
            <button @click="setBackgroundImage" style="width: 80px" title="Set Background">
                {{ $t('control.setBackgroundImage') }}
            </button>
            <button @click="removeBackgroundImage" style="width: 80px" title="Remove Background">
                {{ $t('control.removeBackgroundImage') }}
            </button>
        </div>

        <div class="col">
            <span class="animation-label" title="Skin">{{ $t('control.skin') }}</span>
            <ol class="list">
                <li v-for="(skin, i) of data.skins" :key="i">
                    <input :id="`skin-${skin}`" :value="skin"
                           v-model="data.skins.checked"
                           type="radio" class="list-option">
                    <label :for="`skin-${skin}`" :title="skin">
                        {{ skin }}
                    </label>
                </li>
            </ol>
        </div>
        <div class="col">
            <div class="row-label">
                <span title="Animation" style="max-width: 40px">{{ $t('control.animation') }}</span>
                <ol class="track-wrap">
                    <li v-for="i in 7" :key="i-1">
                        <input type="radio" name="animation-track" :id="`animation-track${i-1}`" :value="i-1"
                               class="track-radio"
                               v-model.number="data.tracks.checked">
                        <label :for="`animation-track${i-1}`" class="animation-track">{{ i - 1 }}</label>
                    </li>
                </ol>
                <button @click="exportStore.show" title="Export">{{ $t('control.export') }}</button>
            </div>
            <ol class="list">
                <li v-for="(animation,i) in data.animations" :key="`${appStore.activeIndex}-${i}`">
                    <input :id="`animation-${animation.name}`"
                           :value="animation.name"
                           v-model="data.tracks[data.tracks.checked]"
                           :true-value="animation.name"
                           :false-value="null"
                           @click="toggleAnimation($event)"
                           type="checkbox" class="list-option">
                    <label :for="`animation-${animation.name}`">
                        <span class="animation-title" :title="animation.name">
                            {{ animation.name }}
                        </span>
                        <span>
                            <button class="add-to-queue"
                                    @click="appStore.getActive().addToQueue(data.tracks.checked, animation)">
                            +
                            </button>
                            {{ animation.duration.toFixed(3) }}s
                        </span>
                    </label>
                </li>
            </ol>
        </div>
        <div class="col">
            <div class="row-label">
                <span title="Animation Queue" style="max-width: 40px">{{ $t('control.queue') }}</span>
                <ol class="track-wrap">
                    <li v-for="i in 7" :key="i-1">
                        <input type="radio" name="animation-queue-track"
                               :id="`animation-queue-track${i-1}`"
                               :value="i-1"
                               class="track-radio"
                               v-model.number="data.queue.checked">
                        <label :for="`animation-queue-track${i-1}`" class="animation-track">{{ i - 1 }}</label>
                    </li>
                </ol>
                <button @click="playAnimationQueue" title="Play">{{ $t('control.play') }}</button>
            </div>
            <ol class="list">
                <li v-for="(animation, i) in data.queue[data.queue.checked]"
                    :key="i">
                    <span>
                        <span class="animation-title" :title="animation.name">
                            {{
                                animation.name === null ? 'empty' : animation.name === undefined ? 'hidden' : animation.name
                            }}
                        </span>
                        <span>{{ animation.duration.toFixed(3) }}s</span>
                    </span>
                </li>
            </ol>
            <div class="row-label functions">
                <button
                    @click="appStore.getActive().clearQueue(data.queue.checked)"
                    title="Reset Current Track">
                    {{ $t('control.clearCurrentTrack') }}
                </button>
                <button
                    @click="appStore.getActive().addEmptyToQueue(data.queue.checked)"
                    title="Add Empty Animation">
                    {{ $t('control.addEmptyAnimation') }}
                </button>
                <button
                    @click="appStore.getActive().addHiddenToQueue(data.queue.checked)"
                    title="Add Hidden-Animation">
                    {{ $t('control.addHiddenAnimation') }}
                </button>
            </div>
        </div>
        <div class="col">
            <span class="row-label">
                <span title="Slot">{{ $t('control.slot') }}</span>
                <input type="text" v-model="data.slotKey"
                       class="slot-key"
                       spellcheck="false"
                       placeholder="keyword">
                <input type="checkbox" v-model="pathSwitch"
                       id="path-switch"
                       class="track-radio">
                <label for="path-switch"
                       class="animation-track"
                       :title="`Switch Path Display\n切换显示插槽当前attachment的path`">P</label>
                <button @click="resetSlots" title="Reset">{{ $t('control.reset') }}</button>
            </span>
            <ol class="list" id="slots">
                <li v-for="(slot, i) of data.slots" :key="i"
                    v-show="(
                        pathSwitch
                        ? slot.attachment?.path || ''
                        : slot.data?.name || ''
                    )
                    .toLowerCase()
                    .includes(data.slotKey.toLowerCase())">
                    <span class="slot-title"
                          :title="pathSwitch ? 'Path: ' + (slot.attachment?.path || null) : slot.data.name">
                        <span class="slot-title-text">
                            {{ pathSwitch ? 'Path: ' + (slot.attachment?.path || null) : slot.data.name }}
                        </span>
                        <span class="i-checkbox-wrap">
                            <input type="checkbox"
                                   :id="`${i}-${slot.data.name}-state`"
                                   class="i-checkbox"
                                   v-model.number="slot.color.a"
                                   :true-value="1"
                                   :false-value="0"
                            >
                            <label :for="`${i}-${slot.data.name}-state`" class="i-label"></label>
                        </span>
                    </span>
                    <div class="slot-alpha">
                        <input :id="`${i}-${slot.data.name}`"
                               name="slot" type="range"
                               v-model.number="slot.color.a"
                               style="width: 200px"
                               min="0" max="1" step="0.01">
                        <span class="slot-alpha-value">{{ slot.color.a.toFixed(2) }}</span>
                    </div>
                </li>
            </ol>
        </div>
    </div>
</template>

<script setup>
import {computed, inject, onMounted, ref, watch} from "vue";
import {createTag, getFileUrl, getUrlsByPaths, makeSwitcher} from "@/utils/util";
import {useExportStore} from "@/stores/export";
import {useAppStore} from "@/stores/app";
import {useI18n} from "vue-i18n";

const i18n = useI18n()

const language = ref(i18n.locale)
const controlBar = ref()
const fileInput = ref()

const appStore = useAppStore()
const exportStore = useExportStore()

const data = computed(() => {
    return appStore.active.container.data
})

const pathSwitch = ref(false)

const pixiApp = inject('pixiApp')

const emit = defineEmits(['load']);

const switchControl = makeSwitcher(true, (ev) => {
    controlBar.value.style.position = 'absolute'
    controlBar.value.style.transform = 'translate(calc(68px - 100%), calc(100% - 40px))'
    ev.target.innerText = i18n.t('control.expand')
}, (ev) => {
    controlBar.value.style.position = 'relative'
    controlBar.value.style.transform = 'none'
    ev.target.innerText = i18n.t('control.collapse')
})

const resetZoom = () => {
    data.value.zoom = 1
}

const resetSpeed = () => {
    data.value.timeScale = 1
}

const resetMix = () => {
    data.value.defaultMix = 0
}

const resetPosition = () => {
    const active = appStore.getActive()
    active.data.position.x = pixiApp.view.clientWidth / 2
    active.data.position.y = pixiApp.view.clientHeight / 2
    active.background?.position.set(pixiApp.view.clientWidth / 2, pixiApp.view.clientHeight / 2)
}

const toggleAnimation = (e) => {
    const active = appStore.getActive()
    if (e.target.checked) {
        const trackIndex = active.data.tracks.checked
        const animationName = e.target.value
        active.setAnimation(trackIndex, animationName, true)
    } else {
        const trackIndex = active.data.tracks.checked
        const mixTime = active.data.defaultMix
        active.setEmptyAnimation(trackIndex, mixTime)
    }
}

const pauseAnimation = () => {
    data.value.timeScale = 0
}

const setBackgroundImage = () => {
    let input = createTag('input')
    input.type = 'file'
    input.setAttribute('accept', '.png,.jpg,.jpeg,.webp')
    input.addEventListener('change', (ev) => {
        const url = getFileUrl(ev.target.files[0].path)
        appStore.getActive().setBackgroundImage(url, pixiApp.view.clientWidth / 2, pixiApp.view.clientHeight / 2)
    })
    input.click()
}

const removeBackgroundImage = () => {
    appStore.getActive().removeBackgroundImage()
}

const resetSlots = () => {
    data.value.slots.forEach(slot => {
        slot.color.a = slot.data.color.a
        // if (slot.currentMesh) {
        //     slot.currentMesh.alpha = 1
        // }
    })
}

const playAnimationQueue = () => {
    const active = appStore.getActive()
    active.stage.alpha = 1
    active.playAnimationQueue(() => {
        active.stage.alpha = 1
        for (let i = 0; i < 7; i++) {
            active.setEmptyAnimation(i, 0)
        }
    })
}

watch(language, value => {
    localStorage.setItem('locale', value)
})

watch(() => data.value.skins.checked, (value) => {
    appStore.getActive().setSkin(value)
})

onMounted(() => {
    fileInput.value.addEventListener('click', () => {
        fileInput.value.value = ''
    })
    fileInput.value.addEventListener('change', () => {
        if (fileInput.value.files.length > 0) {
            const filePaths = Array.from(fileInput.value.files).map(f => f.path).filter(p => p.endsWith('skel') || p.endsWith('json'))
            if (filePaths.length > 0) {
                const fileUrls = getUrlsByPaths(filePaths)
                emit('load', fileUrls)
            }
        }
    })
})

</script>

<style scoped>
input[name='skin'],
input[name='animation'] {
    display: none;
}

[type='range'] {
    -webkit-appearance: none; /* 隐藏默认的样式 */
    height: 10px; /* 设置高度 */
    border-radius: 5px; /* 设置圆角 */
    background: #ddd; /* 设置背景 */
    outline: none; /* 去掉外边框 */
    opacity: 0.7; /* 设置透明度 */
    transition: .2s; /* 添加过渡效果 */
}

[type='range']:hover {
    opacity: 1; /* 鼠标悬停时设置不透明度为1 */
}

[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none; /* 隐藏默认的样式 */
    appearance: none;
    width: 20px; /* 设置滑块的宽度 */
    height: 20px; /* 设置滑块的高度 */
    border-radius: 50%; /* 设置滑块的圆角 */
    background: #91b486; /* 设置滑块的背景 */
    cursor: pointer; /* 添加手形光标 */
}

[type='range']::-moz-range-thumb {
    width: 20px; /* 设置滑块的宽度 */
    height: 20px; /* 设置滑块的高度 */
    border-radius: 50%; /* 设置滑块的圆角 */
    background: #4caf50; /* 设置滑块的背景 */
    cursor: pointer; /* 添加手形光标 */
}

#side {
    z-index: 1;
    color: white;
    width: 300px;
    height: 100%;
    padding: 0 10px;
    transition: .3s;
    overflow: scroll;
    position: relative;
    font-size: 15px;
    background-color: #333333;
    box-shadow: #252525 0 0 2px 1px;
}

#side button {
    width: 42px;
    height: 25px;
    border: none;
    color: black;
    padding: 3px 0;
    cursor: pointer;
    border-radius: 5px;
    box-shadow: gray 0 0 3px;
    background-color: rgb(240, 240, 240);
}

#side button:hover {
    background-color: #d5d5d5;
}

#side button:active {
    background-color: #bbbbbb;
}

#fileInput {
    width: 180px;
    cursor: pointer;
}

.option-bar {
    display: flex;
    overflow: hidden;
    font-size: 12px;
    border-radius: 5px;
    background-color: #666666;
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

.list li .slot-alpha {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
}

.option-label {
    font-size: 15px;
    width: 40px;
}

.option-value {
    width: 36px;
}

.slot-key {
    width: 60%;
    height: 21px;
    border: none;
    padding: 0 10px;
    border-radius: 10px;
}

.slot-title {
    display: flex;
    justify-content: space-between;
}

.slot-title-text {
    width: 200px;
    overflow: hidden;
}

.slot-alpha-value {
    width: 20px;
}

.track-wrap {
    gap: 2px;
    display: flex;
    align-items: center;
    min-width: 166px;
}

.animation-track {
    width: 22px;
    height: 22px;
    cursor: pointer;
    line-height: 22px;
    border-radius: 4px;
    text-align: center;
    display: inline-block;
    background-color: #575757;
}

.track-radio {
    display: none;
}

.track-radio:checked + label.animation-track {
    background-color: #738b70;
}

#side .functions button {
    width: 80px;
}

#side .add-to-queue {
    color: white;
    width: 20px;
    height: 20px;
    background-color: transparent;
}

#side .add-to-queue:hover {
    background-color: #7e7e7e;
}

#side .list-option:checked + label .add-to-queue:hover {
    background-color: #8c8c8c;
}

.animation-title {
    overflow: scroll;
    max-width: 164px;
}

.select-list {
    display: block;
    height: 24px;
    padding: 3px 6px;
    font-size: 14px;
    line-height: 1.42857143;
    color: #555;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 4px;
}

</style>