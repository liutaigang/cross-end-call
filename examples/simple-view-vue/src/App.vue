<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import { useWebviewPublicPath } from '@/hooks/use-webview-public-path'
import { useCall } from './hooks/use-cec-client';
import logPath from '@/assets/logo.svg'

const logoUrl = useWebviewPublicPath(logPath)
const message = ref('')

</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" :src="logoUrl" width="125" height="125" />
    <div class="example-block">
      <h2>Vscode 提示演示</h2>
      <label for="webview-message-input">请输入提示消息：</label>
      <input type="text" id="webview-message-input" v-model="message" />
      <button @click="useCall('showInformationMessage', message)">显示提示</button>
    </div>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
.example-block {
  margin: 50px 0;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
