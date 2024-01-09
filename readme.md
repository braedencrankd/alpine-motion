# alpine-motion

**DISCLAIMER: This package is still in active development and is not ready for production use. I'm open to any suggestions on improving this package.**

An AlpineJS plugin to create a SwiperJS slider using the elegance alpine directives.

## Resources

- [Motion One](https://motion.dev/)
- [Alpine JS](https://alpinejs.dev/)

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Modifiers Syntax](#modifiers-syntax)
  - [Options Syntax](#options-syntax)

## Installation

To install the "alpine-swiper" package, you can use npm, pnpm or yarn. Run the following command in your project directory:

```bash
npm install @braedencrankd/alpine-motion
# or
yarn add @braedencrankd/alpine-motion
# or
pnpm add @braedencrankd/alpine-motion
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

_**Note:** make sure to add the `x-init` or `x-data` directive to the container element to ensure the swiper is initialized when Alpine is loaded._

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
    <!-- Pausing an animation -->
    <button
      class=" px-6 py-1.5 rounded bg-green-500 text-white"
      @click="$motion('box-animation-1').pause()"
    >
      Pause
    </button>
  </div>
  <!-- Defining two different animations on the same element -->
  <div
    x-motion:box-animation-1.rotate.90deg.duration.1500ms
    x-motion:box-animation-2.rotate.-90deg.duration.1500ms
    class="w-24 h-24 bg-indigo-500 rounded-lg"
  ></div>
</div>
```

### Modifiers Syntax

The simplist way to configure animation is to use modifiers. Modifiers come in pairs of `property` and `value`. The following example will create a motion animation that will rotate the element 90 degrees over 1.5 seconds.

```html
<div x-motion:box-animation-1.rotate.90deg.duration.1500ms>...</div>
```

_Note: Each modifier corresponds to the options defined by the Motion One package: the documentation can be found [here](https://motion.dev/dom/animate)._

### Options Syntax

Alternativly you can pass a list of objects to the `x-motion` directive.

```html
<div x-motion:box-animation-three="{ rotate: 90 }, { duration: 1.5 }">...</div>
```

The benefit of this syntax is that you can pass Alpine data into the values of the object. For example:

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
    x-motion:box-animation-three="{ rotate: currentRotationPos }, { duration: 1.5 }"
    class="w-24 h-24 bg-indigo-500 rounded-lg"
  ></div>
</div>
```
