# alpine-motion

![alpine_motion_example](https://github.com/braedencrankd/alpine-motion/assets/99447151/3614613e-998e-46d0-b531-51b075a4127f)

**View the [demo](https://alpine-motion-examples.vercel.app/).**

**DISCLAIMER: This package is still in active development and is not ready for production use. I'm open to any suggestions on improving this package.**

## Resources

- [Motion One](https://motion.dev/)¸
- [Alpine JS](https://alpinejs.dev/)

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
  - [Using the `x-motion` Directive](#using-the-x-motion-directive)
  - [Nameless Animations](#nameless-animations)
  - [Named animation](#named-animation)
  - [$motion magic ✨](#motion-magic-)
  - [Reactive Animations 🪄](#reactive-animations-)
  - [in-view modifier](#in-view-modifier)
  - [Scroll Triggered Animations 📜](#scroll-triggered-animations-)
  - [Scroll Triggered Animations with Alpine Magic 🪄](#scroll-triggered-animations-with-alpine-magic-)

## Installation

### With a CDN

```html
<script
  defer
  src="https://unpkg.com/@braedencrankd/alpine-motion@latest/dist/alpineMotion.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### With NPM

To install the "alpine-motion" package, you can use npm, pnpm or yarn. Run the following command in your project directory:

```bash
npm install @braedencrankd/alpine-motion
# or
yarn add @braedencrankd/alpine-motion
# or
pnpm install @braedencrankd/alpine-motion
```

## Setup

Import the `alpine-motion` plugin in your project entry point.

```js
import alpineMotion from "alpine-motion";
Alpine.plugin(alpineMotion);
```

## Usage

### Using the `x-motion` Directive

Define the `x-motion` directive on an element to create a motion animation. The following example will create a motion animation that will rotate the element 90 degrees over 1.5 seconds.

_**Note:** make sure to add the `x-init` or `x-data` directive to the container element to ensure the `x-motion` is initialized when Alpine is loaded._

```html
<div x-init>
  <div class="flex flex-wrap gap-2 mb-10">
    <!-- Playing a named animation -->
    <button
      class="px-6 py-1.5 rounded"
      @click="$motion('box-animation-1').play()"
    >
      Play
    </button>
    <!-- Plauing another named animation on the same element -->
    <button
      class="px-6 py-1.5 rounded"
      @click="$motion('box-animation-2').play()"
    >
      Reverse
    </button>
  </div>
  <!-- Defining two different animations on the same element -->
  <div
    x-motion="{
      'box-animation-1': [ { rotate: 90 }, { duration: 1 } ],
      'box-animation-2': [ { rotate: -90 } { duration: 1 } ],
    }"
    class="w-24 h-24 bg-indigo-500 rounded-lg"
  ></div>
</div>
```

### Nameless Animations

The simplist way to declare animations is by creating nameless animation using the `x-motion` directive. Nameless animations are run when the animated element is visible in the viewport.

```html
<div x-motion="{ rotate: 90 }, { duration: 1.5 }">...</div>
```

### Named animation

The alternative method of declaring animations is by creating named animations. This is where you can delcare one or more animations in `x-motion` directive expressions where the name is the key for each animation.

```html
<div
  id="test-1"
  x-motion="{
  'animation-one': [ {x: 100} , { duration: 0.5 } ],
}"
  class="mt-10 w-24 h-24 bg-teal-400 rounded-lg"
></div>
```

The benefit of this syntax is that these animations get put in an Alpine Store where you can run the animations at any point.

### $motion magic ✨

The `$motion` alpine magic is used for getting and executing stored animations.

```html
<button
  class="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
  @click="$motion('box-animation-1').play()"
>
  Play
</button>
```

### Reactive Animations 🪄

Here we are updating the the `currentRotationPos` variable when the buttons are clicked. Because this value is being used in the animation, the animation will run with the updated value.

```html
<div x-data="{currentRotationPos: 0}">
  <div class="flex flex-wrap gap-2 mb-6">
    <button class="px-6 py-1.5 rounded" @click="currentRotationPos += 90;">
      +90
    </button>
    <button class="px-6 py-1.5 rounded" @click="currentRotationPos -= 90;">
      -90
    </button>
  </div>

  <div
    x-motion="{ rotate: currentRotationPos }, { duration: 1.5 }"
    class="w-24 h-24 bg-indigo-500 rounded-lg"
  ></div>
</div>
```

### in-view modifier

The `in-view` modifier is used to trigger animations when the element is in the viewport.

```html
<div
  x-motion.in-view="{
  'in-view-animation': [ { rotate: 90 }, { duration: 1 } ],
}"
>
  ...
</div>
```

### Scroll Triggered Animations 📜

Basic scroll triggered animations are created by adding the `scroll` modifier to the `x-motion` directive.

```html
<div x-motion.scroll="{ rotate: 90 }">...</div>
```

If you need to localize where the scroll starts and stops you can define the `scrollTarget` and `scrollContainer` options.

```html
<div
  x-motion.scroll="{ rotate: 90 }, { scrollTarget: '#scroll-container', scrollContainer: '#scroll-container' }"
>
  ...
</div>
```

### Scroll Triggered Animations with Alpine Magic 🪄

You can also use Alpine Magic to trigger scroll triggered animations.

```html
<div x-init="$nextTick(() => $scroll('scroll-animation'))">
  <div
    x-motion="{
      'scroll-animation': [ { rotate: 90 } ],
    }"
  >
    ...
  </div>
</div>
```
