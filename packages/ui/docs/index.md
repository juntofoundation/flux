---
layout: home
---

<div class="hero-img" v-html="UISvg"></div>

<ThreeOrb class="hero__orb"></ThreeOrb>

<div class="container">

<div class="hero">
<div class="hero-content">
<h1 class="hero-title">Build the <span class="funky">future</span> of group collaboration</h1>

<p class="hero-lead">Create custom apps for your community</p>
</div>
</div>

<div class="cards">
  <a href="/ui-library/getting-started/installation.html" class="card">
    <h2 class="card-title">UI Library</h2>
    <p class="card-desc">
    A comprehensive collection of user interface components designed specifically for Flux.
    </p> 
    <button class="card-button">View docs</button>
  </a>
  <a href="/playground.html" class="card">
    <h2 class="card-title">Playground</h2>
    <p class="card-desc">
    Generate UI components for Flux using AI. Build your app in no time.
    </p>
    <button class="card-button">Try the playground</button>
  </a>
  <a href="/create-flux-app/getting-started/installation.html" class="card">
    <h2 class="card-title">Create Flux App</h2>
    <p class="card-desc">
    Get started building custom components and integrating with Flux in just a few clicks.
    </p>
   <button class="card-button">Start building</button>
  </a>
</div>

</div>

<script setup>
import UISvg from './assets/group.svg?raw';
//import ThreeOrb from "./ThreeOrb.vue";

</script>

<style scoped>

.hero__orb {
  position: absolute;
  left: 50%;
  top: 50%;
  height: clamp(400px, 80vw, 1000px);
  /* max-height: 600px; */
  transform: translateX(-50%) translateY(-50%);
  animation: fade-in 1s ease both;
  animation-delay: 0.4s;
  z-index: -1;
}

.container {
  width: 100%;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
  max-width: calc(var(--vp-layout-max-width) - 64px)
}

.hero {
  padding-top: clamp(5rem, 10vw, 10rem);;
  text-align: center;
}

.hero-title {
  text-transform: uppercase;
  font-size: clamp(25px, 5.6vw, 4.2rem);
  max-width: 1100px;
  margin: 0 auto;
  font-family: var(--j-font-family-heading);
  color: var(--j-color-black);
  line-height: 1;
  font-weight: 800;
  margin-bottom: clamp(1rem, 4.6vw, 2rem);
}

.funky {
  color: var(--j-color-primary-500);
  font-family: var(--j-font-family-funky);
}

.hero-lead {
  margin: 0;
  font-size: clamp(18px, 4.6vw, 3rem);
}

.hero-img:deep svg {
  position: fixed;
  top: 0;
  left: 50vw;
  max-height: 100vh;
  transform: translateX(-52%);
  z-index: -2;
  opacity: 0.8;
  margin: 0 auto;
  width: 100%;
  color: var(--j-color-ui-100);
  max-width: 2000px;
}

.cards {
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  justify-content: center;
  gap: 2rem;
}

@media(min-width: 800px) {
  .cards {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.card {
  color: var(--j-color-black);
  border: 1px solid var(--j-color-black);
  border-radius: var(--j-border-radius);
  background: rgba(255,255,255,0.02);
  min-height: 200px;
  text-align: left;
  padding: var(--j-space-700);
  transition: all 0.2s ease;
}

.card:hover {
  background: rgba(255,255,255,0.04);
  filter: brightness(1.3);
}

.card-img * {
  width: 100%;
  max-width: 100%;
  color: var(--j-color-black);
}

.card-title {
  font-family: var(--j-font-family-heading);
  font-size: 1.2rem;
  line-height: 2.8rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.card-desc {
  font-size: 1rem;
  margin-bottom: 2rem;
}

.card-button {
  font-family: inherit;
  cursor: pointer;
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.7rem 1.3rem;
  color: var(--j-color-black);
  border: 1px solid var(--j-color-black);
  border-radius: 300px;
  background: transparent;
}

.card-button:hover,
.card:hover .card-button {
  background: var(--j-color-primary-600);
  border: 1px solid var(--j-primary-600);
  color: var(--j-color-white);
}

</style>