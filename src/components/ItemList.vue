<template>
    <div class="list">
        <ol>
            <li v-for="(item, i) of items" :key="i">
                <input type="radio" class="list-option"
                       :id="`${i}-${item}`"
                       name="item" :value="i"
                       v-model="activeIndex">
                <label :for="`${i}-${item}`" :title="item">{{ item }}</label>
            </li>
        </ol>
    </div>
</template>

<script setup>
import {useAppStore} from "@/stores/app";
import {storeToRefs} from "pinia";

const {activeIndex, items} = storeToRefs(useAppStore())

</script>

<style scoped>
.list {
    overflow: scroll;
}
</style>