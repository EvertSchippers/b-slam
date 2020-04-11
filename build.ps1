rm -r build/*
tsc --outDir build
npx webpack --output ../master/dist/main.js --entry ./build