<template>
    <div class="overlay">
        <div id="export-box">
            <div class="export-option label">
                <label for="export-format" title="Output format">{{ $t('export.outputFormat') }}:&nbsp;&nbsp;</label>
                <label for="export-framerate" title="Framerate">{{ $t('export.framerate') }}:&nbsp;&nbsp;</label>
                <label for="export-filename" title="Filename">{{ $t('export.filename') }}:&nbsp;&nbsp;</label>
                <label for="export-path" title="Output directory">
                    {{ $t('export.outputDirectory') }}:&nbsp;&nbsp;
                </label>
            </div>
            <div class="export-option input">
                <select id="export-format" v-model="store.options.format">
                    <option v-for="(desc, option) in formats" :value="option">{{ desc }}</option>
                </select>
                <input type="number" min="1" max="60"
                       v-model.number="store.options.framerate"
                       id="export-framerate">
                <input type="text" id="export-filename" v-model="store.options.filename" placeholder="output"
                       spellcheck="false">
                <span class="path-select">
                    <input type="text" id="export-path"
                           v-model="store.options.path"
                           :placeholder="$t('export.canNotBeEmpty')"
                           spellcheck="false">
                    <button @click="selectExportPath()" title="Select">{{ $t('export.select') }}</button>
                </span>
            </div>
            <span class="export-progress-show">
                <span class="export-progress-wrapper">
                    <progress id="export-progress" :value="store.progress.current"
                              :max="store.progress.total">
                    </progress>
                </span>
                <span id="progress-show">{{ store.progress.current }}/{{ store.progress.total }}</span>
            </span>
            <span class="export-option button">
                <button @click="store.hide" :disabled="store.running" title="Close">{{ $t('export.close') }}</button>
                <button @click="emit('exportAnimation')" :disabled="store.running">{{ store.status }}</button>
            </span>
        </div>
    </div>
</template>

<script setup>
import {useExportStore} from "@/stores/export";

const store = useExportStore()
const emit = defineEmits(['exportAnimation'])

const selectExportPath = async () => {
    store.options.path = await ipcRenderer.invoke('select-export-path')
}

const formats = {
    'GIF': 'GIF',
    'MP4': 'MP4',
    'GIF-HQ': 'GIF (HQ)',
    'PNG-SEQ': 'PNG Sequence',
}

</script>

<style scoped>
.overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    background-color: rgba(128, 128, 128, 0.3);
}

#export-box {
    padding: 30px;
    color: white;
    width: 450px;
    height: 300px;
    display: flex;
    flex-direction: row;
    background-color: #3a3a3a;
    position: absolute;
    z-index: 999;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 10px;
    box-shadow: #252525 0 0 10px 2px;
}

.export-option.label {
    gap: 10px;
    flex-grow: 2;
    display: flex;
    font-size: 16px;
    flex-direction: column;
    align-items: flex-end;
}

.export-option.label > * {
    line-height: 35px;
    height: 34px;
}

.export-option.input {
    gap: 10px;
    flex-grow: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.export-option.input > * {
    margin: 5px 0;
    height: 20px;
}

.path-select {
    gap: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.export-option input[type='text'] {
    height: 24px;
    border: none;
    padding: 0 5px;
    border-radius: 3px;
}

.export-option input[type='number'] {
    width: 50px;
    border: none;
    height: 24px;
    padding: 5px;
    border-radius: 3px;
}

.export-option button {
    border: none;
    cursor: pointer;
    padding: 3px 12px;
    margin-bottom: 1px;
    border-radius: 5px;
}

.export-option.input select {
    display: block;
    height: 25px;
    padding: 3px 6px;
    font-size: 14px;
    line-height: 1.42857143;
    color: #555;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.export-progress-show {
    left: 30px;
    bottom: 26px;
    display: flex;
    font-size: 18px;
    position: absolute;
}

.export-progress-wrapper {
    margin-right: 10px;
    border-radius: 50px;
    overflow: hidden;
}

#export-progress {
    height: 100%;
    width: 100px;
}

#progress-show {
    font-size: 20px;
    line-height: 24px;
}

.export-option.button {
    display: flex;
    gap: 10px;
    right: 30px;
    bottom: 20px;
    position: absolute;
}

.export-option.button button {
    color: white;
    width: 80px;
    font-size: 16px;
    padding: 7px 0;
    background-color: #7e7e7e;
}

.export-option.button button:hover {
    background-color: #707070;
}

.export-option.button button:active {
    background-color: #606060;
}

.export-option.button button:disabled {
    cursor: not-allowed;
    background-color: #606060;
}

progress {
    background-color: transparent;
}

progress::-webkit-progress-value {
    background-color: #496e49;
    animation: progress 2s ease;
}

@keyframes progress {
    from {
        width: 0;
    }
    to {
        width: 100%;
    }
}
</style>