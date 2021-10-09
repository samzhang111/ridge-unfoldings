# Interactive Javascript visualization of ridge unfoldings of 4d polytopes

The code behind [https://sam.zhang.fyi/html/unfolding/index.html](https://sam.zhang.fyi/html/unfolding/index.html).

## Development

* Install node, npm, yarn.
* Run `yarn` to install dependencies.
* Type `yarn webpack serve` to run webpack development server.
* Type `yarn webpack` to create production version in `dist/` folder.

## Application structure

The cube portion of the app has a bit more algorithmic logic compared to the simplex/orthoplex, which rely on linear algebra and reflections.
The app is initialized within `src/index.js`, where the details specific to cubes, simplices, and orthoplexes are glued together with shared logic.
The graph controller is written in JSXGraph and in `shared-controls.js`, with specific logic in `unfoldcube.js` and `unfoldplex.js` and some parts of `index.js`.
The cube has some tests, in `unfoldcube.test.js`, which you can run using `yarn jest`.
The unfolded 3d net is displayed using three.js, and shared logic is in `shared-three.js`, with specifics to the cubes in `three-cube.js` and specifics to the simplex and orthoplex in `three-plex.js`.
