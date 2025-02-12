rm -r build/*
tsc --outDir build
npx webpack -o ..\b-slam-master\dist --entry ./build